"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

/** Routes that never require a session */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pay",
  "/track",
  "/s", // public Workspace business storefront
]

function isPublic(path: string) {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

function isOnboardingPath(path: string) {
  return path === "/onboarding"
}

function isChangePasswordPath(path: string) {
  return path === "/change-password"
}

/**
 * Protects dashboard routes: login → force password change (invite) → onboarding.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, onboardingComplete, mustChangePassword } =
    useAuth()
  const pathname = usePathname()
  const publicPage = isPublic(pathname)

  useEffect(() => {
    if (loading) return

    const go = (href: string) => {
      if (
        typeof window !== "undefined" &&
        window.location.pathname + window.location.search !== href
      ) {
        window.location.assign(href)
      }
    }

    if (!isAuthenticated && !publicPage) {
      go(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    if (
      isAuthenticated &&
      (pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password")
    ) {
      if (mustChangePassword) {
        go("/change-password")
        return
      }
      go(onboardingComplete ? "/" : "/onboarding")
      return
    }

    if (
      isAuthenticated &&
      mustChangePassword &&
      !isChangePasswordPath(pathname) &&
      !publicPage
    ) {
      go("/change-password")
      return
    }

    if (
      isAuthenticated &&
      !mustChangePassword &&
      isChangePasswordPath(pathname)
    ) {
      // Voluntary password change is allowed from settings; forced page only when required.
      // If they finished force-change, send them onward.
      go(onboardingComplete ? "/" : "/onboarding")
      return
    }

    if (
      isAuthenticated &&
      !mustChangePassword &&
      !onboardingComplete &&
      !publicPage &&
      !isOnboardingPath(pathname) &&
      !isChangePasswordPath(pathname)
    ) {
      go("/onboarding")
      return
    }

    if (
      isAuthenticated &&
      onboardingComplete &&
      isOnboardingPath(pathname) &&
      !mustChangePassword
    ) {
      go("/")
    }
  }, [
    loading,
    isAuthenticated,
    onboardingComplete,
    mustChangePassword,
    pathname,
    publicPage,
  ])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading session…
      </div>
    )
  }

  if (!publicPage && !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Redirecting to sign in…
      </div>
    )
  }

  if (
    isAuthenticated &&
    mustChangePassword &&
    !isChangePasswordPath(pathname) &&
    !publicPage
  ) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Set a new password…
      </div>
    )
  }

  if (
    isAuthenticated &&
    !mustChangePassword &&
    !onboardingComplete &&
    !publicPage &&
    pathname !== "/onboarding" &&
    pathname !== "/change-password"
  ) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Continue setup…
      </div>
    )
  }

  return <>{children}</>
}
