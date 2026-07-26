"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyWhatsApp } from "./copy-whatsapp"
import { paymentLinkMessage } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { useBranding } from "@/lib/branding-context"
import { useAuth } from "@/lib/auth-context"
import { computeDocTotals } from "@/lib/pdf/totals"
import { formatMoney, parseMoney } from "@/lib/pdf/money"
import type { QuoteLine } from "@/lib/data"
import {
  flattenInventory,
  formatNgn,
  getApiErrorMessage,
  shortId,
  useCreateOrder,
  useProducts,
} from "@/api"

type Step = 1 | 2 | 3
type LineSource = "catalog" | "custom"

type CustomLine = {
  id: string
  name: string
  qty: number
  unitPrice: string
  taxExempt: boolean
}

/**
 * Inventory is optional. Businesses with no/partial catalog can still create
 * freeform line items. Stock holds only apply to catalog variants (server).
 */
export function CreateOrderDrawer({
  open,
  onOpenChange,
  presetCustomer,
  presetPhone,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetCustomer?: string
  presetPhone?: string
  onCreated?: () => void
}) {
  const branding = useBranding()
  const { isAuthenticated, business } = useAuth()
  const { data: products = [] } = useProducts(open && isAuthenticated)
  const createOrder = useCreateOrder()
  const inventory = useMemo(() => flattenInventory(products), [products])
  const hasCatalog = inventory.length > 0
  const [step, setStep] = useState<Step>(1)
  const [customer, setCustomer] = useState(presetCustomer ?? "")
  const [phone, setPhone] = useState(presetPhone ?? "")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [shippingFee, setShippingFee] = useState(
    String(
      business
        ? Math.round(business.shipping.defaultFeeCents / 100)
        : branding.defaultShippingFeeNaira,
    ),
  )
  const [lineSource, setLineSource] = useState<LineSource>("custom")
  const [qty, setQty] = useState<Record<string, number>>({})
  const [taxFree, setTaxFree] = useState<Record<string, boolean>>({})
  const [customLines, setCustomLines] = useState<CustomLine[]>([
    { id: "c1", name: "", qty: 1, unitPrice: "", taxExempt: false },
  ])
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdTotal, setCreatedTotal] = useState("—")
  const [paymentLink, setPaymentLink] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLineSource(hasCatalog ? "catalog" : "custom")
  }, [open, hasCatalog])

  useEffect(() => {
    if (!open || inventory.length === 0) return
    setTaxFree((prev) => {
      let changed = false
      const next = { ...prev }
      for (const item of inventory) {
        if (item.taxExempt && next[item.id] === undefined) {
          next[item.id] = true
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [open, inventory])

  useEffect(() => {
    if (open) {
      if (presetCustomer) setCustomer(presetCustomer)
      if (presetPhone) setPhone(presetPhone)
      const shipNaira = business
        ? Math.round(business.shipping.defaultFeeCents / 100)
        : branding.defaultShippingFeeNaira
      setShippingFee(String(shipNaira))
    }
  }, [open, presetCustomer, presetPhone, branding.defaultShippingFeeNaira, business])

  const catalogLines: QuoteLine[] = useMemo(() => {
    return inventory
      .filter((i) => (qty[i.id] ?? 0) > 0)
      .map((i) => ({
        name: `${i.product} · ${i.variant}`,
        qty: qty[i.id] ?? 0,
        unitPrice: i.price,
        taxExempt: taxFree[i.id] ?? !!i.taxExempt,
      }))
  }, [qty, taxFree, inventory])

  const freeformLines: QuoteLine[] = useMemo(() => {
    return customLines
      .filter((l) => l.name.trim() && l.qty > 0 && parseMoney(l.unitPrice) > 0)
      .map((l) => ({
        name: l.name.trim(),
        qty: l.qty,
        unitPrice: l.unitPrice.includes("₦")
          ? l.unitPrice
          : formatMoney(parseMoney(l.unitPrice) || Number(l.unitPrice) || 0),
        taxExempt: l.taxExempt,
      }))
  }, [customLines])

  const lines: QuoteLine[] =
    lineSource === "catalog" ? catalogLines : freeformLines

  const totals = useMemo(
    () =>
      computeDocTotals({
        lines,
        shippingFee: parseMoney(shippingFee) || Number(shippingFee) || 0,
        taxEnabled: branding.taxEnabled,
        taxRatePercent: branding.taxRatePercent,
        taxLabel: branding.taxLabel,
      }),
    [lines, shippingFee, branding],
  )

  const totalUnits = lines.reduce((s, l) => s + l.qty, 0)
  const canSubmit =
    totalUnits > 0 &&
    (lineSource === "catalog"
      ? true
      : customLines.some(
          (l) => l.name.trim() && l.qty > 0 && (parseMoney(l.unitPrice) || Number(l.unitPrice)) > 0,
        ))

  function reset() {
    setStep(1)
    setQty({})
    setCreatedId(null)
    setCreatedTotal("—")
    setPaymentLink("")
    setSubmitError(null)
    createOrder.reset()
    if (!presetCustomer) setCustomer("")
    if (!presetPhone) setPhone("")
    setEmail("")
    setAddress("")
    const shipNaira = business
      ? Math.round(business.shipping.defaultFeeCents / 100)
      : branding.defaultShippingFeeNaira
    setShippingFee(String(shipNaira))
    setCustomLines([{ id: "c1", name: "", qty: 1, unitPrice: "", taxExempt: false }])
    setLineSource(hasCatalog ? "catalog" : "custom")
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  async function submit() {
    if (!isAuthenticated) {
      setSubmitError("Sign in required")
      return
    }
    if (!customer.trim() || phone.trim().length < 3) {
      setSubmitError("Customer name and phone are required")
      return
    }
    setSubmitError(null)
    try {
      const items =
        lineSource === "catalog"
          ? inventory
              .filter((i) => (qty[i.id] ?? 0) > 0)
              .map((i) => ({
                variantId: i.id,
                quantity: qty[i.id] ?? 0,
                taxExempt: taxFree[i.id] ?? i.taxExempt,
              }))
          : customLines
              .filter(
                (l) =>
                  l.name.trim() &&
                  l.qty > 0 &&
                  (parseMoney(l.unitPrice) || Number(l.unitPrice)) > 0,
              )
              .map((l) => ({
                description: l.name.trim(),
                quantity: l.qty,
                unitPriceCents: Math.round(
                  (parseMoney(l.unitPrice) || Number(l.unitPrice) || 0) * 100,
                ),
                taxExempt: l.taxExempt,
              }))

      if (!items.length) {
        setSubmitError("Add at least one line item")
        return
      }

      const shipCents = Math.round(
        (parseMoney(shippingFee) || Number(shippingFee) || 0) * 100,
      )

      const created = await createOrder.mutateAsync({
        customerName: customer.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        deliveryAddress: address.trim() || undefined,
        shippingFeeCents: shipCents,
        items,
      })

      setCreatedId(shortId(created.id))
      setCreatedTotal(formatNgn(created.totalCents))
      setPaymentLink(created.paymentLink || created.payment?.paymentUrl || "")
      setStep(3)
      onCreated?.()
    } catch (e) {
      setSubmitError(getApiErrorMessage(e) || "Could not create order")
    }
  }

  const submitting = createOrder.isPending

  const usedCatalog = lineSource === "catalog" && catalogLines.length > 0

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-primary" />
            Create order from chat
          </SheetTitle>
          <SheetDescription>
            Inventory optional · freeform or catalog lines · shipping + VAT on products only
          </SheetDescription>
          <StepDots step={step} />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 ? (
            <div className="space-y-4 animate-fade-in">
              <Field
                label="Customer name"
                value={customer}
                onChange={setCustomer}
                placeholder="e.g. Chidi Nwosu"
              />
              <Field
                label="WhatsApp phone"
                value={phone}
                onChange={setPhone}
                placeholder="+234…"
              />
              <Field
                label="Email address"
                value={email}
                onChange={setEmail}
                placeholder="customer@email.com (optional)"
              />
              <p className="-mt-2 text-[11px] text-muted-foreground">
                Optional — used for invoices, quote PDFs, and email receipts. Phone remains primary for WhatsApp.
              </p>
              <Field
                label="Delivery address"
                value={address}
                onChange={setAddress}
                placeholder="Street, area, city"
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Shipping fee (₦)
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-[11px] text-muted-foreground">
                  Never taxed. Default {formatMoney(branding.defaultShippingFeeNaira)}. 0 = pickup.
                </span>
              </label>
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm">
                <p className="font-medium">Bank transfer (default)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Customer gets a pay link with your account details and a countdown. Order is
                  confirmed only after you verify the transfer.
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3 animate-fade-in">
              {hasCatalog ? (
                <Tabs
                  value={lineSource}
                  onValueChange={(v) => setLineSource(v as LineSource)}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="catalog">From inventory</TabsTrigger>
                    <TabsTrigger value="custom">Custom lines</TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <p className="font-medium">No catalog required</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add freeform items by description and price. You can enable inventory later
                    for stock tracking — optional.
                  </p>
                </div>
              )}

              {lineSource === "catalog" && hasCatalog ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Catalog lines can reserve stock. Toggle{" "}
                    <strong className="text-foreground">Tax-free</strong> to exclude from VAT.
                  </p>
                  {inventory.map((item) => {
                    const available = item.onHand - item.reserved
                    const n = qty[item.id] ?? 0
                    const disabled = available <= 0
                    const isTaxFree = taxFree[item.id] ?? !!item.taxExempt
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-lg border border-border p-3",
                          disabled && "opacity-50",
                          n > 0 && "border-primary/40 bg-primary/5",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium">{item.product}</p>
                              {isTaxFree ? (
                                <Badge variant="secondary" className="h-5 text-[10px]">
                                  Tax-free
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.variant} · {available} available · {item.price}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon-xs"
                              variant="outline"
                              className="bg-card"
                              disabled={n <= 0}
                              onClick={() =>
                                setQty((q) => ({
                                  ...q,
                                  [item.id]: Math.max(0, (q[item.id] ?? 0) - 1),
                                }))
                              }
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-6 text-center text-sm tabular-nums">{n}</span>
                            <Button
                              size="icon-xs"
                              variant="outline"
                              className="bg-card"
                              disabled={disabled || n >= available}
                              onClick={() =>
                                setQty((q) => ({
                                  ...q,
                                  [item.id]: Math.min(available, (q[item.id] ?? 0) + 1),
                                }))
                              }
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </div>
                        {n > 0 ? (
                          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={isTaxFree}
                              onChange={(e) =>
                                setTaxFree((t) => ({
                                  ...t,
                                  [item.id]: e.target.checked,
                                }))
                              }
                              className="size-3.5 rounded border-border"
                            />
                            Tax-free — exclude from {branding.taxLabel}
                          </label>
                        ) : null}
                      </div>
                    )
                  })}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Freeform lines — no inventory SKU. Description + price required.
                  </p>
                  {customLines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="space-y-2 rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Line {idx + 1}
                        </span>
                        {customLines.length > 1 ? (
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() =>
                              setCustomLines((rows) => rows.filter((r) => r.id !== line.id))
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        value={line.name}
                        onChange={(e) =>
                          setCustomLines((rows) =>
                            rows.map((r) =>
                              r.id === line.id ? { ...r, name: e.target.value } : r,
                            ),
                          )
                        }
                        placeholder="Description (e.g. Service — logo design)"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          Qty
                          <input
                            type="number"
                            min={1}
                            value={line.qty}
                            onChange={(e) =>
                              setCustomLines((rows) =>
                                rows.map((r) =>
                                  r.id === line.id
                                    ? { ...r, qty: Math.max(1, Number(e.target.value) || 1) }
                                    : r,
                                ),
                              )
                            }
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                          Unit price (₦)
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={line.unitPrice.replace(/[^\d.]/g, "")}
                            onChange={(e) =>
                              setCustomLines((rows) =>
                                rows.map((r) =>
                                  r.id === line.id
                                    ? { ...r, unitPrice: e.target.value }
                                    : r,
                                ),
                              )
                            }
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </label>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={line.taxExempt}
                          onChange={(e) =>
                            setCustomLines((rows) =>
                              rows.map((r) =>
                                r.id === line.id
                                  ? { ...r, taxExempt: e.target.checked }
                                  : r,
                              ),
                            )
                          }
                          className="size-3.5 rounded border-border"
                        />
                        Tax-free — exclude from {branding.taxLabel}
                      </label>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 bg-card"
                    onClick={() =>
                      setCustomLines((rows) => [
                        ...rows,
                        {
                          id: `c${Date.now()}`,
                          name: "",
                          qty: 1,
                          unitPrice: "",
                          taxExempt: false,
                        },
                      ])
                    }
                  >
                    <Plus className="size-4" />
                    Add line
                  </Button>
                </>
              )}

              <TotalsPanel totals={totals} branding={branding} shippingFee={shippingFee} />
            </div>
          ) : null}

          {step === 3 && createdId ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col items-center rounded-xl border border-success/30 bg-success/10 px-4 py-8 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check className="size-6" />
                </div>
                <p className="text-lg font-semibold tabular-nums">{createdId}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usedCatalog
                    ? `Stock hold for catalog lines · ${createdTotal} due`
                    : `No inventory hold (freeform) · ${createdTotal} due`}
                </p>
              </div>
              <TotalsPanel totals={totals} branding={branding} shippingFee={shippingFee} />
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Customer:</span> {customer}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span> {phone}
                </p>
                {email.trim() ? (
                  <p>
                    <span className="text-muted-foreground">Email:</span> {email.trim()}
                  </p>
                ) : null}
                <p>
                  <span className="text-muted-foreground">Lines:</span> {totalUnits} ·{" "}
                  {lineSource === "custom" ? "freeform" : "catalog"}
                </p>
                <p>
                  <span className="text-muted-foreground">Payment:</span> Bank transfer
                </p>
                {paymentLink ? (
                  <p className="mt-1 break-all text-xs text-primary">{paymentLink}</p>
                ) : null}
              </div>
              {paymentLink ? (
                <CopyWhatsApp
                  phone={phone}
                  message={paymentLinkMessage({
                    customer: customer || "there",
                    orderId: createdId,
                    total: createdTotal,
                    paymentLink,
                  })}
                  label="Copy pay-link message"
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <SheetFooter className="border-t border-border sm:flex-row">
          {submitError ? (
            <p className="w-full text-sm text-destructive sm:order-first">{submitError}</p>
          ) : null}
          {step === 1 ? (
            <>
              <Button variant="outline" className="bg-card" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={!customer.trim() || !phone.trim()}
                onClick={() => setStep(2)}
              >
                Next: line items
              </Button>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Button variant="outline" className="bg-card" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                disabled={!canSubmit || submitting}
                onClick={() => void submit()}
                className="gap-2"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Create order · {totals.totalLabel}
              </Button>
            </>
          ) : null}
          {step === 3 ? (
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function TotalsPanel({
  totals,
  branding,
  shippingFee,
}: {
  totals: ReturnType<typeof computeDocTotals>
  branding: { taxLabel: string; taxRatePercent: number; taxEnabled: boolean }
  shippingFee: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Live totals
      </p>
      <Row label="Merchandise" value={totals.subtotalLabel} />
      {totals.hasExemptLines ? (
        <Row label="Tax-free (exempt)" value={totals.exemptLabel} muted />
      ) : null}
      {totals.hasExemptLines ? (
        <Row label="Taxable products" value={totals.taxableLabel} />
      ) : null}
      <Row
        label={`Shipping${Number(shippingFee) === 0 ? " (pickup)" : ""} · not taxed`}
        value={totals.shippingLabel}
      />
      <Row
        label={
          branding.taxEnabled
            ? `${branding.taxLabel} (${branding.taxRatePercent}%) on products`
            : "Tax (off)"
        }
        value={totals.taxAmountLabel}
      />
      <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
        <span>Order total</span>
        <span className="tabular-nums text-primary">{totals.totalLabel}</span>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        "flex justify-between py-0.5",
        muted ? "text-muted-foreground" : "",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium text-foreground">{value}</span>
    </div>
  )
}

function StepDots({ step }: { step: Step }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      {([1, 2, 3] as Step[]).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              step === n
                ? "bg-primary text-primary-foreground"
                : step > n
                  ? "bg-success/20 text-success"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {step > n ? <Check className="size-3.5" /> : n}
          </span>
          {n < 3 ? <span className="h-px w-6 bg-border" /> : null}
        </div>
      ))}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  )
}
