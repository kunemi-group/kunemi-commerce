"use client"

import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { paymentMethodSeries } from "@/lib/data"

const config = {
  value: { label: "Orders" },
  card: { label: "Card", color: "var(--chart-1)" },
  manual: { label: "Manual transfer", color: "var(--chart-2)" },
} satisfies ChartConfig

const total = paymentMethodSeries.reduce((sum, d) => sum + d.value, 0)

export function PaymentSplitChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Payment methods</CardTitle>
        <CardDescription>Card checkout vs. manual transfer</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ChartContainer config={config} className="mx-auto aspect-square h-[200px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={paymentMethodSeries}
              dataKey="value"
              nameKey="method"
              innerRadius={56}
              strokeWidth={4}
              stroke="var(--card)"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-semibold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          Paid orders
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 flex w-full flex-col gap-2">
          {paymentMethodSeries.map((d, i) => (
            <div key={d.method} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: i === 0 ? "var(--chart-1)" : "var(--chart-2)" }}
                />
                {d.method}
              </span>
              <span className="font-medium tabular-nums">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
