"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Loader2, UserPlus } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage, useInviteMember } from "@/api"
import { TEAM_API_ROLE } from "@/lib/workspace-roles"

export function InviteMemberSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const invite = useInviteMember()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    email: string
    temporaryPassword: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setFullName("")
    setEmail("")
    setPassword("")
    setError(null)
    setResult(null)
    setCopied(false)
  }, [open])

  async function submit() {
    setError(null)
    if (!fullName.trim() || !email.trim()) {
      setError("Name and email are required")
      return
    }
    try {
      const res = await invite.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        role: TEAM_API_ROLE,
        password: password.trim() || undefined,
      })
      setResult({
        email: res.member.email,
        temporaryPassword: res.temporaryPassword,
      })
    } catch (e) {
      setError(getApiErrorMessage(e) || "Invite failed")
    }
  }

  async function copyCreds() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(
        `Email: ${result.email}\nPassword: ${result.temporaryPassword}`,
      )
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-md data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Invite teammate
          </SheetTitle>
          <SheetDescription>
            Adds a Team login for this business. Share the temporary password
            securely.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {result ? (
            <div className="space-y-3 animate-fade-in">
              <div className="rounded-xl border border-success/30 bg-success/10 p-4">
                <p className="flex items-center gap-2 font-medium text-success">
                  <Check className="size-4" />
                  Member invited
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  They can sign in at the login page with these credentials.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">{result.email}</span>
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">Role:</span>{" "}
                  <span className="font-medium">Team</span>
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">Temp password:</span>{" "}
                  <span className="font-mono font-medium">
                    {result.temporaryPassword}
                  </span>
                </p>
              </div>
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => void copyCreds()}
              >
                <Copy className="size-4" />
                {copied ? "Copied" : "Copy credentials"}
              </Button>
            </div>
          ) : (
            <>
              <Field
                label="Full name"
                value={fullName}
                onChange={setFullName}
                placeholder="e.g. Amaka Okoro"
              />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="teammate@email.com"
                type="email"
              />
              <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm">
                <p className="font-medium">Role: Team</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Day-to-day access: orders, products, inbox, payments review,
                  deliveries, quotes. Only owners manage settings and team
                  seats.
                </p>
              </div>
              <Field
                label="Temp password (optional)"
                value={password}
                onChange={setPassword}
                placeholder="Leave blank to auto-generate"
                type="text"
              />
              <p className="text-[11px] text-muted-foreground">
                Seat limits apply by plan. Email must not already be registered.
              </p>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </>
          )}
        </div>

        <SheetFooter className="border-t border-border sm:flex-row">
          {result ? (
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="bg-card"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={invite.isPending}
                className="gap-2"
                onClick={() => void submit()}
              >
                {invite.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Invite
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  )
}
