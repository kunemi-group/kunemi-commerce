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

/**
 * Session persona for the demo shell:
 * - owner → full admin dashboard
 * - agent → sales team member (human) dense workspace — not an AI agent
 */
export type AppRole = "owner" | "agent"

type RoleContextValue = {
  role: AppRole
  setRole: (role: AppRole) => void
  user: TeamMember
  dense: boolean
}

const RoleContext = createContext<RoleContextValue | null>(null)

const STORAGE_KEY = "kunemi-workspace-role"

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<AppRole>("owner")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppRole | null
      if (saved === "owner" || saved === "agent") setRoleState(saved)
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
    if (role === "owner") {
      return teamMembers.find((a) => a.role === "owner") ?? teamMembers[0]
    }
    // Demo "sales person" login uses a human sales seat
    return teamMembers.find((a) => a.role === "sales") ?? teamMembers[1]
  }, [role])

  const value = useMemo(
    () => ({
      role: hydrated ? role : "owner",
      setRole,
      user,
      dense: role === "agent",
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
