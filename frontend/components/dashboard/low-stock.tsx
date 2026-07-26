"use client"

import Link from "next/link"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { flattenInventory, useProducts } from "@/api"

export function LowStock() {
  const { isAuthenticated } = useAuth()
  const { data: products = [], isLoading } = useProducts(isAuthenticated)
  const inventory = flattenInventory(products)
  const low = inventory
    .filter((i) => i.onHand - i.reserved <= i.threshold)
    .sort((a, b) => a.onHand - a.reserved - (b.onHand - b.reserved))
    .slice(0, 6)

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
        <Button
          variant="outline"
          size="sm"
          className="bg-card"
          render={<Link href="/inventory" />}
        >
          Inventory
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : low.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No low-stock variants. Empty catalog is fine — inventory is optional.
          </p>
        ) : (
          low.map((item) => {
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
          })
        )}
      </CardContent>
    </Card>
  )
}
