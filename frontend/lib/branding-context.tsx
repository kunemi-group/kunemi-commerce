"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  defaultBranding,
  loadBranding,
  saveBranding,
  type BrandingState,
} from "@/lib/branding"

type BrandingContextValue = BrandingState & {
  setBranding: (patch: Partial<BrandingState>) => void
  resetBranding: () => void
  hydrated: boolean
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BrandingState>(defaultBranding)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadBranding())
    setHydrated(true)
  }, [])

  const setBranding = useCallback((patch: Partial<BrandingState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      saveBranding(next)
      return next
    })
  }, [])

  const resetBranding = useCallback(() => {
    setState(defaultBranding)
    saveBranding(defaultBranding)
  }, [])

  const value = useMemo(
    () => ({ ...state, setBranding, resetBranding, hydrated }),
    [state, setBranding, resetBranding, hydrated],
  )

  return (
    <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
  )
}

export function useBranding() {
  const ctx = useContext(BrandingContext)
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider")
  return ctx
}
