"use client"

import { Plus } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { QuotationsTable } from "@/components/dashboard/documents-table"
import { Button } from "@/components/ui/button"
import { quoteKpis } from "@/lib/data"

export default function QuotationsPage() {
  return (
    <DashboardShell
      title="Quotations"
      subtitle="Price proposals for B2B and high-touch chats — send on WhatsApp or email."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Quotes"
          description="Attach payment options (transfer details and/or card link). Accept → convert to invoice or order."
          actions={
            <Button className="gap-2">
              <Plus className="size-4" />
              New quotation
            </Button>
          }
        />
        <KpiCards items={quoteKpis} />
        <QuotationsTable />
      </div>
    </DashboardShell>
  )
}
