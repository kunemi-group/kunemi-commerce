"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Loader2,
  Package,
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  buildInsightsMoney,
  buildOrdersFunnel,
  buildPaymentHealth,
  buildRevenueSeriesForPeriod,
  buildStockRisk,
  buildTopProducts,
  resolveInsightsPeriod,
  type InsightsPeriodPreset,
  useMoney,
  useOrders,
  usePayments,
  useProducts,
} from "@/api"

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

const PRESETS: Array<{ id: InsightsPeriodPreset; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "custom", label: "Custom" },
]

function StatCard({
  label,
  value,
  helper,
  delta,
  trend = "up",
}: {
  label: string
  value: string
  helper: string
  delta?: string
  trend?: "up" | "down"
}) {
  const up = trend === "up"
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
              up
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground",
            )}
          >
            {up ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {delta}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </Card>
  )
}

function FunnelBar({
  label,
  value,
  max,
  tone = "default",
}: {
  label: string
  value: number
  max: number
  tone?: "default" | "warn" | "danger" | "success"
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const bar =
    tone === "success"
      ? "bg-success"
      : tone === "warn"
        ? "bg-warning"
        : tone === "danger"
          ? "bg-destructive"
          : "bg-primary"
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {pct}%
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", bar)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

export function InsightsPanel() {
  const { isAuthenticated } = useAuth()
  const money = useMoney()
  const [preset, setPreset] = useState<InsightsPeriodPreset>("7d")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const { data: orders = [], isLoading: ordersLoading } =
    useOrders(isAuthenticated)
  const { data: payments = [], isLoading: paymentsLoading } =
    usePayments(isAuthenticated)
  const { data: products = [], isLoading: productsLoading } =
    useProducts(isAuthenticated)

  const period = useMemo(
    () =>
      resolveInsightsPeriod(preset, {
        customStart: customStart || undefined,
        customEnd: customEnd || undefined,
      }),
    [preset, customStart, customEnd],
  )

  const moneyStats = useMemo(
    () => buildInsightsMoney(orders, payments, period),
    [orders, payments, period],
  )
  const funnel = useMemo(
    () => buildOrdersFunnel(orders, period),
    [orders, period],
  )
  const topProducts = useMemo(
    () => buildTopProducts(orders, period, 8),
    [orders, period],
  )
  const paymentHealth = useMemo(
    () => buildPaymentHealth(payments, period),
    [payments, period],
  )
  const stockRisk = useMemo(() => buildStockRisk(products, 8), [products])
  const series = useMemo(
    () => buildRevenueSeriesForPeriod(orders, period, money.currency),
    [orders, period, money.currency],
  )
  const hasSeries = series.some((d) => d.orders > 0 || d.revenue > 0)
  const loading = ordersLoading || paymentsLoading || productsLoading
  const funnelMax = Math.max(funnel.created, 1)

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={preset === p.id ? "default" : "outline"}
              className={preset === p.id ? "" : "bg-card"}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        {preset === "custom" ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Start date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="End date"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{period.label}</p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading insights…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Gross sales"
              value={money.format(moneyStats.grossSalesCents)}
              helper="Paid, shipped, delivered"
              delta={`${moneyStats.confirmedOrderCount} orders`}
              trend="up"
            />
            <StatCard
              label="Collected"
              value={money.format(moneyStats.collectedCents)}
              helper="Verified bank transfers"
              delta="verified"
              trend="up"
            />
            <StatCard
              label="Outstanding"
              value={money.format(moneyStats.outstandingCents)}
              helper="Awaiting payment + under review"
              delta={`${moneyStats.outstandingOrderCount} open`}
              trend={moneyStats.outstandingOrderCount > 0 ? "down" : "up"}
            />
            <StatCard
              label="Orders created"
              value={String(moneyStats.orderCount)}
              helper={period.label}
              delta="in period"
              trend="up"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" />
                    Revenue &amp; orders
                  </CardTitle>
                  <CardDescription>
                    {period.label} · confirmed revenue by day
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-chart-1" />
                    Revenue
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-chart-2" />
                    Orders
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {!hasSeries ? (
                  <div className="flex h-[260px] flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      No confirmed revenue in this period
                    </p>
                    <p>Paid orders will appear here by day.</p>
                  </div>
                ) : (
                  <ChartContainer
                    config={chartConfig}
                    className="h-[260px] w-full"
                  >
                    <AreaChart
                      data={series}
                      margin={{ left: 4, right: 4, top: 8 }}
                    >
                      <defs>
                        <linearGradient
                          id="fillInsightsRev"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-revenue)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-revenue)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        minTickGap={24}
                        className="text-xs"
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                        }
                        className="text-xs"
                      />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            indicator="dot"
                            formatter={(value, name) => (
                              <div className="flex w-full items-center justify-between gap-3">
                                <span className="capitalize text-muted-foreground">
                                  {name}
                                </span>
                                <span className="font-medium tabular-nums">
                                  {name === "revenue"
                                    ? money.formatMajor(Number(value) || 0)
                                    : Number(value).toLocaleString()}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Area
                        yAxisId="left"
                        dataKey="revenue"
                        type="monotone"
                        stroke="var(--color-revenue)"
                        strokeWidth={2}
                        fill="url(#fillInsightsRev)"
                      />
                      <Area
                        yAxisId="right"
                        dataKey="orders"
                        type="monotone"
                        stroke="var(--color-orders)"
                        strokeWidth={2}
                        fill="transparent"
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders funnel</CardTitle>
                <CardDescription>
                  Status mix for orders created in period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <FunnelBar
                  label="Created"
                  value={funnel.created}
                  max={funnelMax}
                />
                <FunnelBar
                  label="Pending payment"
                  value={funnel.pending}
                  max={funnelMax}
                  tone="warn"
                />
                <FunnelBar
                  label="Under review"
                  value={funnel.paymentReview}
                  max={funnelMax}
                  tone="warn"
                />
                <FunnelBar
                  label="Paid"
                  value={funnel.paid}
                  max={funnelMax}
                  tone="success"
                />
                <FunnelBar
                  label="Shipped"
                  value={funnel.shipped}
                  max={funnelMax}
                />
                <FunnelBar
                  label="Delivered"
                  value={funnel.delivered}
                  max={funnelMax}
                  tone="success"
                />
                <FunnelBar
                  label="Cancelled"
                  value={funnel.cancelled}
                  max={funnelMax}
                  tone="danger"
                />
                <FunnelBar
                  label="Expired"
                  value={funnel.expired}
                  max={funnelMax}
                  tone="danger"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Payment health</CardTitle>
                <CardDescription>
                  Bank transfer activity in period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">Claims</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {paymentHealth.claims}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">Verified</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {paymentHealth.verified}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">Rejected</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {paymentHealth.rejected}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/40 p-3">
                    <p className="text-xs text-muted-foreground">Awaiting</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {paymentHealth.awaiting}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Median time to verify:{" "}
                  <span className="font-medium text-foreground">
                    {paymentHealth.medianVerifyMinutes == null
                      ? "—"
                      : `${paymentHealth.medianVerifyMinutes} min`}
                  </span>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-card"
                  render={<Link href="/payments" />}
                >
                  Open Money
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>Top products</CardTitle>
                  <CardDescription>
                    Confirmed sales by line revenue
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No confirmed product lines in this period.
                  </p>
                ) : (
                  topProducts.map((row, i) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          <span className="mr-1.5 text-xs text-muted-foreground">
                            #{i + 1}
                          </span>
                          {row.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.units} unit{row.units === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {money.format(row.revenueCents)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-warning" />
                    Stock risk
                  </CardTitle>
                  <CardDescription>
                    At or below low-stock threshold
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-card"
                  render={<Link href="/inventory" />}
                >
                  Products
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {stockRisk.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No low-stock variants. Empty catalog is fine.
                  </p>
                ) : (
                  stockRisk.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {row.product}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.variant}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge
                          variant="secondary"
                          className={cn(
                            row.critical &&
                              "bg-destructive/15 text-destructive",
                          )}
                        >
                          {row.available} left
                        </Badge>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          threshold {row.threshold}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {stockRisk.length > 0 ? (
                  <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                    <Package className="size-3.5" />
                    Restock from Products when inventory is enabled.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
