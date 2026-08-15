"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAuth } from "@/lib/auth-context"
import { buildRevenueSeries, useMoney, useOrders } from "@/api"

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

export function RevenueChart({ days = 14 }: { days?: number }) {
  const { isAuthenticated } = useAuth()
  const money = useMoney()
  const { data: orders = [], isLoading } = useOrders(isAuthenticated)
  const series = useMemo(
    () => buildRevenueSeries(orders, days, money.currency),
    [orders, money.currency, days],
  )
  const hasData = series.some((d) => d.orders > 0 || d.revenue > 0)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Revenue &amp; orders</CardTitle>
          <CardDescription>
            Last {days} days · paid, shipped, and delivered (live)
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
        {isLoading ? (
          <div className="flex h-[260px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : !hasData ? (
          <div className="flex h-[260px] flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              No confirmed revenue yet
            </p>
            <p>Paid orders will appear here by day.</p>
          </div>
        ) : (
          <ChartContainer config={config} className="h-[260px] w-full">
            <AreaChart data={series} margin={{ left: 4, right: 4, top: 8 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-orders)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-orders)"
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
                        <span className="text-muted-foreground capitalize">
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
                fill="url(#fillRevenue)"
              />
              <Area
                yAxisId="right"
                dataKey="orders"
                type="monotone"
                stroke="var(--color-orders)"
                strokeWidth={2}
                fill="url(#fillOrders)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
