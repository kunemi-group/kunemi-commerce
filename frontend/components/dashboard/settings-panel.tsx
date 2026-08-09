"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Building2,
  MessageCircle,
  CreditCard,
  Landmark,
  Bot,
  Users,
  Palette,
  ImagePlus,
  Percent,
  Trash2,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { tierLimits, type SubscriptionTier } from "@/lib/data"
import { useBranding } from "@/lib/branding-context"
import { brandInitials, fileToDataUrl } from "@/lib/branding"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { majorToMinor, minorToMajor } from "@/api"

const PRESET_COLORS = [
  "#4f6bed",
  "#0d9488",
  "#c026d3",
  "#ea580c",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#0f172a",
]

export function SettingsPanel() {
  const { business, updateBusiness, refresh } = useAuth()
  const branding = useBranding()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [address, setAddress] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [taxLabel, setTaxLabel] = useState("VAT")
  const [taxRate, setTaxRate] = useState(7.5)
  const [shippingMajor, setShippingMajor] = useState(2500)
  const [brandColor, setBrandColor] = useState("#4f6bed")
  const [storeSlug, setStoreSlug] = useState("")
  const [storeEnabled, setStoreEnabled] = useState(true)
  const [currency, setCurrency] = useState("NGN")
  const [defaultPaymentMethod, setDefaultPaymentMethod] =
    useState("bank_transfer")
  const [logoKey, setLogoKey] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!business) return
    setName(business.name ?? "")
    setEmail(business.email ?? "")
    setWhatsapp(business.whatsappNumber ?? "")
    setAddress(business.address ?? "")
    setBankName(business.bank.bankName ?? "")
    setAccountName(business.bank.accountName ?? "")
    setAccountNumber(business.bank.accountNumber ?? "")
    setTaxEnabled(business.tax.enabled)
    setTaxLabel(business.tax.label ?? "VAT")
    setTaxRate(Number(business.tax.ratePercent) || 0)
    {
      const cur = business.currency ?? "NGN"
      const shipMajor = minorToMajor(
        business.shipping.defaultFeeCents ?? 0,
        cur,
      )
      setShippingMajor(shipMajor)
      setCurrency(cur)
      // Sync local branding defaults from server
      branding.setBranding({
        brandColor: business.brandColor || branding.brandColor,
        taxEnabled: business.tax.enabled,
        taxLabel: business.tax.label,
        taxRatePercent: Number(business.tax.ratePercent) || 0,
        defaultShippingFeeNaira: shipMajor,
        logoDataUrl: business.logoUrl ?? branding.logoDataUrl,
      })
    }
    setBrandColor(business.brandColor || branding.brandColor || "#4f6bed")
    setStoreSlug(business.store?.slug ?? "")
    setStoreEnabled(business.store?.enabled ?? true)
    setDefaultPaymentMethod(business.payments?.defaultMethod ?? "bank_transfer")
    setLogoKey(business.logoKey ?? null)
    setLogoUrl(business.logoUrl ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per business load
  }, [business?.id, business?.name, business?.bank.accountNumber, business?.store?.slug])

  async function saveProfile() {
    setSaving("profile")
    setError(null)
    setMessage(null)
    try {
      await updateBusiness({
        name: name.trim(),
        email: email.trim() || null,
        whatsappNumber: whatsapp.trim() || null,
        address: address.trim() || null,
      })
      await refresh()
      setMessage("Business profile saved")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(null)
    }
  }

  async function saveBank() {
    setSaving("bank")
    setError(null)
    setMessage(null)
    try {
      await updateBusiness({
        bankName: bankName.trim() || null,
        bankAccountName: accountName.trim() || null,
        bankAccountNumber: accountNumber.trim() || null,
      })
      await refresh()
      setMessage("Bank details saved — used on pay links")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(null)
    }
  }

  async function saveTaxShippingBrand() {
    setSaving("tax")
    setError(null)
    setMessage(null)
    try {
      await updateBusiness({
        taxEnabled,
        taxLabel: taxLabel.trim() || "VAT",
        taxRatePercent: taxRate,
        defaultShippingFeeCents: majorToMinor(shippingMajor, currency),
        brandColor,
      })
      branding.setBranding({
        brandColor,
        taxEnabled,
        taxLabel: taxLabel.trim() || "VAT",
        taxRatePercent: taxRate,
        defaultShippingFeeNaira: shippingMajor,
      })
      await refresh()
      setMessage("Tax, shipping, and brand color saved")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(null)
    }
  }

  async function onLogoSelected(file: File | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 8 * 1024 * 1024) {
      window.alert("Please use an image under 8MB for the logo.")
      return
    }
    setSaving("logo")
    setError(null)
    setMessage(null)
    try {
      const { uploadFile } = await import("@/api")
      const stored = await uploadFile(file, "brand")
      await updateBusiness({ logoKey: stored.key })
      setLogoKey(stored.key)
      setLogoUrl(stored.url)
      branding.setBranding({ logoDataUrl: stored.url })
      await refresh()
      setMessage("Logo uploaded to storage")
    } catch (e) {
      // Fallback: local-only branding if upload API fails
      try {
        const dataUrl = await fileToDataUrl(file)
        branding.setBranding({ logoDataUrl: dataUrl })
        setMessage("Logo saved locally (upload API unavailable)")
      } catch {
        setError(e instanceof Error ? e.message : "Logo upload failed")
      }
    } finally {
      setSaving(null)
    }
  }

  async function saveStore() {
    setSaving("store")
    setError(null)
    setMessage(null)
    try {
      await updateBusiness({
        storeSlug: storeSlug.trim().toLowerCase() || null,
        storeEnabled,
      })
      await refresh()
      setMessage("ShopFlow storefront settings saved")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(null)
    }
  }

  async function saveCurrencyPayments() {
    setSaving("currency")
    setError(null)
    setMessage(null)
    try {
      await updateBusiness({
        currency: currency.trim().toUpperCase(),
        defaultPaymentMethod,
        enabledPaymentMethods: ["bank_transfer", defaultPaymentMethod].filter(
          (v, i, a) => a.indexOf(v) === i,
        ),
      })
      await refresh()
      setMessage("Currency and payment defaults saved")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(null)
    }
  }

  const tier = (business?.tier ?? "starter") as SubscriptionTier
  const seats = tierLimits[tier]

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
      <div className="flex flex-col gap-4 md:gap-6 xl:col-span-2">
        {(message || error) && (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              error
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-success/30 bg-success/10 text-success",
            )}
          >
            {error ?? message}
          </p>
        )}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Business profile
              </CardTitle>
              <CardDescription>
                Shown on tracking pages, invoices, and customer WhatsApp messages
              </CardDescription>
            </div>
            <Button size="sm" className="gap-2" disabled={!!saving} onClick={() => void saveProfile()}>
              {saving === "profile" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save changes
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <Field label="Business name" value={name} onChange={setName} />
            <Field label="Support email" value={email} onChange={setEmail} />
            <Field label="WhatsApp business number" value={whatsapp} onChange={setWhatsapp} />
            <div className="sm:col-span-2">
              <Field label="Pickup / storefront address" value={address} onChange={setAddress} />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Sales channels</p>
              <div className="flex flex-wrap gap-2">
                {["WhatsApp", "Instagram"].map((ch) => (
                  <Badge key={ch} variant="secondary" className="gap-1.5 px-2.5 py-1">
                    <MessageCircle className="size-3.5" />
                    {ch}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Currency & payments
              </CardTitle>
              <CardDescription>
                Global business currency (ISO). Default payment is bank transfer; Stripe/Paystack can plug in later.
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="gap-2"
              disabled={!!saving}
              onClick={() => void saveCurrencyPayments()}
            >
              {saving === "currency" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              Save
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Currency
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[
                  "NGN",
                  "USD",
                  "GBP",
                  "EUR",
                  "GHS",
                  "KES",
                  "ZAR",
                  "XOF",
                  "XAF",
                  "CAD",
                  "AUD",
                  "INR",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Default payment method
              </span>
              <select
                value={defaultPaymentMethod}
                onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="bank_transfer">Bank transfer (default)</option>
                <option value="stripe" disabled>
                  Stripe (coming soon)
                </option>
                <option value="paystack" disabled>
                  Paystack (coming soon)
                </option>
              </select>
            </label>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Amounts are stored in minor units for this currency. Card gateways
              plug into the same payment interface without a second backend.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="size-4 text-primary" />
                ShopFlow storefront
              </CardTitle>
              <CardDescription>
                Public catalog API for ShopFlow social store — Workspace is the backend of record
              </CardDescription>
            </div>
            <Button size="sm" className="gap-2" disabled={!!saving} onClick={() => void saveStore()}>
              {saving === "store" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save store
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <Field
              label="Store slug"
              value={storeSlug}
              onChange={setStoreSlug}
              placeholder="lagos-threads"
            />
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={storeEnabled}
                onChange={(e) => setStoreEnabled(e.target.checked)}
                className="size-3.5 rounded border-border"
              />
              Store enabled
            </label>
            <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Public endpoints for ShopFlow</p>
              <p className="mt-1 font-mono">
                GET /api/store/{storeSlug || "{slug}"}
              </p>
              <p className="font-mono">
                GET /api/store/{storeSlug || "{slug}"}/products
              </p>
              <p className="mt-2">
                Products with “Publish to ShopFlow store” appear here. Images use R2 when configured.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                Document branding & tax
              </CardTitle>
              <CardDescription>
                Brand color, VAT, and default shipping (saved to business record)
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="gap-2"
              disabled={!!saving}
              onClick={() => void saveTaxShippingBrand()}
            >
              {saving === "tax" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save
            </Button>
          </CardHeader>
          <CardContent className="grid gap-5 pt-4 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Logo (Cloudflare R2 / storage)
              </p>
              <div className="flex items-center gap-3">
                {logoUrl || branding.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl || branding.logoDataUrl || ""}
                    alt="Business logo"
                    className="size-14 rounded-xl object-cover ring-1 ring-border"
                  />
                ) : (
                  <div
                    className="flex size-14 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {brandInitials(name || "KW")}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => void onLogoSelected(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-card"
                    disabled={!!saving}
                    onClick={() => fileRef.current?.click()}
                  >
                    {saving === "logo" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="size-4" />
                    )}
                    Upload logo
                  </Button>
                  {logoKey || branding.logoDataUrl ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 text-destructive"
                      onClick={() => {
                        void updateBusiness({ logoKey: null }).then(() => {
                          setLogoKey(null)
                          setLogoUrl(null)
                          branding.setBranding({ logoDataUrl: null })
                          return refresh()
                        })
                      }}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Brand color</p>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setBrandColor(c)}
                    className={cn(
                      "size-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-105",
                      brandColor === c ? "ring-foreground" : "ring-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                  Custom
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Percent className="size-3.5" />
                VAT & shipping
              </p>
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      className="size-4 rounded border-border"
                    />
                    Enable VAT
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Label
                    <input
                      type="text"
                      value={taxLabel}
                      onChange={(e) => setTaxLabel(e.target.value)}
                      className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Rate %
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={taxRate}
                      onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value) || 0))}
                      className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm tabular-nums text-foreground"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {`Default shipping (${currency})`}
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={shippingMajor}
                      onChange={(e) =>
                        setShippingMajor(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="h-9 w-32 rounded-md border border-input bg-background px-2 text-sm tabular-nums text-foreground"
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  VAT applies to taxable products only. Shipping is never taxed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="size-4 text-primary" />
                Settlement account
              </CardTitle>
              <CardDescription>
                Shown on bank-transfer pay links (default payment method)
              </CardDescription>
            </div>
            <Button size="sm" className="gap-2" disabled={!!saving} onClick={() => void saveBank()}>
              {saving === "bank" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save bank details
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
            <Field label="Bank name" value={bankName} onChange={setBankName} />
            <Field label="Account name" value={accountName} onChange={setAccountName} />
            <Field label="Account number" value={accountNumber} onChange={setAccountNumber} />
            <div className="rounded-lg border border-border bg-secondary/40 p-4 sm:col-span-3">
              <p className="text-sm text-muted-foreground">
                Customers transfer, mark paid (optional proof), then you verify before the order is
                confirmed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Payment methods
            </CardTitle>
            <CardDescription>Bank transfer is the default path in Workspace today</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <ToggleRow
              title="Bank transfer (default)"
              description="Pay link shows your account details + countdown + claim"
              enabled
            />
            <ToggleRow
              title="Card payment links"
              description="Gateway (Paystack etc.) — coming later"
              enabled={false}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              Plan
            </CardTitle>
            <CardDescription>
              {seats.label} · {seats.teamSeats} team seats · {seats.aiAgents} AI seats
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{seats.blurb}</p>
            <p className="mt-2 text-xs">Tier is stored on the business record (read-only here).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4 text-primary" />
              AI agents
            </CardTitle>
            <CardDescription>Separate from human sales team — runtime later</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="bg-card" render={<Link href="/ai-agents" />}>
              Open AI seats
            </Button>
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
  disabled,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      />
    </label>
  )
}

function ToggleRow({
  title,
  description,
  enabled,
}: {
  title: string
  description: string
  enabled: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant={enabled ? "secondary" : "outline"}>{enabled ? "On" : "Off"}</Badge>
    </div>
  )
}
