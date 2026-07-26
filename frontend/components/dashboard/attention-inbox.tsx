"use client"

import Link from "next/link"
import {
  AlertTriangle,
  Banknote,
  Clock,
  Package,
  Truck,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { attentionItems, type AttentionKind } from "@/lib/data"

const kindIcon: Record<AttentionKind, typeof AlertTriangle> = {
  payment_review: Banknote,
  hold_expiring: Clock,
  low_stock: Package,
  awaiting_pickup: Truck,
  failed_delivery: AlertTriangle,
}

const urgencyStyles = {
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-warning/30 bg-warning/5",
  low: "border-border bg-secondary/30",
}

export function AttentionInbox({
  dense = false,
  limit,
}: {
  dense?: boolean
  limit?: number
}) {
  const items = limit ? attentionItems.slice(0, limit) : attentionItems
  const high = attentionItems.filter((i) => i.urgency === "high").length

  return (
    <Card className="overflow-hidden animate-fade-in">
      <CardHeader className={cn("flex flex-row items-center justify-between gap-2", dense && "py-3")}>
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            Needs you
            {high > 0 ? (
              <Badge className="border-0 bg-destructive/15 text-destructive tabular-nums">
                {high} urgent
              </Badge>
            ) : null}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Transfers, expiring holds, stock, and delivery exceptions
          </p>
        </div>
      </CardHeader>
      <CardContent className={cn("grid gap-2", dense ? "pt-0" : "")}>
        {items.map((item, idx) => {
          const Icon = kindIcon[item.kind]
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5",
                urgencyStyles[item.urgency],
                "animate-fade-up",
              )}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                  item.urgency === "high"
                    ? "bg-destructive/15 text-destructive"
                    : item.urgency === "medium"
                      ? "bg-warning/15 text-warning"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  {item.meta ? (
                    <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                      {item.meta}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
