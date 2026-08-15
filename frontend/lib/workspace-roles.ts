import type { UserRole } from "@/api/types"

/** Product surface roles (backend still stores owner | sales | legacy). */
export type ProductStaffRole = "owner" | "team"

/** Backend role used for all non-owner staff invites. */
export const TEAM_API_ROLE = "sales" as const satisfies UserRole

export function isOwnerRole(role?: string | null): boolean {
  return role === "owner"
}

/** Staff who work the floor (includes legacy manager/sales/ops). */
export function isTeamMemberRole(role?: string | null): boolean {
  return (
    role === "sales" || role === "ops" || role === "manager" || role === "agent"
  )
}

export function productRoleLabel(role?: string | null): string {
  if (!role) return "—"
  if (role === "owner") return "Owner"
  if (role === "admin" || role === "super_admin") return "Admin"
  if (isTeamMemberRole(role)) return "Team"
  return role
}

/** Map product picker → API role for invites / role updates. */
export function toApiStaffRole(product: ProductStaffRole): UserRole {
  return product === "owner" ? "owner" : TEAM_API_ROLE
}

export function toProductStaffRole(apiRole?: string | null): ProductStaffRole {
  return apiRole === "owner" ? "owner" : "team"
}
