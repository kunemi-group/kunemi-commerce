import { Truck } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { DeliveriesTable } from "@/components/dashboard/deliveries-table"
import { Button } from "@/components/ui/button"
import { deliveryKpis } from "@/lib/data"

export default function DeliveriesPage() {
  return (
    <DashboardShell
      title="Deliveries"
      subtitle="Ship when the address is right — manual or API courier, one Kunemi Workspace tracking link."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Fulfillment"
          description="Human checkpoint after payment: pick a mode, hand off, share tracking in chat."
          actions={
            <Button className="gap-2">
              <Truck className="size-4" />
              Ship order
            </Button>
          }
        />

        <KpiCards items={deliveryKpis} />
        <DeliveriesTable />
      </div>
    </DashboardShell>
  )
}
