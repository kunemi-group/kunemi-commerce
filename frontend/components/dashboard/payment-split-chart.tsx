"use client"

import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAuth } from "@/lib/auth-context"
import { buildPaymentMethodSeries, usePayments } from "@/api"

const config = {
  value: { label: "Payments" },
  bank: { label: "Bank transfer", color: "var(--chart-1)" },
  other: { label: "Other", color: "var(--chart-2)" },
} satisfies ChartConfig

export function PaymentSplitChart() {
  const { isAuthenticated } = useAuth()
  const { data: payments = [], isLoading } = usePayments(isAuthenticated)
  const series = useMemo(() => buildPaymentMethodSeries(payments), [payments])
  const total = series.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Payment methods</CardTitle>
        <CardDescription>Bank transfer is default (live)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : total === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No payments yet</p>
            <p>Claims and verified transfers show up here.</p>
          </div>
        ) : (
          <>
            <ChartContainer config={config} className="mx-auto aspect-square h-[200px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={series}
                  dataKey="value"
                  nameKey="method"
                  innerRadius={56}
                  strokeWidth={4}
                  stroke="var(--card)"
                >
                  {series.map((entry, i) => (
                    <Cell
                      key={entry.method}
                      fill={i === 0 ? "var(--chart-1)" : "var(--chart-2)"}
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
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
                              Payments
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
              {series.map((d, i) => (
                <div key={d.method} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        background: i === 0 ? "var(--chart-1)" : "var(--chart-2)",
                      }}
                    />
                    {d.method}
                  </span>
                  <span className="font-medium tabular-nums">
                    {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
