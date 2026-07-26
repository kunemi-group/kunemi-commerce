import type { UserRole } from '../../database/entities/user.entity';

export type JwtPayload = {
  sub: string;
  businessId: string;
  role: UserRole;
  email: string;
};

export type AuthUser = JwtPayload;
