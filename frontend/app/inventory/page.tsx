import { Plus, Download } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { InventoryTable } from "@/components/dashboard/inventory-table"
import { Button } from "@/components/ui/button"
import { inventoryKpis } from "@/lib/data"

export default function InventoryPage() {
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

        <KpiCards items={inventoryKpis} />
        <InventoryTable />
      </div>
    </DashboardShell>
  )
}
