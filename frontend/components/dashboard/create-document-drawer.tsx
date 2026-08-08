"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, Loader2, Plus, Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import { computeDocTotals } from "@/lib/pdf/totals"
import { formatMoney, parseMoney } from "@/lib/pdf/money"
import type { QuoteLine } from "@/lib/data"
import {
  getApiErrorMessage,
  majorToMinor,
  minorToMajor,
  useCreateInvoice,
  useCreateQuotation,
  useMoney,
} from "@/api"

type Line = {
  id: string
  name: string
  qty: number
  unitPrice: string
  taxExempt: boolean
}

export function CreateDocumentDrawer({
  kind,
  open,
  onOpenChange,
  onCreated,
}: {
  kind: "quotation" | "invoice"
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}) {
  const branding = useBranding()
  const { isAuthenticated, business } = useAuth()
  const money = useMoney()
  const createQuote = useCreateQuotation()
  const createInvoice = useCreateInvoice()

  const [customer, setCustomer] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [shippingFee, setShippingFee] = useState(
    String(
      business
        ? minorToMajor(business.shipping.defaultFeeCents, money.currency)
        : branding.defaultShippingFeeNaira,
    ),
  )
  const [lines, setLines] = useState<Line[]>([
    { id: "1", name: "", qty: 1, unitPrice: "", taxExempt: false },
  ])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCustomer("")
    setPhone("")
    setEmail("")
    setAddress("")
    setNotes("")
    setError(null)
    setLines([{ id: "1", name: "", qty: 1, unitPrice: "", taxExempt: false }])
    const ship = business
      ? minorToMajor(business.shipping.defaultFeeCents, money.currency)
      : branding.defaultShippingFeeNaira
    setShippingFee(String(ship))
  }, [open, business, branding.defaultShippingFeeNaira, money.currency])

  const quoteLines: QuoteLine[] = useMemo(
    () =>
      lines
        .filter((l) => l.name.trim() && l.qty > 0 && (parseMoney(l.unitPrice) || Number(l.unitPrice)) > 0)
        .map((l) => ({
          name: l.name.trim(),
          qty: l.qty,
          unitPrice: /[A-Za-z$€£₦]/.test(l.unitPrice)
            ? l.unitPrice
            : formatMoney(
                parseMoney(l.unitPrice) || Number(l.unitPrice) || 0,
                money.currency,
              ),
          taxExempt: l.taxExempt,
        })),
    [lines, money.currency],
  )

  const totals = useMemo(
    () =>
      computeDocTotals({
        lines: quoteLines,
        shippingFee: parseMoney(shippingFee) || Number(shippingFee) || 0,
        taxEnabled: branding.taxEnabled,
        taxRatePercent: branding.taxRatePercent,
        taxLabel: branding.taxLabel,
        currency: money.currency,
      }),
    [quoteLines, shippingFee, branding, money.currency],
  )

  const busy = createQuote.isPending || createInvoice.isPending

  async function submit() {
    if (!isAuthenticated) {
      setError("Sign in required")
      return
    }
    if (!customer.trim()) {
      setError("Customer name is required")
      return
    }
    const items = lines
      .filter(
        (l) =>
          l.name.trim() &&
          l.qty > 0 &&
          (parseMoney(l.unitPrice) || Number(l.unitPrice)) > 0,
      )
      .map((l) => ({
        description: l.name.trim(),
        quantity: l.qty,
        unitPriceCents: majorToMinor(
          parseMoney(l.unitPrice) || Number(l.unitPrice) || 0,
          money.currency,
        ),
        taxExempt: l.taxExempt,
      }))
    if (!items.length) {
      setError("Add at least one line item")
      return
    }
    setError(null)
    try {
      const payload = {
        customerName: customer.trim(),
        customerPhone: phone.trim() || undefined,
        customerEmail: email.trim() || undefined,
        deliveryAddress: address.trim() || undefined,
        shippingFeeCents: majorToMinor(
          parseMoney(shippingFee) || Number(shippingFee) || 0,
          money.currency,
        ),
        notes: notes.trim() || undefined,
        paymentMethods: ["transfer"] as Array<"transfer" | "card">,
        channel: "whatsapp" as const,
        items,
      }
      const created =
        kind === "quotation"
          ? await createQuote.mutateAsync(payload)
          : await createInvoice.mutateAsync(payload)
      onOpenChange(false)
      onCreated?.(created.id)
    } catch (e) {
      setError(getApiErrorMessage(e) || "Could not create document")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            New {kind === "quotation" ? "quotation" : "invoice"}
          </SheetTitle>
          <SheetDescription>
            Freeform lines · VAT on taxable products only · shipping never taxed
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <Field label="Customer name" value={customer} onChange={setCustomer} placeholder="Customer or company" />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+234…" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="optional" />
          <Field label="Address" value={address} onChange={setAddress} placeholder="optional" />
          <Field
            label={money.label("Shipping fee")}
            value={shippingFee}
            onChange={setShippingFee}
            placeholder="0"
            type="number"
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Line items</p>
            {lines.map((line, idx) => (
              <div key={line.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Line {idx + 1}</span>
                  {lines.length > 1 ? (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        setLines((rows) => rows.filter((r) => r.id !== line.id))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
                <input
                  value={line.name}
                  onChange={(e) =>
                    setLines((rows) =>
                      rows.map((r) =>
                        r.id === line.id ? { ...r, name: e.target.value } : r,
                      ),
                    )
                  }
                  placeholder="Description"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Qty
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) =>
                        setLines((rows) =>
                          rows.map((r) =>
                            r.id === line.id
                              ? {
                                  ...r,
                                  qty: Math.max(1, Number(e.target.value) || 1),
                                }
                              : r,
                          ),
                        )
                      }
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    {money.label("Unit price")}
                    <input
                      type="number"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) =>
                        setLines((rows) =>
                          rows.map((r) =>
                            r.id === line.id
                              ? { ...r, unitPrice: e.target.value }
                              : r,
                          ),
                        )
                      }
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={line.taxExempt}
                    onChange={(e) =>
                      setLines((rows) =>
                        rows.map((r) =>
                          r.id === line.id
                            ? { ...r, taxExempt: e.target.checked }
                            : r,
                        ),
                      )
                    }
                    className="size-3.5 rounded border-border"
                  />
                  Tax-free
                </label>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 bg-card"
              onClick={() =>
                setLines((rows) => [
                  ...rows,
                  {
                    id: String(Date.now()),
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
          </div>

          <div className="rounded-lg border border-border bg-card p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Merchandise</span>
              <span className="tabular-nums">{totals.subtotalLabel}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="tabular-nums">{totals.shippingLabel}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{branding.taxLabel}</span>
              <span className="tabular-nums">{totals.taxAmountLabel}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold">
              <span>Total</span>
              <span className="tabular-nums text-primary">{totals.totalLabel}</span>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter className="border-t border-border sm:flex-row">
          <Button variant="outline" className="bg-card" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={busy} className="gap-2" onClick={() => void submit()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Create · {totals.totalLabel}
          </Button>
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
