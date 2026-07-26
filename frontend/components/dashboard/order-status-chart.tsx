"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { orderStatusSeries } from "@/lib/data"

const config = {
  count: { label: "Orders" },
  pending: { label: "Pending", color: "var(--chart-4)" },
  paid: { label: "Paid", color: "var(--chart-1)" },
  shipped: { label: "Shipped", color: "var(--chart-2)" },
  delivered: { label: "Delivered", color: "var(--chart-3)" },
  cancelled: { label: "Cancelled", color: "var(--destructive)" },
} satisfies ChartConfig

export function OrderStatusChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Order lifecycle</CardTitle>
        <CardDescription>Orders by current status (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={orderStatusSeries} margin={{ top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={10} className="text-xs" />
            <YAxis tickLine={false} axisLine={false} width={32} className="text-xs" />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
