"use client"

import { useMemo } from "react"
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Kpi } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import { formatNgn, useOrders, usePayments } from "@/api"

export function KpiCards({ items }: { items?: Kpi[] }) {
  const { isAuthenticated } = useAuth()
  const { data: orders = [], isLoading: ordersLoading } = useOrders(
    isAuthenticated && !items,
  )
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(
    isAuthenticated && !items,
  )

  const live = useMemo((): Kpi[] => {
    if (items) return items
    const total = orders.length
    const awaiting = orders.filter(
      (o) => o.status === "pending" || o.status === "payment_review",
    ).length
    const revenue = orders
      .filter((o) => ["paid", "shipped", "delivered"].includes(o.status))
      .reduce((s, o) => s + o.totalCents, 0)
    const review = payments.filter((p) => p.status === "claimed").length
    return [
      {
        id: "orders",
        label: "Orders",
        value: String(total),
        delta: total > 0 ? "live" : "—",
        trend: "up",
        helper: "all time in workspace",
      },
      {
        id: "awaiting",
        label: "Awaiting payment / review",
        value: String(awaiting),
        delta: review > 0 ? `${review} claims` : "—",
        trend: awaiting > 0 ? "up" : "down",
        helper: "pending + payment_review",
      },
      {
        id: "revenue",
        label: "Confirmed revenue",
        value: formatNgn(revenue),
        delta: "paid+",
        trend: "up",
        helper: "paid, shipped, delivered",
      },
      {
        id: "review",
        label: "Transfers to review",
        value: String(review),
        delta: review > 0 ? "action" : "clear",
        trend: review > 0 ? "up" : "down",
        helper: "claimed bank transfers",
      },
    ]
  }, [items, orders, payments])

  const loading = !items && (ordersLoading || paymentsLoading)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {live.map((kpi) => {
        const up = kpi.trend === "up"
        return (
          <Card key={kpi.id} className="gap-0 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                  up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                )}
              >
                {up ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {kpi.delta}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.helper}</p>
          </Card>
        )
      })}
    </div>
  )
}
