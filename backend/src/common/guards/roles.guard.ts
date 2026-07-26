import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../database/entities/user.entity';
import type { AuthUser } from '../types/auth-user';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user?.role) {
      throw new ForbiddenException('Missing role');
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `Requires role: ${required.join(' or ')} (you are ${user.role})`,
      );
    }
    return true;
  }
}
