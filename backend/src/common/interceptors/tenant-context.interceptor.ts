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
 * Sets Postgres session GUCs for RLS:
 *   app.current_business_id — staff tenant scope
 *   app.current_user_id — buyer chat scope (and general identity)
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
    const req = context.switchToHttp().getRequest<{
      user?: AuthUser;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const user = req.user;

    // Check Cloudflare Edge Proxy headers
    const platformSecret = this.config.get<string>(
      'PLATFORM_SECRET',
      'kunemi-edge-secret-key-change-in-prod',
    );
    const reqSecret = req.headers['x-platform-secret'];
    const isSignedByEdge = typeof reqSecret === 'string' && reqSecret === platformSecret;
    const edgeTenantId = isSignedByEdge && typeof req.headers['x-tenant-id'] === 'string'
      ? req.headers['x-tenant-id']
      : '';

    // Platform Admins (admin, super_admin) bypass single-tenant RLS to access cross-tenant data
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return next.handle();
    }

    const businessId = user?.businessId || edgeTenantId || '';
    const userId = user?.sub || '';

    if ((!businessId && !userId) || !this.dataSource.isInitialized || !this.isPostgres) {
      return next.handle();
    }

    return from(
      Promise.all([
        this.dataSource.query(
          `SELECT set_config('app.current_business_id', $1, false)`,
          [businessId],
        ),
        this.dataSource.query(
          `SELECT set_config('app.current_user_id', $1, false)`,
          [userId],
        ),
      ]),
    ).pipe(
      catchError(() => of(null)),
      switchMap(() => next.handle()),
      finalize(() => {
        void Promise.all([
          this.dataSource.query(
            `SELECT set_config('app.current_business_id', '', false)`,
          ),
          this.dataSource.query(
            `SELECT set_config('app.current_user_id', '', false)`,
          ),
        ]).catch(() => undefined);
      }),
    );
  }
}
