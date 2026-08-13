import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Observable } from 'rxjs';
import type { AuthUser } from '../types/auth-user';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TenantDatabaseContextService } from '../services/tenant-database-context.service';

/**
 * Runs Postgres requests inside one query-runner transaction. Repository calls
 * made during the request are routed to that runner, so transaction-local RLS
 * settings cannot leak through the connection pool.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantContextInterceptor.name);
  private readonly isPostgres: boolean;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantDatabaseContextService,
  ) {
    const dbType = this.config.get<string>('DATABASE_TYPE', 'postgres');
    this.isPostgres = dbType !== 'sqlite' && dbType !== 'better-sqlite3';
    if (this.isPostgres) this.installRequestAwareDataSource();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      user?: AuthUser;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const user = req.user;
    const isPublic = Boolean(
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
    );

    if (!this.dataSource.isInitialized || !this.isPostgres) return next.handle();

    const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'admin';
    const platformSecret = this.config.get<string>('PLATFORM_SECRET', '');
    const reqSecret = req.headers['x-platform-secret'];
    const isSignedByEdge =
      Boolean(platformSecret) && typeof reqSecret === 'string' && reqSecret === platformSecret;
    const edgeTenantId =
      isSignedByEdge && typeof req.headers['x-tenant-id'] === 'string'
        ? req.headers['x-tenant-id']
        : '';
    const businessId = user?.businessId || edgeTenantId || '';
    const userId = user?.sub || '';

    // Health/root routes are not tenant database operations.
    if (!isPublic && !businessId && !userId && !isPlatformAdmin) return next.handle();

    return new Observable((subscriber) => {
      const queryRunner = this.dataSource.createQueryRunner('master');
      const originalRelease = queryRunner.release;
      const releaseQueryRunner = originalRelease.bind(queryRunner);
      let settled = false;

      const finish = async (error?: unknown) => {
        if (settled) return;
        settled = true;
        try {
          if (queryRunner.isReleased) {
            if (error) subscriber.error(error);
            else subscriber.complete();
          } else if (error && queryRunner.isTransactionActive) {
            await queryRunner.rollbackTransaction();
            subscriber.error(error);
          } else if (!error && queryRunner.isTransactionActive) {
            await queryRunner.commitTransaction();
            subscriber.complete();
          } else if (error) {
            subscriber.error(error);
          } else {
            subscriber.complete();
          }
        } catch (transactionError) {
          subscriber.error(transactionError);
        } finally {
          queryRunner.release = originalRelease;
          if (!queryRunner.isReleased) await releaseQueryRunner();
        }
      };

      void (async () => {
        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();
          await queryRunner.query(`SELECT set_config('app.current_business_id', $1, true)`, [businessId]);
          await queryRunner.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
          await queryRunner.query(`SELECT set_config('app.is_platform_admin', $1, true)`, [String(isPlatformAdmin)]);
          await queryRunner.query(`SELECT set_config('app.is_public', $1, true)`, [String(isPublic)]);

          // TypeORM assumes that a query runner returned by createQueryRunner
          // is owned by the operation that requested it and may release it
          // after save/remove. The interceptor owns this runner for the whole
          // request, so nested ORM operations must not release it early.
          queryRunner.release = async () => undefined;

          this.tenantContext.run(
            { queryRunner, businessId, userId, isPlatformAdmin, isPublic },
            () => {
              try {
                next.handle().subscribe({
                  next: (value) => subscriber.next(value),
                  error: (error) => void finish(error),
                  complete: () => void finish(),
                });
              } catch (error) {
                void finish(error);
              }
            },
          );
        } catch (error) {
          this.logger.error(
            'Failed to establish tenant transaction; request rejected',
            error instanceof Error ? error.stack : undefined,
          );
          await queryRunner.release();
          subscriber.error(new ServiceUnavailableException('Tenant database context is unavailable'));
        }
      })();
    });
  }

  private installRequestAwareDataSource() {
    const dataSource = this.dataSource as DataSource & { __tenantContextInstalled?: boolean };
    if (dataSource.__tenantContextInstalled) return;

    const originalCreateQueryRunner = dataSource.createQueryRunner.bind(dataSource);
    dataSource.createQueryRunner = ((mode?: 'master' | 'slave') => {
      const current = this.tenantContext.current;
      return current?.queryRunner ?? originalCreateQueryRunner(mode);
    }) as DataSource['createQueryRunner'];

    const originalTransaction = dataSource.transaction.bind(dataSource);
    dataSource.transaction = (async (...args: Parameters<DataSource['transaction']>) => {
      const current = this.tenantContext.current;
      if (current) {
        const callback = args[args.length - 1] as (manager: DataSource['manager']) => unknown;
        return callback(current.queryRunner.manager) as never;
      }
      return originalTransaction(...args);
    }) as DataSource['transaction'];
    dataSource.__tenantContextInstalled = true;
  }
}
