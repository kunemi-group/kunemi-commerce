"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAuth } from "@/lib/auth-context"
import { useOrders } from "@/api"
import { Loader2 } from "lucide-react"

const config = {
  count: { label: "Orders" },
  pending: { label: "Pending", color: "var(--chart-4)" },
  payment_review: { label: "Review", color: "var(--chart-1)" },
  paid: { label: "Paid", color: "var(--chart-1)" },
  shipped: { label: "Shipped", color: "var(--chart-2)" },
  delivered: { label: "Delivered", color: "var(--chart-3)" },
  cancelled: { label: "Cancelled", color: "var(--destructive)" },
  expired: { label: "Expired", color: "var(--muted-foreground)" },
} satisfies ChartConfig

const COLORS: Record<string, string> = {
  pending: "var(--chart-4)",
  payment_review: "var(--chart-1)",
  paid: "var(--chart-1)",
  shipped: "var(--chart-2)",
  delivered: "var(--chart-3)",
  cancelled: "var(--destructive)",
  expired: "var(--muted-foreground)",
}

const LABELS: Record<string, string> = {
  pending: "Pending",
  payment_review: "Review",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
}

export function OrderStatusChart() {
  const { isAuthenticated } = useAuth()
  const { data: orders = [], isLoading } = useOrders(isAuthenticated)

  const series = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of orders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1
    }
    return Object.entries(counts).map(([status, count]) => ({
      status: LABELS[status] ?? status,
      key: status,
      count,
      fill: COLORS[status] ?? "var(--chart-1)",
    }))
  }, [orders])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Order lifecycle</CardTitle>
        <CardDescription>Orders by current status (live)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[260px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : series.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No orders yet
          </div>
        ) : (
          <ChartContainer config={config} className="h-[260px] w-full">
            <BarChart data={series} margin={{ top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="status"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} width={32} className="text-xs" allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {series.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
