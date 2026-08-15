"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  changePasswordRequest,
  fetchMe,
  loginRequest,
  logoutLocal,
  registerRequest,
  updateBusinessRequest,
  queryKeys,
  type AuthUser,
  type BusinessProfile,
} from "@/api"

type AuthContextValue = {
  user: AuthUser | null
  business: BusinessProfile | null
  loading: boolean
  isAuthenticated: boolean
  onboardingComplete: boolean
  mustChangePassword: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<{ onboardingComplete: boolean; mustChangePassword: boolean }>
  register: (input: {
    businessName: string
    fullName: string
    email: string
    password: string
    whatsappNumber?: string
  }) => Promise<{ onboardingComplete: boolean; mustChangePassword: boolean }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateBusiness: (patch: Record<string, unknown>) => Promise<BusinessProfile>
  changePassword: (input: {
    currentPassword: string
    newPassword: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export type { AuthUser, BusinessProfile }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(async () => {
    const me = await fetchMe()
    setUser(me.user)
    setBusiness(me.business)
    queryClient.setQueryData(queryKeys.me, me)
    return me
  }, [queryClient])

  const refresh = useCallback(async () => {
    try {
      await applySession()
    } catch {
      setUser(null)
      setBusiness(null)
      queryClient.clear()
    } finally {
      setLoading(false)
    }
  }, [applySession, queryClient])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        await loginRequest(email, password)
        const me = await applySession()
        return {
          onboardingComplete: Boolean(me.business?.onboarding?.complete),
          mustChangePassword: Boolean(me.user?.mustChangePassword),
        }
      } finally {
        setLoading(false)
      }
    },
    [applySession],
  )

  const register = useCallback(
    async (input: {
      businessName: string
      fullName: string
      email: string
      password: string
      whatsappNumber?: string
    }) => {
      setLoading(true)
      try {
        await registerRequest(input)
        const me = await applySession()
        return {
          onboardingComplete: Boolean(me.business?.onboarding?.complete),
          mustChangePassword: Boolean(me.user?.mustChangePassword),
        }
      } finally {
        setLoading(false)
      }
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    await logoutLocal()
    setUser(null)
    setBusiness(null)
    queryClient.clear()
  }, [queryClient])

  const updateBusiness = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!user) throw new Error("Not signed in")
      const updated = await updateBusinessRequest(patch)
      setBusiness(updated)
      void queryClient.invalidateQueries({ queryKey: queryKeys.me })
      void queryClient.invalidateQueries({ queryKey: queryKeys.business })
      return updated
    },
    [queryClient, user],
  )

  const changePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      await changePasswordRequest(input)
      await applySession()
    },
    [applySession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      business,
      loading,
      isAuthenticated: Boolean(user),
      onboardingComplete: Boolean(business?.onboarding?.complete),
      mustChangePassword: Boolean(user?.mustChangePassword),
      login,
      register,
      logout,
      refresh,
      updateBusiness,
      changePassword,
    }),
    [
      user,
      business,
      loading,
      login,
      register,
      logout,
      refresh,
      updateBusiness,
      changePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function useOptionalAuth() {
  return useContext(AuthContext)
}
