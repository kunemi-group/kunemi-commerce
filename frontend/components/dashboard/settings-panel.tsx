"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  Building2,
  MessageCircle,
  Clock,
  CreditCard,
  Shield,
  Landmark,
  Bot,
  Users,
  Palette,
  ImagePlus,
  Percent,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { business, tierLimits, type SubscriptionTier } from "@/lib/data"
import { useBranding } from "@/lib/branding-context"
import { brandInitials, fileToDataUrl } from "@/lib/branding"
import { cn } from "@/lib/utils"

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
  const [acceptCard, setAcceptCard] = useState(business.payments.acceptCard)
  const [acceptTransfer, setAcceptTransfer] = useState(business.payments.acceptTransfer)
  const [preferTransfer, setPreferTransfer] = useState(
    business.payments.preferTransferToAvoidFees,
  )
  const branding = useBranding()
  const fileRef = useRef<HTMLInputElement>(null)

  async function onLogoSelected(file: File | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 1.5 * 1024 * 1024) {
      window.alert("Please use an image under 1.5MB for the logo.")
      return
    }
    const dataUrl = await fileToDataUrl(file)
    branding.setBranding({ logoDataUrl: dataUrl })
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
      <div className="flex flex-col gap-4 md:gap-6 xl:col-span-2">
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
            <Button size="sm">Save changes</Button>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <Field label="Business name" defaultValue={business.name} />
            <Field label="Support email" defaultValue={business.email} />
            <Field label="WhatsApp business number" defaultValue={business.whatsapp} />
            <Field label="Currency" defaultValue={business.currency} />
            <div className="sm:col-span-2">
              <Field label="Pickup / storefront address" defaultValue={business.address} />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Sales channels</p>
              <div className="flex flex-wrap gap-2">
                {business.channels.map((ch) => (
                  <Badge key={ch} variant="secondary" className="gap-1.5 px-2.5 py-1">
                    <MessageCircle className="size-3.5" />
                    {ch}
                  </Badge>
                ))}
                <Badge variant="outline" className="px-2.5 py-1 text-muted-foreground">
                  + Add channel
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document branding — logo, color, tax on PDFs */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-border pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                Document branding
              </CardTitle>
              <CardDescription>
                Logo, brand color, and tax on quotation & invoice PDFs
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              render={<Link href="/documents/quotation/QT-1042" />}
            >
              Preview PDF
            </Button>
          </CardHeader>
          <CardContent className="grid gap-5 pt-4 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Logo</p>
              <div className="flex items-center gap-3">
                {branding.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.logoDataUrl}
                    alt="Business logo"
                    className="size-14 rounded-xl object-cover ring-1 ring-border"
                  />
                ) : (
                  <div
                    className="flex size-14 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: branding.brandColor }}
                  >
                    {brandInitials()}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => onLogoSelected(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-card"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus className="size-4" />
                    Upload logo
                  </Button>
                  {branding.logoDataUrl ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 text-destructive"
                      onClick={() => branding.setBranding({ logoDataUrl: null })}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG/JPG/WebP under 1.5MB. Stored in this browser for the demo.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Brand color</p>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => branding.setBranding({ brandColor: c })}
                    className={cn(
                      "size-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-105",
                      branding.brandColor === c ? "ring-foreground" : "ring-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                  Custom
                  <input
                    type="color"
                    value={branding.brandColor}
                    onChange={(e) =>
                      branding.setBranding({ brandColor: e.target.value })
                    }
                    className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                </label>
              </div>
              <div
                className="rounded-lg border border-border p-3 text-sm"
                style={{
                  borderColor: branding.brandColor + "66",
                  backgroundColor: branding.brandColor + "14",
                }}
              >
                <p className="font-medium" style={{ color: branding.brandColor }}>
                  Sample heading on documents
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Titles, accent bar, and total amount use this color.
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Percent className="size-3.5" />
                VAT rate (auto-calculated)
              </p>
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={branding.taxEnabled}
                      onChange={(e) =>
                        branding.setBranding({ taxEnabled: e.target.checked })
                      }
                      className="size-4 rounded border-border"
                    />
                    Enable VAT
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Label
                    <input
                      type="text"
                      value={branding.taxLabel}
                      onChange={(e) =>
                        branding.setBranding({ taxLabel: e.target.value || "VAT" })
                      }
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
                      value={branding.taxRatePercent}
                      onChange={(e) =>
                        branding.setBranding({
                          taxRatePercent: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm text-foreground tabular-nums"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Default shipping (₦)
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={branding.defaultShippingFeeNaira}
                      onChange={(e) =>
                        branding.setBranding({
                          defaultShippingFeeNaira: Math.max(
                            0,
                            Number(e.target.value) || 0,
                          ),
                        })
                      }
                      className="h-9 w-32 rounded-md border border-input bg-background px-2 text-sm text-foreground tabular-nums"
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  VAT is calculated automatically as{" "}
                  <span className="text-foreground">rate × taxable products only</span>.
                  Shipping is <span className="text-foreground">never taxed</span>. Product
                  lines marked <span className="text-foreground">tax-free</span> are also
                  excluded from VAT.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-4 text-primary" />
              Settlement account
            </CardTitle>
            <CardDescription>
              Shared on invoices, quotes, and chat when buyers pay by transfer (avoids card MDR)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
            <Field label="Bank name" defaultValue={business.payments.bank.bankName} />
            <Field label="Account name" defaultValue={business.payments.bank.accountName} />
            <Field
              label="Account number"
              defaultValue={business.payments.bank.accountNumber}
            />
            <div className="rounded-lg border border-border bg-secondary/40 p-4 sm:col-span-3">
              <p className="text-sm text-muted-foreground">
                Customers can upload proof of payment; your team (or AI agent) confirms before
                stock moves to paid.
              </p>
            </div>
            <div className="sm:col-span-3">
              <Button size="sm">Save bank details</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Payment methods
            </CardTitle>
            <CardDescription>
              Card links + bank transfer are both first-class — choose defaults for fee control
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <ToggleRow
              title="Card payment links"
              description="Gateway links (Paystack etc.) agents & AI can paste in chat"
              enabled={acceptCard}
              onToggle={() => setAcceptCard((v) => !v)}
            />
            <ToggleRow
              title="Manual bank transfer"
              description="Show account details + allow proof-of-payment upload"
              enabled={acceptTransfer}
              onToggle={() => setAcceptTransfer((v) => !v)}
            />
            <ToggleRow
              title="Prefer transfer (reduce card fees)"
              description="Default quotes/invoices lead with bank details; card remains optional"
              enabled={preferTransfer}
              onToggle={() => setPreferTransfer((v) => !v)}
            />
            <ToggleRow
              title="Require owner confirm for transfers over ₦50,000"
              description="Extra checkpoint for high-value orders"
              enabled={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Order & inventory defaults
            </CardTitle>
            <CardDescription>
              Holds protect stock while buyers pay from chat, quote, or invoice
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <Field
              label="Payment hold window (minutes)"
              defaultValue={String(business.reservationMinutes)}
              hint="Pending orders auto-expire and release reserved stock"
            />
            <Field
              label="Default low-stock threshold"
              defaultValue="5"
              hint="Per-variant alerts when available units hit this level"
            />
            <div className="rounded-lg border border-border bg-secondary/40 p-4 sm:col-span-2">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Why this matters</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sales team or AI creates orders before money lands. A short hold keeps popular
                    SKUs honest without locking inventory forever when a buyer ghosts.
                  </p>
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button size="sm">Save ops settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Team seats and AI agent seats are separate limits
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(Object.keys(tierLimits) as SubscriptionTier[]).map((id) => {
              const tier = tierLimits[id]
              const current = business.tier === id
              return (
                <div
                  key={id}
                  className={
                    current
                      ? "rounded-lg border border-primary/40 bg-primary/10 p-4"
                      : "rounded-lg border border-border bg-secondary/30 p-4"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{tier.label}</p>
                    {current ? (
                      <Badge className="border-0 bg-primary/20 text-primary">Current</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md bg-background/50 px-2 py-1">
                      <Users className="size-3" />
                      {tier.teamSeats} team seats
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-background/50 px-2 py-1">
                      <Bot className="size-3" />
                      {tier.aiAgents === 0
                        ? "No AI agents"
                        : `${tier.aiAgents} AI agent${tier.aiAgents > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold tabular-nums">{tier.price}</span>
                    <Button variant="outline" size="sm" className="bg-card">
                      {current ? "Manage billing" : "Switch"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles & access</CardTitle>
            <CardDescription>Human Sales Team — not AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Owner</span> — full control, billing,
              AI seats
            </p>
            <p>
              <span className="font-medium text-foreground">Manager</span> — team, payments review,
              inventory
            </p>
            <p>
              <span className="font-medium text-foreground">Sales</span> — workspace, orders,
              quotes, invoices
            </p>
            <p>
              <span className="font-medium text-foreground">Ops</span> — deliveries, stock, limited
              finance
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full bg-card">
              Invite team member
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  defaultValue,
  hint,
}: {
  label: string
  defaultValue: string
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        defaultValue={defaultValue}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string
  description: string
  enabled: boolean
  onToggle?: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={
          enabled
            ? "relative h-6 w-11 shrink-0 rounded-full bg-primary transition-colors"
            : "relative h-6 w-11 shrink-0 rounded-full bg-muted transition-colors"
        }
      >
        <span
          className={
            enabled
              ? "absolute top-0.5 left-[22px] size-5 rounded-full bg-primary-foreground shadow transition-all"
              : "absolute top-0.5 left-0.5 size-5 rounded-full bg-foreground/80 shadow transition-all"
          }
        />
      </button>
    </div>
  )
}
