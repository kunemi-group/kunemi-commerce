"use client"

import { useMemo } from "react"
import { Truck } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { DeliveriesTable } from "@/components/dashboard/deliveries-table"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { Kpi } from "@/lib/data"
import { useDeliveries } from "@/api"

export default function DeliveriesPage() {
  const { isAuthenticated } = useAuth()
  const { data: deliveries = [] } = useDeliveries(isAuthenticated)
  const kpis = useMemo((): Kpi[] => {
    const total = deliveries.length
    const inTransit = deliveries.filter((d) =>
      ["picked_up", "in_transit", "out_for_delivery"].includes(d.status),
    ).length
    const delivered = deliveries.filter((d) => d.status === "delivered").length
    const manual = deliveries.filter((d) => d.fulfillmentMode === "manual").length
    return [
      {
        id: "total",
        label: "Deliveries",
        value: String(total),
        delta: "live",
        trend: "up",
        helper: "all shipments",
      },
      {
        id: "transit",
        label: "In motion",
        value: String(inTransit),
        delta: inTransit > 0 ? "active" : "—",
        trend: inTransit > 0 ? "up" : "down",
        helper: "picked up → out for delivery",
      },
      {
        id: "delivered",
        label: "Delivered",
        value: String(delivered),
        delta: total > 0 ? `${Math.round((delivered / total) * 100)}%` : "—",
        trend: "up",
        helper: "completed deliveries",
      },
      {
        id: "manual",
        label: "Manual mode",
        value: String(manual),
        delta: "ops",
        trend: "down",
        helper: "not API courier",
      },
    ]
  }, [deliveries])

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

        <KpiCards items={kpis} />
        <DeliveriesTable />
      </div>
    </DashboardShell>
  )
}
