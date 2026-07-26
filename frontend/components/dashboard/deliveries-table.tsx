"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Search,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Truck,
  Hand,
  Link2,
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
import { DeliveryStatusBadge } from "./status-badge"
import { EmptyState } from "./empty-state"
import { useAuth } from "@/lib/auth-context"
import {
  relativeTime,
  shortId,
  useDeliveries,
  useUpdateDeliveryStatus,
  type ApiDelivery,
} from "@/api"

type FilterKey =
  | "all"
  | "awaiting_pickup"
  | "out_for_delivery"
  | "delivered"
  | "manual"
  | "api_integrated"

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "awaiting_pickup", label: "Awaiting pickup" },
  { key: "out_for_delivery", label: "In transit" },
  { key: "delivered", label: "Delivered" },
  { key: "manual", label: "Manual" },
  { key: "api_integrated", label: "API" },
]

const NEXT_STATUS: Record<string, string | null> = {
  awaiting_pickup: "picked_up",
  picked_up: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
  failed: "awaiting_pickup",
  cancelled: null,
}

export function DeliveriesTable() {
  const { isAuthenticated } = useAuth()
  const [active, setActive] = useState<FilterKey>("all")
  const [query, setQuery] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const {
    data: deliveries = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useDeliveries(isAuthenticated)
  const statusMutation = useUpdateDeliveryStatus()
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load deliveries"
    : statusMutation.error
      ? statusMutation.error instanceof Error
        ? statusMutation.error.message
        : "Status update failed"
      : null

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return deliveries.filter((d) => {
      const matchesFilter =
        active === "all" ||
        d.status === active ||
        (active === "out_for_delivery" &&
          (d.status === "out_for_delivery" || d.status === "picked_up")) ||
        d.fulfillmentMode === active
      const customer = d.order?.customerName ?? ""
      const dest = d.order?.deliveryAddress ?? ""
      const matchesQuery =
        q === "" ||
        d.orderId.toLowerCase().includes(q) ||
        shortId(d.orderId).toLowerCase().includes(q) ||
        customer.toLowerCase().includes(q) ||
        dest.toLowerCase().includes(q) ||
        d.trackingToken.toLowerCase().includes(q) ||
        (d.provider?.toLowerCase().includes(q) ?? false)
      return matchesFilter && matchesQuery
    })
  }, [active, query, deliveries])

  async function copyToken(trk: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/track/${trk}`)
      setCopied(trk)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

  async function advanceStatus(d: ApiDelivery) {
    const next = NEXT_STATUS[d.status]
    if (!next) return
    await statusMutation.mutateAsync({
      id: d.id,
      status: next,
      note: `Moved to ${next}`,
    })
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={active} onValueChange={(v) => setActive(v as FilterKey)}>
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
            placeholder="Search order, customer, tracking token…"
            aria-label="Search deliveries"
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <p className="text-xs text-muted-foreground">Live from API</p>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading deliveries…
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Truck}
              title="No deliveries yet"
              description="Create a delivery from a paid order (Orders → detail → Create delivery)."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Mode</TableHead>
                  <TableHead className="hidden lg:table-cell">Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Tracking</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">Updated</TableHead>
                  <TableHead className="w-10 pr-4" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No deliveries match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((d) => {
                    const next = NEXT_STATUS[d.status]
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="pl-4">
                          <div className="leading-tight">
                            <span className="block font-medium tabular-nums">
                              {shortId(d.orderId)}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {d.order?.deliveryAddress ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{d.order?.customerName ?? "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            {d.fulfillmentMode === "manual" ? (
                              <Hand className="size-4" />
                            ) : (
                              <Truck className="size-4" />
                            )}
                            {d.fulfillmentMode === "manual" ? "Manual" : "API"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {d.provider ?? "—"}
                        </TableCell>
                        <TableCell>
                          <DeliveryStatusBadge status={d.status} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/track/${d.trackingToken}`}
                              className="font-mono text-xs text-primary hover:underline"
                            >
                              {d.trackingToken.slice(0, 14)}…
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => void copyToken(d.trackingToken)}
                              aria-label="Copy tracking link"
                              title={copied === d.trackingToken ? "Copied" : "Copy link"}
                            >
                              {copied === d.trackingToken ? (
                                <Link2 className="size-3.5 text-success" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-right text-sm text-muted-foreground xl:table-cell">
                          {relativeTime(d.updatedAt)}
                        </TableCell>
                        <TableCell className="pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label={`Actions for ${d.orderId}`}
                                  disabled={statusMutation.isPending}
                                />
                              }
                            >
                              {statusMutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="size-4" />
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/track/${d.trackingToken}`
                                }}
                              >
                                Open tracking page
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void copyToken(d.trackingToken)}>
                                Copy tracking link
                              </DropdownMenuItem>
                              {d.externalTrackingUrl ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(
                                      d.externalTrackingUrl!,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                >
                                  <ExternalLink className="size-4" />
                                  Courier tracking
                                </DropdownMenuItem>
                              ) : null}
                              {next ? (
                                <DropdownMenuItem onClick={() => void advanceStatus(d)}>
                                  Mark {next.replace(/_/g, " ")}
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-medium tabular-nums text-foreground">{rows.length}</span> of{" "}
          <span className="tabular-nums">{deliveries.length}</span> deliveries
        </span>
        <p className="hidden text-xs md:block">
          Customers always get a Kunemi Workspace tracking link
        </p>
      </CardFooter>
    </Card>
  )
}
