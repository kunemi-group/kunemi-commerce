"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  Banknote,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Percent,
  Truck,
  Palette,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: "contact", title: "Contact", icon: MessageCircle },
  { id: "bank", title: "Bank transfer", icon: Banknote },
  { id: "tax", title: "Tax & shipping", icon: Percent },
  { id: "brand", title: "Brand", icon: Palette },
] as const

export default function OnboardingPage() {
  const { business, user, loading, isAuthenticated, onboardingComplete, updateBusiness, logout } =
    useAuth()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [address, setAddress] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [taxRate, setTaxRate] = useState("7.5")
  const [taxLabel, setTaxLabel] = useState("VAT")
  const [shippingNaira, setShippingNaira] = useState("2500")
  const [brandColor, setBrandColor] = useState("#4f6bed")

  useEffect(() => {
    if (!business) return
    setName(business.name ?? "")
    setWhatsapp(business.whatsappNumber ?? "")
    setAddress(business.address ?? "")
    setBankName(business.bank.bankName ?? "")
    setAccountName(business.bank.accountName ?? "")
    setAccountNumber(business.bank.accountNumber ?? "")
    setTaxEnabled(business.tax.enabled)
    setTaxRate(String(business.tax.ratePercent ?? 7.5))
    setTaxLabel(business.tax.label ?? "VAT")
    setShippingNaira(String(Math.round((business.shipping.defaultFeeCents ?? 0) / 100)))
    setBrandColor(business.brandColor ?? "#4f6bed")
  }, [business])

  useEffect(() => {
    if (!loading && isAuthenticated && onboardingComplete) {
      window.location.assign("/")
    }
  }, [loading, isAuthenticated, onboardingComplete])

  const pct = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step])

  async function savePartial(patch: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    try {
      const updated = await updateBusiness(patch)
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save")
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function onContact(e: FormEvent) {
    e.preventDefault()
    if (!whatsapp.trim() || !address.trim()) {
      setError("WhatsApp number and business address are required")
      return
    }
    try {
      await savePartial({
        name: name.trim() || undefined,
        whatsappNumber: whatsapp.trim(),
        address: address.trim(),
      })
      setStep(1)
    } catch {
      /* shown */
    }
  }

  async function onBank(e: FormEvent) {
    e.preventDefault()
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setError("Bank name, account name, and account number are required for transfers")
      return
    }
    try {
      await savePartial({
        bankName: bankName.trim(),
        bankAccountName: accountName.trim(),
        bankAccountNumber: accountNumber.trim(),
      })
      setStep(2)
    } catch {
      /* shown */
    }
  }

  async function onTax(e: FormEvent) {
    e.preventDefault()
    const rate = Number(taxRate)
    const ship = Math.round(Number(shippingNaira) * 100)
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      setError("Enter a valid tax rate (0–100)")
      return
    }
    if (Number.isNaN(ship) || ship < 0) {
      setError("Enter a valid default shipping amount")
      return
    }
    try {
      await savePartial({
        taxEnabled,
        taxRatePercent: rate,
        taxLabel: taxLabel.trim() || "VAT",
        defaultShippingFeeCents: ship,
      })
      setStep(3)
    } catch {
      /* shown */
    }
  }

  async function onBrand(e: FormEvent) {
    e.preventDefault()
    try {
      const updated = await savePartial({
        brandColor: brandColor.trim() || "#4f6bed",
      })
      if (updated.onboarding?.complete) {
        window.location.assign("/")
        return
      }
      setError(
        `Still missing: ${(updated.onboarding?.missing ?? []).join(", ") || "details"}`,
      )
    } catch {
      /* shown */
    }
  }

  if (loading || !business || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading setup…
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Welcome, {user.fullName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Finish setting up {business.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bank details and contact info are required so customers can pay by transfer and you
              can share WhatsApp links. You can refine branding anytime in Settings.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Sign out
          </Button>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <Badge
                  key={s.id}
                  variant={i === step ? "default" : i < step ? "secondary" : "outline"}
                  className={cn("gap-1.5", i <= step && "border-primary/30")}
                >
                  {i < step ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                  {s.title}
                </Badge>
              )
            })}
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{STEPS[step].title}</CardTitle>
            <CardDescription>
              {step === 0 && "How customers and your team reach the business."}
              {step === 1 &&
                "Shown on every payment link. Transfers are the default payment method."}
              {step === 2 &&
                "VAT applies to taxable products only — never shipping. Default shipping can be overridden per order."}
              {step === 3 && "Brand color on customer pay & tracking pages."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 0 ? (
              <form className="space-y-3" onSubmit={onContact}>
                <Field label="Business name" value={name} onChange={setName} icon={Building2} />
                <Field
                  label="WhatsApp business number"
                  value={whatsapp}
                  onChange={setWhatsapp}
                  required
                  placeholder="+234 801 234 5678"
                  icon={MessageCircle}
                />
                <Field
                  label="Business / pickup address"
                  value={address}
                  onChange={setAddress}
                  required
                  placeholder="Street, city"
                  icon={MapPin}
                />
                <Actions
                  busy={busy}
                  error={error}
                  onBack={null}
                  submitLabel="Continue"
                />
              </form>
            ) : null}

            {step === 1 ? (
              <form className="space-y-3" onSubmit={onBank}>
                <Field
                  label="Bank name"
                  value={bankName}
                  onChange={setBankName}
                  required
                  placeholder="e.g. GTBank"
                />
                <Field
                  label="Account name"
                  value={accountName}
                  onChange={setAccountName}
                  required
                  placeholder="Must match bank records"
                />
                <Field
                  label="Account number"
                  value={accountNumber}
                  onChange={setAccountNumber}
                  required
                  placeholder="10-digit NUBAN"
                />
                <p className="text-xs text-muted-foreground">
                  Customers transfer to this account, then mark “I have made payment”. You verify
                  before the order is confirmed.
                </p>
                <Actions
                  busy={busy}
                  error={error}
                  onBack={() => setStep(0)}
                  submitLabel="Save bank details"
                />
              </form>
            ) : null}

            {step === 2 ? (
              <form className="space-y-3" onSubmit={onTax}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  Collect tax on taxable product lines
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Tax label" value={taxLabel} onChange={setTaxLabel} />
                  <Field
                    label="Rate %"
                    value={taxRate}
                    onChange={setTaxRate}
                    type="number"
                  />
                </div>
                <Field
                  label="Default shipping (₦)"
                  value={shippingNaira}
                  onChange={setShippingNaira}
                  type="number"
                  icon={Truck}
                />
                <Actions
                  busy={busy}
                  error={error}
                  onBack={() => setStep(1)}
                  submitLabel="Continue"
                />
              </form>
            ) : null}

            {step === 3 ? (
              <form className="space-y-3" onSubmit={onBrand}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Brand color</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-input bg-background"
                    />
                    <input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-9 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </label>
                <div
                  className="rounded-lg border border-border p-4 text-sm"
                  style={{ borderColor: brandColor }}
                >
                  Preview accent for <strong>{business.name}</strong> pay & tracking pages.
                </div>
                <Actions
                  busy={busy}
                  error={error}
                  onBack={() => setStep(2)}
                  submitLabel="Finish setup"
                />
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  type?: string
  icon?: typeof Building2
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
        <input
          type={type}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-9 w-full rounded-md border border-input bg-background pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
            Icon ? "pl-9" : "px-3",
          )}
        />
      </div>
    </label>
  )
}

function Actions({
  busy,
  error,
  onBack,
  submitLabel,
}: {
  busy: boolean
  error: string | null
  onBack: (() => void) | null
  submitLabel: string
}) {
  return (
    <div className="space-y-3 pt-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {onBack ? (
          <Button type="button" variant="outline" onClick={onBack} disabled={busy}>
            Back
          </Button>
        ) : null}
        <Button type="submit" className="gap-2" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
