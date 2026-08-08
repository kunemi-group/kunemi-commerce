"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { teamMembers, type TeamMember } from "@/lib/data"
import type { UserRole } from "@/api/types"

/**
 * System roles aligned with NestJS backend UserRole entity:
 * - Staff: "owner" | "manager" | "sales" | "ops"
 * - End User: "user"
 * - Platform Admin: "admin" | "super_admin"
 */
export type AppRole = UserRole

type RoleContextValue = {
  role: AppRole
  setRole: (role: AppRole) => void
  user: TeamMember
  dense: boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

const STORAGE_KEY = "kunemi-workspace-role"

const VALID_ROLES: UserRole[] = [
  "owner",
  "manager",
  "sales",
  "ops",
  "user",
  "admin",
  "super_admin",
]

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<AppRole>("owner")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppRole | null
      if (saved && VALID_ROLES.includes(saved)) {
        setRoleState(saved)
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  const setRole = useCallback((next: AppRole) => {
    setRoleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const user = useMemo(() => {
    if (role === "owner" || role === "admin" || role === "super_admin") {
      return teamMembers.find((a) => a.role === "owner") ?? teamMembers[0]
    }
    return (
      teamMembers.find((a) => a.role === role) ??
      teamMembers.find((a) => a.role === "sales") ??
      teamMembers[1]
    )
  }, [role])

  const value = useMemo(
    () => ({
      role: hydrated ? role : "owner",
      setRole,
      user,
      dense: role === "sales" || role === "ops",
    }),
    [role, setRole, user, hydrated],
  )

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) {
    throw new Error("useRole must be used within RoleProvider")
  }
  return ctx
}
