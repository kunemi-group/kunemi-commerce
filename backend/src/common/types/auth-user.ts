import type { UserRole } from '../../database/entities/user.entity';

export type JwtPayload = {
  sub: string;
  /**
   * Business id for Workspace staff.
   * Empty string for ShopFlow end users and platform admins (never a real UUID).
   */
  businessId: string;
  role: UserRole;
  email: string;
};

export type AuthUser = JwtPayload;

/** Workspace business seat: Owner or Team. */
export function isStaff(user: AuthUser): boolean {
  return (
    Boolean(user.businessId) && (user.role === 'owner' || user.role === 'team')
  );
}

/** Product: Owner */
export function isOwner(user: AuthUser): boolean {
  return user.role === 'owner' && Boolean(user.businessId);
}

/** Product: Team */
export function isTeam(user: AuthUser): boolean {
  return user.role === 'team' && Boolean(user.businessId);
}

export function isUser(user: AuthUser): boolean {
  return user.role === 'user';
}

export function isBuyer(user: AuthUser): boolean {
  return user.role === 'user';
}

export function isPlatformAdmin(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === 'super_admin';
}

/** Staff-only business scope */
export function hasBusinessContext(user: AuthUser): boolean {
  return Boolean(user.businessId) && isStaff(user);
}
