"use client"

import { useMemo, useState } from "react"
import { Search, SlidersHorizontal, MoreHorizontal, PackagePlus } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { inventory } from "@/lib/data"

type FilterKey = "all" | "low" | "reserved" | "healthy"

export function InventoryTable() {
  const [active, setActive] = useState<FilterKey>("all")
  const [query, setQuery] = useState("")

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
        item.variant.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [active, query])

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4">
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

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product, SKU, category…"
              aria-label="Search inventory"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-card">
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
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
                            {item.variant} · {item.category}
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
                              />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <PackagePlus className="size-4" />
                              Restock
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit variant</DropdownMenuItem>
                            <DropdownMenuItem>Adjust threshold</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive">
                              Archive SKU
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
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-medium tabular-nums text-foreground">{rows.length}</span> of{" "}
          <span className="tabular-nums">{inventory.length}</span> variants
        </span>
        <p className="hidden text-xs sm:block">
          Available = on hand − reserved holds (chat payment window)
        </p>
      </CardFooter>
    </Card>
  )
}
