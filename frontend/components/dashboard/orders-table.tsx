"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CreditCard,
  Banknote,
  Search,
  MoreHorizontal,
  ShoppingCart,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "./status-badge"
import { HoldCountdown } from "./hold-countdown"
import { OrderDetailSheet } from "./order-detail-sheet"
import { EmptyState } from "./empty-state"
import type { OrderStatus } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import {
  formatNgn,
  minutesLeft,
  relativeTime,
  shortId,
  useCancelOrder,
  useOrders,
  type ApiOrder,
} from "@/api"

type FilterKey = "all" | OrderStatus

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting pay" },
  { key: "payment_review", label: "Review" },
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "expired", label: "Expired" },
]

export function OrdersTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const { isAuthenticated } = useAuth()
  const [active, setActive] = useState<FilterKey>("all")
  const [query, setQuery] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)
  const {
    data: orders = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useOrders(isAuthenticated)
  const cancelMutation = useCancelOrder()
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load orders"
    : cancelMutation.error
      ? cancelMutation.error instanceof Error
        ? cancelMutation.error.message
        : "Cancel failed"
      : null

  useEffect(() => {
    if (refreshKey > 0) void refetch()
  }, [refreshKey, refetch])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      const matchesStatus = active === "all" || o.status === active
      const matchesQuery =
        q === "" ||
        o.id.toLowerCase().includes(q) ||
        shortId(o.id).toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone?.toLowerCase().includes(q) ?? false)
      return matchesStatus && matchesQuery
    })
  }, [active, query, orders])

  async function cancelOrder(id: string) {
    await cancelMutation.mutateAsync(id)
  }

  async function copyPayLink(o: ApiOrder) {
    const url = o.payment?.paymentUrl
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs
              value={active}
              onValueChange={(v) => setActive(v as FilterKey)}
              className="w-full min-w-0 flex-1"
            >
              <div className="-mx-1 overflow-x-auto px-1">
                <TabsList className="inline-flex w-max gap-1 bg-transparent p-0">
                  {filters.map((f) => (
                    <TabsTrigger
                      key={f.key}
                      value={f.key}
                      className="rounded-md border border-transparent px-3 data-[state=active]:border-border data-[state=active]:bg-secondary"
                    >
                      {f.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => void refetch()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Refresh
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order, customer…"
              aria-label="Search orders"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <p className="text-xs text-muted-foreground">Live from API · bank transfer is default payment</p>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading orders…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={ShoppingCart}
                title="No orders yet"
                description="Create an order from Workspace or Orders — freeform lines work without inventory."
                actionLabel="Show all"
                onAction={() => {
                  setActive("all")
                  setQuery("")
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Hold / placed</TableHead>
                    <TableHead className="w-10 pr-4" aria-label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((order) => {
                    const hold = minutesLeft(order.reservedUntil)
                    return (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer transition-colors"
                        onClick={() => setDetailId(order.id)}
                      >
                        <TableCell className="pl-4 font-medium tabular-nums">
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
                            {order.payment?.method === "card" ? (
                              <CreditCard className="size-4" />
                            ) : (
                              <Banknote className="size-4" />
                            )}
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
                        <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label={`Actions for order ${order.id}`}
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailId(order.id)}>
                                View details
                              </DropdownMenuItem>
                              {order.payment?.paymentUrl ? (
                                <DropdownMenuItem onClick={() => void copyPayLink(order)}>
                                  Copy pay link
                                </DropdownMenuItem>
                              ) : null}
                              {["pending", "payment_review", "paid"].includes(order.status) ? (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => void cancelOrder(order.id)}
                                >
                                  Cancel order
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>
            Showing{" "}
            <span className="font-medium tabular-nums text-foreground">{rows.length}</span> of{" "}
            <span className="tabular-nums">{orders.length}</span> orders
          </span>
        </CardFooter>
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
