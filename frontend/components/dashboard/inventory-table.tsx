"use client"

import { useMemo, useState } from "react"
import {
  Search,
  MoreHorizontal,
  PackagePlus,
  Loader2,
  RefreshCw,
  Package,
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
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { flattenInventory, useProducts, useRestockVariant } from "@/api"

type FilterKey = "all" | "low" | "reserved" | "healthy"

export function InventoryTable() {
  const { isAuthenticated } = useAuth()
  const [active, setActive] = useState<FilterKey>("all")
  const [query, setQuery] = useState("")
  const {
    data: products = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useProducts(isAuthenticated)
  const restockMutation = useRestockVariant()
  const inventory = useMemo(() => flattenInventory(products), [products])
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load inventory"
    : restockMutation.error
      ? restockMutation.error instanceof Error
        ? restockMutation.error.message
        : "Restock failed"
      : null

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inventory.filter((item) => {
      const available = item.onHand - item.reserved
      const isLow = available <= item.threshold
      const hasReserved = item.reserved > 0
      const matchesFilter =
        active === "all" ||
        (active === "low" && isLow) ||
        (active === "reserved" && hasReserved) ||
        (active === "healthy" && !isLow)
      const matchesQuery =
        q === "" ||
        item.product.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.variant.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [active, query, inventory])

  async function restock(variantId: string, delta: number) {
    await restockMutation.mutateAsync({ variantId, delta })
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={active} onValueChange={(v) => setActive(v as FilterKey)}>
            <div className="-mx-1 overflow-x-auto px-1">
              <TabsList className="inline-flex w-max gap-1 bg-transparent p-0">
                {(
                  [
                    { key: "all", label: "All SKUs" },
                    { key: "low", label: "Low stock" },
                    { key: "reserved", label: "Has holds" },
                    { key: "healthy", label: "Healthy" },
                  ] as const
                ).map((f) => (
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
            placeholder="Search product, SKU…"
            aria-label="Search inventory"
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <p className="text-xs text-muted-foreground">
          Live catalog · inventory is optional — empty catalog is valid
        </p>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading inventory…
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Package}
              title="No catalog yet"
              description="Inventory is optional. Freeform orders work without products. Add SKUs when you want stock holds."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Product</TableHead>
                  <TableHead className="hidden md:table-cell">SKU</TableHead>
                  <TableHead className="hidden sm:table-cell">Price</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Threshold</TableHead>
                  <TableHead className="w-10 pr-4" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No variants match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((item) => {
                    const available = item.onHand - item.reserved
                    const isLow = available <= item.threshold
                    const critical = available <= 1
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="pl-4">
                          <div className="leading-tight">
                            <span className="block font-medium">
                              {item.product}
                              {item.taxExempt ? (
                                <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                                  Tax-free
                                </span>
                              ) : null}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {item.variant}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                          {item.sku}
                        </TableCell>
                        <TableCell className="hidden tabular-nums sm:table-cell">
                          {item.price}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{item.onHand}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {item.reserved}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold tabular-nums",
                            critical
                              ? "text-destructive"
                              : isLow
                                ? "text-warning"
                                : "text-foreground",
                          )}
                        >
                          {available}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                          {item.threshold}
                        </TableCell>
                        <TableCell className="pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label={`Actions for ${item.sku}`}
                                  disabled={restockMutation.isPending}
                                />
                              }
                            >
                              {restockMutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="size-4" />
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void restock(item.id, 10)}>
                                <PackagePlus className="size-4" />
                                Restock +10
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void restock(item.id, 1)}>
                                Restock +1
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => void restock(item.id, -1)}
                                disabled={item.onHand - item.reserved <= 0}
                              >
                                Adjust −1
                              </DropdownMenuItem>
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
          <span className="tabular-nums">{inventory.length}</span> variants
        </span>
        <p className="hidden text-xs sm:block">
          Available = on hand − reserved holds
        </p>
      </CardFooter>
    </Card>
  )
}
