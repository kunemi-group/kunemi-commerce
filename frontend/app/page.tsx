"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Package, Plus, ShoppingCart } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OrderStatusChart } from "@/components/dashboard/order-status-chart"
import { PaymentSplitChart } from "@/components/dashboard/payment-split-chart"
import { AgentPerformance } from "@/components/dashboard/agent-performance"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { LowStock } from "@/components/dashboard/low-stock"
import { AttentionInbox } from "@/components/dashboard/attention-inbox"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import { CreateOrderDrawer } from "@/components/dashboard/create-order-drawer"
import { OrderDetailSheet } from "@/components/dashboard/order-detail-sheet"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { minutesLeft, shortId, useMoney, useOrders } from "@/api"

export default function Page() {
  const { isAuthenticated, user } = useAuth()
  const money = useMoney()
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const { data: orders = [], isLoading: ordersLoading } =
    useOrders(isAuthenticated)

  const needsAction = useMemo(
    () =>
      orders
        .filter((o) => ["pending", "payment_review", "paid"].includes(o.status))
        .slice(0, 6),
    [orders],
  )

  const firstName = user?.fullName?.split(/\s+/)[0] ?? "there"

  return (
    <DashboardShell
      title="Home"
      subtitle={`${firstName}, take orders, confirm payments, and ship — one place.`}
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Today’s work"
          description="Confirm transfers, close holds, create orders. Chat lives in Inbox."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2 bg-card"
                render={<Link href="/inventory" />}
              >
                <Package className="size-4" />
                Products
              </Button>
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                New order
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <AttentionInbox />
          </div>
          <OnboardingChecklist />
        </div>

        <KpiCards />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4 text-primary" />
              Needs action
              <Badge variant="secondary" className="ml-1 tabular-nums">
                {needsAction.length}
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              render={<Link href="/orders" />}
            >
              All orders
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading orders…
              </div>
            ) : needsAction.length === 0 ? (
              <EmptyState
                dense
                icon={ShoppingCart}
                title="Nothing waiting"
                description="New orders and payment reviews will show up here."
                actionLabel="New order"
                onAction={() => setCreateOpen(true)}
              />
            ) : (
              needsAction.map((order) => {
                const hold = minutesLeft(order.reservedUntil)
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setDetailId(order.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          {order.customerName}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {shortId(order.id)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {money.format(order.totalCents)}
                        {hold !== undefined ? ` · hold ${hold}m left` : ""}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <PaymentSplitChart />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OrderStatusChart />
          </div>
          <AgentPerformance />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentOrders />
          </div>
          <LowStock />
        </div>
      </div>

      <CreateOrderDrawer open={createOpen} onOpenChange={setCreateOpen} />
      <OrderDetailSheet
        orderId={detailId}
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
      />
    </DashboardShell>
  )
}
