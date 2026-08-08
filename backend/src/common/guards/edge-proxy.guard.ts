import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EdgeProxyGuard implements CanActivate {
  private readonly expectedSecret: string;

  constructor(private readonly config: ConfigService) {
    this.expectedSecret = this.config.get<string>(
      'PLATFORM_SECRET',
      'kunemi-edge-secret-key-change-in-prod',
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const secret = request.headers['x-platform-secret'];

    if (!secret || secret !== this.expectedSecret) {
      throw new UnauthorizedException('Request must originate from Cloudflare Edge Platform Proxy');
    }

    return true;
  }
}
