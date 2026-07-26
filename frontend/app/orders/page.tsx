"use client"

import { useState } from "react"
import { Plus, Download } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { OrderStatusChart } from "@/components/dashboard/order-status-chart"
import { OrdersTable } from "@/components/dashboard/orders-table"
import { CreateOrderDrawer } from "@/components/dashboard/create-order-drawer"
import { Button } from "@/components/ui/button"
import { orderKpis } from "@/lib/data"

export default function OrdersPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <DashboardShell title="Orders" subtitle="Track and manage every order across its lifecycle.">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Order management</h2>
            <p className="text-sm text-muted-foreground">
              Monitor payment, fulfillment, and delivery states in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 bg-card">
              <Download className="size-4" />
              Export
            </Button>
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New order
            </Button>
          </div>
        </div>

        <KpiCards items={orderKpis} />

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OrdersTable />
          </div>
          <OrderStatusChart />
        </div>
      </div>

      <CreateOrderDrawer open={createOpen} onOpenChange={setCreateOpen} />
    </DashboardShell>
  )
}
