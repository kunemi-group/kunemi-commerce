import type { UserRole } from '../../database/entities/user.entity';

export type JwtPayload = {
  sub: string;
  /**
   * Business id for Workspace staff.
   * Empty string for ShopFlow buyers (never a real UUID).
   */
  businessId: string;
  role: UserRole;
  email: string;
};

export type AuthUser = JwtPayload;

export function isStaff(user: AuthUser): boolean {
  return (
    user.role === 'owner' ||
    user.role === 'manager' ||
    user.role === 'sales' ||
    user.role === 'ops'
  );
}

export function isBuyer(user: AuthUser): boolean {
  return user.role === 'buyer';
}

/** Staff-only business scope — throws conceptually at call sites that need a real id */
export function hasBusinessContext(user: AuthUser): boolean {
  return Boolean(user.businessId) && isStaff(user);
}
