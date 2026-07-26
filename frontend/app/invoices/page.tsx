"use client"

import { Plus } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { InvoicesTable } from "@/components/dashboard/documents-table"
import { Button } from "@/components/ui/button"
import { invoiceKpis } from "@/lib/data"

export default function InvoicesPage() {
  return (
    <DashboardShell
      title="Invoices"
      subtitle="Collect payment with card links, bank details, and proof-of-payment upload."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Invoices"
          description="From quotes or orders. Prefer transfer when card fees eat margin — still support card when buyers need it."
          actions={
            <Button className="gap-2">
              <Plus className="size-4" />
              New invoice
            </Button>
          }
        />
        <KpiCards items={invoiceKpis} />
        <InvoicesTable />
      </div>
    </DashboardShell>
  )
}
