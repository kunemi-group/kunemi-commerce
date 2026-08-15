"use client"

/**
 * Legacy RoleProvider kept so Providers still mount.
 * Product roles are Owner + Team via auth user + workspace-roles helpers.
 * Do not reintroduce a demo role switcher.
 */

import { createContext, useContext, useMemo } from "react"
import type { UserRole } from "@/api/types"
import { useAuth } from "@/lib/auth-context"
import { isOwnerRole, productRoleLabel } from "@/lib/workspace-roles"

export type AppRole = UserRole

type RoleContextValue = {
  role: AppRole
  /** @deprecated No-op — real role comes from auth session */
  setRole: (role: AppRole) => void
  user: {
    id: string
    name: string
    initials: string
    role: string
  }
  dense: boolean
  isOwner: boolean
  productRole: string
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth()

  const value = useMemo((): RoleContextValue => {
    const role = (authUser?.role as AppRole) || "owner"
    const name = authUser?.fullName ?? "Account"
    const initials = name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    return {
      role,
      setRole: () => {
        /* session role only */
      },
      user: {
        id: authUser?.id ?? "",
        name,
        initials: initials || "?",
        role: productRoleLabel(role),
      },
      dense: false,
      isOwner: isOwnerRole(role),
      productRole: productRoleLabel(role),
    }
  }, [authUser])

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) {
    throw new Error("useRole must be used within RoleProvider")
  }
  return ctx
}
