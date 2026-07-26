import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  Observable,
  from,
  of,
  switchMap,
  catchError,
  finalize,
} from 'rxjs';
import type { AuthUser } from '../types/auth-user';

/**
 * Sets Postgres session GUC for RLS when using Postgres:
 *   set_config('app.current_business_id', '<uuid>', false)
 * Cleared after the request. Skipped for SQLite.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private readonly isPostgres: boolean;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {
    const dbType = this.config.get<string>('DATABASE_TYPE', 'postgres');
    this.isPostgres = dbType !== 'sqlite' && dbType !== 'better-sqlite3';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const businessId = req.user?.businessId;
    if (!businessId || !this.dataSource.isInitialized || !this.isPostgres) {
      return next.handle();
    }

    return from(
      this.dataSource.query(
        `SELECT set_config('app.current_business_id', $1, false)`,
        [businessId],
      ),
    ).pipe(
      catchError(() => of(null)),
      switchMap(() => next.handle()),
      finalize(() => {
        void this.dataSource
          .query(`SELECT set_config('app.current_business_id', '', false)`)
          .catch(() => undefined);
      }),
    );
  }
}
