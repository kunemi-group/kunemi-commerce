"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Banknote,
  Clock,
  Package,
  Truck,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  flattenInventory,
  formatNgn,
  minutesLeft,
  shortId,
  useDeliveries,
  useOrders,
  usePayments,
  useProducts,
} from "@/api"

type AttentionKind =
  | "payment_review"
  | "hold_expiring"
  | "low_stock"
  | "awaiting_pickup"
  | "failed_delivery"

type AttentionItem = {
  id: string
  kind: AttentionKind
  title: string
  detail: string
  href: string
  urgency: "high" | "medium" | "low"
  meta?: string
}

const kindIcon: Record<AttentionKind, typeof AlertTriangle> = {
  payment_review: Banknote,
  hold_expiring: Clock,
  low_stock: Package,
  awaiting_pickup: Truck,
  failed_delivery: AlertTriangle,
}

const urgencyStyles = {
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-warning/30 bg-warning/5",
  low: "border-border bg-secondary/30",
}

export function AttentionInbox({
  dense = false,
  limit,
}: {
  dense?: boolean
  limit?: number
}) {
  const { isAuthenticated } = useAuth()
  const { data: orders = [], isLoading: oLoad } = useOrders(isAuthenticated)
  const { data: payments = [], isLoading: pLoad } = usePayments(isAuthenticated)
  const { data: products = [], isLoading: prLoad } = useProducts(isAuthenticated)
  const { data: deliveries = [], isLoading: dLoad } = useDeliveries(isAuthenticated)
  const loading = oLoad || pLoad || prLoad || dLoad

  const items = useMemo(() => {
    const list: AttentionItem[] = []

    const claimed = payments.filter((p) => p.status === "claimed")
    if (claimed.length > 0) {
      const total = claimed.reduce((s, p) => s + p.amountCents, 0)
      list.push({
        id: "pay-review",
        kind: "payment_review",
        title: `${claimed.length} transfer${claimed.length === 1 ? "" : "s"} need confirmation`,
        detail: "Manual proofs waiting — confirm to mark orders paid",
        href: "/payments",
        urgency: "high",
        meta: formatNgn(total),
      })
    }

    for (const o of orders) {
      if (o.status !== "pending" || !o.reservedUntil) continue
      const m = minutesLeft(o.reservedUntil)
      if (m == null || m > 15) continue
      list.push({
        id: `hold-${o.id}`,
        kind: "hold_expiring",
        title: `Hold expiring on ${shortId(o.id)}`,
        detail: `${o.customerName} · ~${m} min left`,
        href: "/orders",
        urgency: m <= 5 ? "high" : "medium",
        meta: `${m}m left`,
      })
    }

    const low = flattenInventory(products).filter(
      (i) => i.onHand - i.reserved <= i.threshold,
    )
    if (low.length > 0) {
      const worst = low.sort(
        (a, b) => a.onHand - a.reserved - (b.onHand - b.reserved),
      )[0]
      list.push({
        id: "low-stock",
        kind: "low_stock",
        title: `${low.length} SKU${low.length === 1 ? "" : "s"} at or below threshold`,
        detail: `${worst.product} is critical (${worst.onHand - worst.reserved} available)`,
        href: "/inventory",
        urgency: "medium",
      })
    }

    const awaiting = deliveries.filter((d) => d.status === "awaiting_pickup")
    if (awaiting.length > 0) {
      const d = awaiting[0]
      list.push({
        id: "await-pickup",
        kind: "awaiting_pickup",
        title: `${awaiting.length} parcel${awaiting.length === 1 ? "" : "s"} awaiting pickup`,
        detail: `${shortId(d.orderId)} · ${d.order?.customerName ?? "Customer"}`,
        href: "/deliveries",
        urgency: "medium",
      })
    }

    const failed = deliveries.filter((d) => d.status === "failed")
    for (const d of failed.slice(0, 3)) {
      list.push({
        id: `fail-${d.id}`,
        kind: "failed_delivery",
        title: `Delivery failed · ${shortId(d.orderId)}`,
        detail: d.order?.customerName ?? "Customer",
        href: "/deliveries",
        urgency: "high",
      })
    }

    return list
  }, [orders, payments, products, deliveries])

  const shown = limit ? items.slice(0, limit) : items
  const high = items.filter((i) => i.urgency === "high").length

  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardHeader className={cn("flex flex-row items-center justify-between gap-2", dense && "py-3")}>
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            Needs you
            {high > 0 ? (
              <Badge className="border-0 bg-destructive/15 text-destructive tabular-nums">
                {high} urgent
              </Badge>
            ) : null}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Transfers, expiring holds, stock, and delivery exceptions
          </p>
        </div>
      </CardHeader>
      <CardContent className={cn("grid gap-2", dense ? "pt-0" : "")}>
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Checking live queues…
          </div>
        ) : shown.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            You&apos;re clear — no urgent items from orders, payments, stock, or deliveries.
          </p>
        ) : (
          shown.map((item, idx) => {
            const Icon = kindIcon[item.kind]
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5",
                  urgencyStyles[item.urgency],
                  "animate-fade-up",
                )}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    item.urgency === "high"
                      ? "bg-destructive/15 text-destructive"
                      : item.urgency === "medium"
                        ? "bg-warning/15 text-warning"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  {item.meta ? (
                    <p className="mt-1 text-xs font-medium tabular-nums">{item.meta}</p>
                  ) : null}
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
