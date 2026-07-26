"use client"

import { useMemo } from "react"
import { Plus, Download } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { InventoryTable } from "@/components/dashboard/inventory-table"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { Kpi } from "@/lib/data"
import { flattenInventory, useProducts } from "@/api"

export default function InventoryPage() {
  const { isAuthenticated } = useAuth()
  const { data: products = [] } = useProducts(isAuthenticated)
  const kpis = useMemo((): Kpi[] => {
    const rows = flattenInventory(products)
    const skus = rows.length
    const low = rows.filter((r) => r.onHand - r.reserved <= r.threshold).length
    const reserved = rows.reduce((s, r) => s + r.reserved, 0)
    const onHand = rows.reduce((s, r) => s + r.onHand, 0)
    return [
      {
        id: "skus",
        label: "SKUs",
        value: String(skus),
        delta: skus > 0 ? "catalog" : "optional",
        trend: "up",
        helper: "variant rows in catalog",
      },
      {
        id: "onhand",
        label: "Units on hand",
        value: String(onHand),
        delta: "live",
        trend: "up",
        helper: "sum of stock on hand",
      },
      {
        id: "reserved",
        label: "Units reserved",
        value: String(reserved),
        delta: reserved > 0 ? "holds" : "—",
        trend: reserved > 0 ? "up" : "down",
        helper: "held on unpaid catalog orders",
      },
      {
        id: "low",
        label: "Low stock",
        value: String(low),
        delta: low > 0 ? "restock" : "healthy",
        trend: low > 0 ? "up" : "down",
        helper: "at or below threshold",
      },
    ]
  }, [products])

  return (
    <DashboardShell
      title="Inventory"
      subtitle="Optional catalog — stock holds when you use variants; freeform orders work without products."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Catalog & stock"
          description="Optional. Businesses with no products can still create orders. Available units subtract holds from unpaid chat orders when catalog lines are used."
          actions={
            <>
              <Button variant="outline" className="gap-2 bg-card">
                <Download className="size-4" />
                Export
              </Button>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add product
              </Button>
            </>
          }
        />

        <KpiCards items={kpis} />
        <InventoryTable />
      </div>
    </DashboardShell>
  )
}
