"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { apiGet, apiSend } from "@/lib/api"

const TOKEN_KEY = "shopflow_token"

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: string
  businessId: string
}

export type BusinessProfile = {
  id: string
  name: string
  whatsappNumber: string | null
  email: string | null
  address: string | null
  tier: string
  tax: {
    enabled: boolean
    ratePercent: number
    label: string
  }
  shipping: {
    defaultFeeCents: number
  }
  bank: {
    bankName: string | null
    accountName: string | null
    accountNumber: string | null
  }
  brandColor: string
  onboarding?: {
    complete: boolean
    missing: string[]
    required: string[]
  }
  inventoryOptional?: boolean
}

type AuthMeResponse = {
  user: AuthUser
  business: BusinessProfile
}

type TokenResponse = {
  accessToken: string
  user: AuthUser
}

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(async (accessToken: string) => {
    const me = await apiGet<AuthMeResponse>("/auth/me", accessToken)
    setToken(accessToken)
    setUser(me.user)
    setBusiness(me.business)
    try {
      localStorage.setItem(TOKEN_KEY, accessToken)
    } catch {
      /* ignore */
    }
  }, [])

  const refresh = useCallback(async () => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
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
      try {
        localStorage.removeItem(TOKEN_KEY)
      } catch {
        /* ignore */
      }
      setToken(null)
      setUser(null)
      setBusiness(null)
    } finally {
      setLoading(false)
    }
  }, [applySession])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        const res = await apiSend<TokenResponse>("/auth/login", "POST", {
          email,
          password,
        })
        const me = await apiGet<AuthMeResponse>("/auth/me", res.accessToken)
        setToken(res.accessToken)
        setUser(me.user)
        setBusiness(me.business)
        try {
          localStorage.setItem(TOKEN_KEY, res.accessToken)
        } catch {
          /* ignore */
        }
        return { onboardingComplete: Boolean(me.business.onboarding?.complete) }
      } finally {
        setLoading(false)
      }
    },
    [],
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
        const res = await apiSend<TokenResponse>("/auth/register", "POST", input)
        const me = await apiGet<AuthMeResponse>("/auth/me", res.accessToken)
        setToken(res.accessToken)
        setUser(me.user)
        setBusiness(me.business)
        try {
          localStorage.setItem(TOKEN_KEY, res.accessToken)
        } catch {
          /* ignore */
        }
        return { onboardingComplete: Boolean(me.business.onboarding?.complete) }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
    setToken(null)
    setUser(null)
    setBusiness(null)
  }, [])

  const updateBusiness = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!token) throw new Error("Not signed in")
      const updated = await apiSend<BusinessProfile>(
        "/businesses/me",
        "PATCH",
        patch,
        token,
      )
      setBusiness(updated)
      return updated
    },
    [token],
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
      getToken: () => token,
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
