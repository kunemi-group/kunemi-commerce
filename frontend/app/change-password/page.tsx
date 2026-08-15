"use client"

import { FormEvent, useState } from "react"
import { Boxes, KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export default function ChangePasswordPage() {
  const {
    changePassword,
    logout,
    user,
    mustChangePassword,
    onboardingComplete,
    loading,
  } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match")
      return
    }
    setBusy(true)
    try {
      await changePassword({ currentPassword, newPassword })
      window.location.assign(onboardingComplete ? "/" : "/onboarding")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password")
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Kunemi Workspace</p>
          <p className="text-xs text-muted-foreground">Account security</p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            {mustChangePassword ? "Set a new password" : "Change password"}
          </CardTitle>
          <CardDescription>
            {mustChangePassword
              ? `Welcome${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}. Your invite used a temporary password — choose a new one to continue.`
              : "Update the password for your Workspace account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <Field
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
              required
            />
            <Field
              label="New password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={setNewPassword}
              required
              minLength={8}
              hint="At least 8 characters"
            />
            <Field
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
              required
              minLength={8}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full gap-2" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Save password
            </Button>
            {mustChangePassword ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() =>
                  void logout().then(() => window.location.assign("/login"))
                }
              >
                Sign out
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
  minLength,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
  minLength?: number
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}
