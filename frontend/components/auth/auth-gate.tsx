"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

/** Routes that never require a session */
const PUBLIC_PREFIXES = ["/login", "/register", "/pay", "/track"]

function isPublic(path: string) {
  return PUBLIC_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  )
}

function isOnboardingPath(path: string) {
  return path === "/onboarding"
}

/**
 * Protects dashboard routes: requires login, then forces onboarding if incomplete.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, onboardingComplete } = useAuth()
  const pathname = usePathname()
  const publicPage = isPublic(pathname)

  useEffect(() => {
    if (loading) return

    // Use assign for auth redirects — avoids nested App Router transitions
    // fighting React render of login/register.
    const go = (href: string) => {
      if (typeof window !== "undefined" && window.location.pathname + window.location.search !== href) {
        window.location.assign(href)
      }
    }

    if (!isAuthenticated && !publicPage) {
      go(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      go(onboardingComplete ? "/" : "/onboarding")
      return
    }

    if (
      isAuthenticated &&
      !onboardingComplete &&
      !publicPage &&
      !isOnboardingPath(pathname)
    ) {
      go("/onboarding")
      return
    }

    if (
      isAuthenticated &&
      onboardingComplete &&
      isOnboardingPath(pathname)
    ) {
      go("/")
    }
  }, [
    loading,
    isAuthenticated,
    onboardingComplete,
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

  // Avoid flash of protected UI while redirecting
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
    !onboardingComplete &&
    !publicPage &&
    pathname !== "/onboarding"
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
