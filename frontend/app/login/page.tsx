"use client"

import { FormEvent, Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Boxes, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

function LoginForm() {
  const {
    login,
    isAuthenticated,
    onboardingComplete,
    mustChangePassword,
    loading,
  } = useAuth()
  const params = useSearchParams()
  const next = params.get("next") || "/"

  const [email, setEmail] = useState("owner@lagosthreads.co")
  const [password, setPassword] = useState("password123")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await login(email.trim(), password)
      // Full navigation avoids App Router setState-during-render races
      if (result.mustChangePassword) {
        window.location.assign("/change-password")
        return
      }
      if (!result.onboardingComplete) {
        window.location.assign("/onboarding")
        return
      }
      const dest = next.startsWith("/") ? next : "/"
      const safe =
        dest === "/login" || dest === "/register" || dest === "/change-password"
          ? "/"
          : dest
      window.location.assign(safe)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed")
      setBusy(false)
    }
  }

  // Session already present — AuthGate will redirect; show quiet state only
  if (!loading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {mustChangePassword
          ? "Set a new password…"
          : onboardingComplete
            ? "Opening dashboard…"
            : "Continue setup…"}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your Owner or Team account. Demo: owner@lagosthreads.co /
          password123
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={busy || loading}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New business?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
          <Boxes className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold tracking-tight">Kunemi Workspace</p>
          <p className="text-xs text-muted-foreground">
            Kunemi Commerce · Workspace
          </p>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
