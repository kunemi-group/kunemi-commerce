"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Banknote,
  MapPin,
  Phone,
  Mail,
  Truck,
  Package,
  Loader2,
  Link2,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "./status-badge"
import { HoldCountdown } from "./hold-countdown"
import { CopyWhatsApp } from "./copy-whatsapp"
import {
  paymentLinkMessage,
  trackingMessage,
  transferInstructionsMessage,
} from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  apiGet,
  apiSend,
  formatNgn,
  minutesLeft,
  relativeTime,
  shortId,
  type ApiOrder,
} from "@/lib/api"

export function OrderDetailSheet({
  orderId,
  open,
  onOpenChange,
  onChanged,
}: {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
}) {
  const { token } = useAuth()
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!orderId || !token) {
      setOrder(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const o = await apiGet<ApiOrder>(`/orders/${orderId}`, token)
      setOrder(o)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load order")
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId, token])

  useEffect(() => {
    if (open && orderId) void load()
  }, [open, orderId, load])

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://workspace.kunemi.local"
  const trackingToken = order?.delivery?.trackingToken
  const trackingUrl = trackingToken ? `${origin}/track/${trackingToken}` : null
  const payUrl = order?.payment?.paymentUrl ?? null
  const hold = minutesLeft(order?.reservedUntil)

  async function cancel() {
    if (!order || !token) return
    setBusy(true)
    try {
      await apiSend(`/orders/${order.id}/cancel`, "PATCH", {}, token)
      await load()
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed")
    } finally {
      setBusy(false)
    }
  }

  async function ship() {
    if (!order || !token) return
    setBusy(true)
    try {
      await apiSend(
        "/deliveries",
        "POST",
        { orderId: order.id, fulfillmentMode: "manual" },
        token,
      )
      await load()
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ship failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto sm:max-w-md data-[side=right]:sm:max-w-md"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : order ? (
          <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <SheetTitle className="tabular-nums">{shortId(order.id)}</SheetTitle>
                  <SheetDescription>
                    {order.customerName} · {order.customerPhone}
                  </SheetDescription>
                </div>
                <StatusBadge status={order.status} />
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-4 p-4 animate-fade-in">
              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              {order.status === "pending" && hold != null ? (
                <HoldCountdown minutesLeft={hold} />
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <Meta
                  icon={<Banknote className="size-3.5" />}
                  label="Payment"
                  value={
                    order.payment?.status === "claimed"
                      ? "Claimed · review"
                      : order.payment?.status === "verified"
                        ? "Verified"
                        : "Bank transfer"
                  }
                />
                <Meta label="Total" value={formatNgn(order.totalCents)} strong />
                <Meta
                  icon={<Phone className="size-3.5" />}
                  label="Phone"
                  value={order.customerPhone ?? "—"}
                />
                <Meta
                  icon={<Mail className="size-3.5" />}
                  label="Email"
                  value={order.customerEmail ?? "—"}
                />
                <Meta
                  icon={<Package className="size-3.5" />}
                  label="Items"
                  value={String(order.items?.length ?? 0)}
                />
                <Meta label="Placed" value={relativeTime(order.createdAt)} />
              </div>

              {order.deliveryAddress ? (
                <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery address</p>
                    <p className="text-sm">{order.deliveryAddress}</p>
                  </div>
                </div>
              ) : null}

              {order.payment?.reference ? (
                <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Transfer reference</p>
                  <p className="font-mono font-medium">{order.payment.reference}</p>
                  {payUrl ? (
                    <p className="mt-1 truncate text-xs text-primary">{payUrl}</p>
                  ) : null}
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Line items
                </p>
                <ul className="space-y-2">
                  {(order.items ?? []).map((line) => (
                    <li
                      key={line.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span>
                        {line.description}{" "}
                        <span className="text-muted-foreground">×{line.quantity}</span>
                        {line.taxExempt ? (
                          <span className="ml-1 text-[10px] text-muted-foreground">tax-free</span>
                        ) : null}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatNgn(line.unitPriceCents * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatNgn(order.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="tabular-nums">{formatNgn(order.shippingFeeCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="tabular-nums">{formatNgn(order.taxCents)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>Total</span>
                    <span className="tabular-nums">{formatNgn(order.totalCents)}</span>
                  </div>
                </div>
              </div>

              {order.statusHistory?.length ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Lifecycle
                  </p>
                  <ol>
                    {order.statusHistory.map((step, i) => {
                      const last = i === order.statusHistory!.length - 1
                      return (
                        <li key={step.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className="mt-1 size-2.5 rounded-full bg-success ring-4 ring-success/20" />
                            {!last ? (
                              <span className="my-1 min-h-6 w-px flex-1 bg-success/40" />
                            ) : null}
                          </div>
                          <div className={cn("pb-3", last && "pb-0")}>
                            <p className="text-sm font-medium">{step.toStatus}</p>
                            <p className="text-xs text-muted-foreground">
                              {step.reason ?? relativeTime(step.createdAt)}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              ) : null}

              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Share on WhatsApp
                </p>
                {order.status === "pending" && payUrl ? (
                  <CopyWhatsApp
                    phone={order.customerPhone}
                    message={paymentLinkMessage({
                      customer: order.customerName,
                      orderId: shortId(order.id),
                      total: formatNgn(order.totalCents),
                      paymentLink: payUrl,
                    })}
                    label="Copy payment link message"
                  />
                ) : null}
                {order.status === "pending" ? (
                  <CopyWhatsApp
                    phone={order.customerPhone}
                    message={transferInstructionsMessage({
                      customer: order.customerName,
                      orderId: shortId(order.id),
                      total: formatNgn(order.totalCents),
                    })}
                    label="Copy transfer follow-up"
                  />
                ) : null}
                {trackingUrl ? (
                  <CopyWhatsApp
                    phone={order.customerPhone}
                    message={trackingMessage({
                      customer: order.customerName,
                      orderId: shortId(order.id),
                      trackingUrl,
                    })}
                    label="Copy tracking message"
                  />
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {payUrl ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 bg-card"
                    onClick={() => void navigator.clipboard.writeText(payUrl)}
                  >
                    <Link2 className="size-4" />
                    Copy pay link
                  </Button>
                ) : null}
                {order.status === "paid" && !order.delivery ? (
                  <Button size="sm" className="gap-2" disabled={busy} onClick={() => void ship()}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
                    Create delivery
                  </Button>
                ) : null}
                {trackingUrl ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-card"
                    render={<Link href={`/track/${trackingToken}`} />}
                  >
                    Open tracking
                  </Button>
                ) : null}
                {["pending", "payment_review", "paid"].includes(order.status) ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void cancel()}
                  >
                    Cancel order
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <SheetHeader>
            <SheetTitle>Order not found</SheetTitle>
            <SheetDescription>
              {error ?? "Select an order from the list."}
            </SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Meta({
  icon,
  label,
  value,
  strong,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={cn("mt-0.5 truncate text-sm", strong && "font-semibold tabular-nums")}>
        {value}
      </p>
    </div>
  )
}
