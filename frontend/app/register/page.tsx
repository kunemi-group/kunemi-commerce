"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Boxes, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export default function RegisterPage() {
  const { register, isAuthenticated, onboardingComplete, loading } = useAuth()

  const [businessName, setBusinessName] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register({
        businessName: businessName.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        whatsappNumber: whatsappNumber.trim() || undefined,
      })
      window.location.assign("/onboarding")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
      setBusy(false)
    }
  }

  if (!loading && isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {onboardingComplete ? "Opening dashboard…" : "Continue setup…"}
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
          <Boxes className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold tracking-tight">Kunemi Workspace</p>
          <p className="text-xs text-muted-foreground">Kunemi Commerce · Workspace</p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your business</CardTitle>
          <CardDescription>
            Register the owner account. You&apos;ll finish bank details and store settings next —
            required before customers can pay by transfer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <Field
              label="Business name"
              required
              value={businessName}
              onChange={setBusinessName}
              placeholder="e.g. Lagos Threads Co."
            />
            <Field
              label="Your full name"
              required
              value={fullName}
              onChange={setFullName}
              placeholder="e.g. Amaka Obi"
            />
            <Field
              label="Work email"
              type="email"
              required
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="you@business.com"
            />
            <Field
              label="Password"
              type="password"
              required
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              minLength={6}
            />
            <Field
              label="WhatsApp business number (optional now)"
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              placeholder="+234 801 234 5678"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full gap-2" disabled={busy || loading}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
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
  placeholder,
  autoComplete,
  minLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
  minLength?: number
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  )
}
