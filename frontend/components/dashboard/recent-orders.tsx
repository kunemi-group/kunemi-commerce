"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCard, Banknote } from "lucide-react"
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
import { recentOrders } from "@/lib/data"

export function RecentOrders() {
  const [detailId, setDetailId] = useState<string | null>(null)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest orders created across all agents</CardDescription>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Agent</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Hold / placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer transition-colors"
                    onClick={() => setDetailId(order.id)}
                  >
                    <TableCell className="font-medium tabular-nums">{order.id}</TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <span className="block">{order.customer}</span>
                        <span className="block text-xs text-muted-foreground">
                          {order.items} item{order.items > 1 ? "s" : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {order.agent}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        {order.payment === "card" ? (
                          <CreditCard className="size-4" />
                        ) : (
                          <Banknote className="size-4" />
                        )}
                        {order.payment === "card" ? "Card" : "Transfer"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {order.total}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="hidden text-right text-sm text-muted-foreground lg:table-cell">
                      {order.status === "pending" && order.holdMinutesLeft != null ? (
                        <HoldCountdown
                          minutesLeft={order.holdMinutesLeft}
                          compact
                          className="ml-auto"
                        />
                      ) : (
                        order.placed
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <OrderDetailSheet
        orderId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </>
  )
}
