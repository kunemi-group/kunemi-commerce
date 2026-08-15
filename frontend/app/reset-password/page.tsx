"use client"

import { FormEvent, Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Boxes, KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { resetPasswordRequest } from "@/api"

function ResetForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match")
      return
    }
    setBusy(true)
    try {
      await resetPasswordRequest({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Password updated. Sign in with your new password.
        </p>
        <Button className="w-full" render={<Link href="/login" />}>
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Email</span>
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
          6-digit code
        </span>
        <input
          type="text"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          minLength={6}
          maxLength={6}
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="h-9 rounded-md border border-input bg-background px-3 text-sm tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          New password
        </span>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Confirm password
        </span>
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full gap-2" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        Reset password
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        render={<Link href="/forgot-password" />}
      >
        Request a new code
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Kunemi Workspace</p>
          <p className="text-xs text-muted-foreground">Password reset</p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            Reset password
          </CardTitle>
          <CardDescription>
            Enter the code from your email and choose a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            }
          >
            <ResetForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
