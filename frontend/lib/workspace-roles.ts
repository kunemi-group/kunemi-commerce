import type { UserRole } from "@/api/types"

/** Product surface roles: Owner | Team only. */
export type ProductStaffRole = "owner" | "team"

/** API role for non-owner staff invites / updates. */
export const TEAM_API_ROLE = "team" as const satisfies UserRole

export function isOwnerRole(role?: string | null): boolean {
  return role === "owner"
}

/** Non-owner Workspace seat. */
export function isTeamMemberRole(role?: string | null): boolean {
  return role === "team"
}

export function productRoleLabel(role?: string | null): string {
  if (!role) return "—"
  if (role === "owner") return "Owner"
  if (role === "team") return "Team"
  if (role === "admin" || role === "super_admin") return "Admin"
  // Legacy rows (should be migrated): still display as Team
  if (
    role === "sales" ||
    role === "ops" ||
    role === "manager" ||
    role === "agent"
  ) {
    return "Team"
  }
  return role
}

/** Map product picker → API role. */
export function toApiStaffRole(product: ProductStaffRole): UserRole {
  return product === "owner" ? "owner" : TEAM_API_ROLE
}

export function toProductStaffRole(apiRole?: string | null): ProductStaffRole {
  return apiRole === "owner" ? "owner" : "team"
}
