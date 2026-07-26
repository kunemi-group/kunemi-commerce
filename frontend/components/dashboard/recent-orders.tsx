"use client"

import { useState } from "react"
import Link from "next/link"
import { Banknote, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import { HoldCountdown } from "./hold-countdown"
import { OrderDetailSheet } from "./order-detail-sheet"
import { useAuth } from "@/lib/auth-context"
import {
  formatNgn,
  minutesLeft,
  relativeTime,
  shortId,
  useOrders,
} from "@/api"

export function RecentOrders() {
  const { isAuthenticated } = useAuth()
  const { data: orders = [], isLoading, refetch } = useOrders(isAuthenticated)
  const [detailId, setDetailId] = useState<string | null>(null)
  const recent = orders.slice(0, 8)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest orders from the API</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-card"
            render={<Link href="/orders" />}
          >
            View all
          </Button>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : recent.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No orders yet. Create one from Orders or Workspace.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Hold / placed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((order) => {
                    const hold = minutesLeft(order.reservedUntil)
                    return (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer transition-colors"
                        onClick={() => setDetailId(order.id)}
                      >
                        <TableCell className="font-medium tabular-nums">
                          {shortId(order.id)}
                        </TableCell>
                        <TableCell>
                          <div className="leading-tight">
                            <span className="block">{order.customerName}</span>
                            <span className="block text-xs text-muted-foreground">
                              {(order.items?.length ?? 0)} item
                              {(order.items?.length ?? 0) === 1 ? "" : "s"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Banknote className="size-4" />
                            Transfer
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatNgn(order.totalCents)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="hidden text-right text-sm text-muted-foreground lg:table-cell">
                          {order.status === "pending" && hold != null ? (
                            <HoldCountdown
                              minutesLeft={hold}
                              compact
                              className="ml-auto"
                            />
                          ) : (
                            relativeTime(order.createdAt)
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailSheet
        orderId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        onChanged={() => void refetch()}
      />
    </>
  )
}
