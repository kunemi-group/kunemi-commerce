"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { InvoicesTable } from "@/components/dashboard/documents-table"
import { CreateDocumentDrawer } from "@/components/dashboard/create-document-drawer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { Kpi } from "@/lib/data"
import { useInvoices, useMoney } from "@/api"

export default function InvoicesPage() {
  const { isAuthenticated } = useAuth()
  const money = useMoney()
  const { data: invoices = [] } = useInvoices(isAuthenticated)
  const [createOpen, setCreateOpen] = useState(false)

  const kpis = useMemo((): Kpi[] => {
    const outstanding = invoices
      .filter((i) => ["sent", "partial", "overdue"].includes(i.status))
      .reduce((s, i) => s + Math.max(0, i.totalCents - i.amountPaidCents), 0)
    const collected = invoices
      .filter((i) => i.status === "paid" || i.amountPaidCents > 0)
      .reduce((s, i) => s + i.amountPaidCents, 0)
    const overdue = invoices.filter((i) => i.status === "overdue").length
    const paid = invoices.filter((i) => i.status === "paid").length
    return [
      {
        id: "out",
        label: "Outstanding",
        value: money.format(outstanding),
        delta: "open",
        trend: outstanding > 0 ? "up" : "down",
        helper: "sent + partial + overdue balance",
      },
      {
        id: "paid",
        label: "Collected",
        value: money.format(collected),
        delta: "paid",
        trend: "up",
        helper: "amount marked paid",
      },
      {
        id: "overdue",
        label: "Overdue",
        value: String(overdue),
        delta: overdue > 0 ? "chase" : "clear",
        trend: overdue > 0 ? "up" : "down",
        helper: "past due date",
      },
      {
        id: "count",
        label: "Paid invoices",
        value: String(paid),
        delta: "live",
        trend: "up",
        helper: "fully paid",
      },
    ]
  }, [invoices, money])

  return (
    <DashboardShell
      title="Invoices"
      subtitle="Collect payment with bank details and proof-of-payment review on orders when needed."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Invoices"
          description="From quotes or freeform. Prefer transfer when card fees eat margin."
          actions={
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New invoice
            </Button>
          }
        />
        <KpiCards items={kpis} />
        <InvoicesTable />
      </div>

      <CreateDocumentDrawer
        kind="invoice"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </DashboardShell>
  )
}
