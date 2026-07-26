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
  fetchMe,
  loginRequest,
  logoutLocal,
  registerRequest,
  updateBusinessRequest,
  getStoredToken,
  setStoredToken,
  queryKeys,
  type AuthUser,
  type BusinessProfile,
} from "@/api"

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  business: BusinessProfile | null
  loading: boolean
  isAuthenticated: boolean
  onboardingComplete: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<{ onboardingComplete: boolean }>
  register: (input: {
    businessName: string
    fullName: string
    email: string
    password: string
    whatsappNumber?: string
  }) => Promise<{ onboardingComplete: boolean }>
  logout: () => void
  refresh: () => Promise<void>
  updateBusiness: (patch: Record<string, unknown>) => Promise<BusinessProfile>
  getToken: () => string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export type { AuthUser, BusinessProfile }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(async (accessToken: string) => {
    setStoredToken(accessToken)
    const me = await fetchMe()
    setToken(accessToken)
    setUser(me.user)
    setBusiness(me.business)
    queryClient.setQueryData(queryKeys.me, me)
  }, [queryClient])

  const refresh = useCallback(async () => {
    const stored = getStoredToken()
    if (!stored) {
      setToken(null)
      setUser(null)
      setBusiness(null)
      setLoading(false)
      return
    }
    try {
      await applySession(stored)
    } catch {
      logoutLocal()
      setToken(null)
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
        const res = await loginRequest(email, password)
        await applySession(res.accessToken)
        const me = await fetchMe()
        return { onboardingComplete: Boolean(me.business.onboarding?.complete) }
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
        const res = await registerRequest(input)
        await applySession(res.accessToken)
        const me = await fetchMe()
        return { onboardingComplete: Boolean(me.business.onboarding?.complete) }
      } finally {
        setLoading(false)
      }
    },
    [applySession],
  )

  const logout = useCallback(() => {
    logoutLocal()
    setToken(null)
    setUser(null)
    setBusiness(null)
    queryClient.clear()
  }, [queryClient])

  const updateBusiness = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!getStoredToken()) throw new Error("Not signed in")
      const updated = await updateBusinessRequest(patch)
      setBusiness(updated)
      void queryClient.invalidateQueries({ queryKey: queryKeys.me })
      void queryClient.invalidateQueries({ queryKey: queryKeys.business })
      return updated
    },
    [queryClient],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      business,
      loading,
      isAuthenticated: Boolean(token && user),
      onboardingComplete: Boolean(business?.onboarding?.complete),
      login,
      register,
      logout,
      refresh,
      updateBusiness,
      getToken: () => token ?? getStoredToken(),
    }),
    [
      token,
      user,
      business,
      loading,
      login,
      register,
      logout,
      refresh,
      updateBusiness,
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
