import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { kpis, type Kpi } from "@/lib/data"

export function KpiCards({ items = kpis }: { items?: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((kpi) => {
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
