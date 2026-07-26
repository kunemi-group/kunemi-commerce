import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { lowStock } from "@/lib/data"

export function LowStock() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            Low stock alerts
          </CardTitle>
          <CardDescription>Variants at or below their threshold</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {lowStock.map((item) => {
          const available = item.onHand - item.reserved
          const critical = available <= 1
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.product}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.variant} · {item.sku}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    critical ? "text-destructive" : "text-warning",
                  )}
                >
                  {available} left
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {item.reserved} reserved
                </p>
              </div>
            </div>
          )
        })}
        <Button variant="outline" size="sm" className="mt-1 w-full bg-card" render={<Link href="/inventory" />}>
          Manage inventory
        </Button>
      </CardContent>
    </Card>
  )
}
