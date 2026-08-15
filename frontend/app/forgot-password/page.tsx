"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Boxes, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { forgotPasswordRequest } from "@/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await forgotPasswordRequest(email.trim())
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setBusy(false)
    }
  }

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
            <Mail className="size-4 text-primary" />
            Forgot password
          </CardTitle>
          <CardDescription>
            Enter your Workspace Owner or Team email. If an account exists, we
            send a 6-digit code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button
                className="w-full"
                render={
                  <Link
                    href={`/reset-password?email=${encodeURIComponent(email.trim())}`}
                  />
                }
              >
                Enter reset code
              </Button>
              <Button
                variant="outline"
                className="w-full bg-card"
                render={<Link href="/login" />}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
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
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button type="submit" className="w-full gap-2" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Send reset code
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                render={<Link href="/login" />}
              >
                Back to sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
