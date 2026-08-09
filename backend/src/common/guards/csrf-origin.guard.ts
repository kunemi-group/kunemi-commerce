import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../auth/session-cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(config: ConfigService) {
    this.allowedOrigins = new Set(
      config
        .get<string>('CORS_ORIGIN', '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    const cookieHeader = request.headers.cookie ?? '';
    const usesCookieSession =
      cookieHeader.includes(`${ACCESS_TOKEN_COOKIE}=`) ||
      cookieHeader.includes(`${REFRESH_TOKEN_COOKIE}=`);
    if (!usesCookieSession) return true;

    const origin = request.headers.origin;
    if (!origin || !this.allowedOrigins.has(origin)) {
      throw new ForbiddenException('Request origin is not allowed');
    }
    return true;
  }
}
