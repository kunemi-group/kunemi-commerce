"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { QuotationsTable } from "@/components/dashboard/documents-table"
import { CreateDocumentDrawer } from "@/components/dashboard/create-document-drawer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import type { Kpi } from "@/lib/data"
import { useMoney, useQuotations } from "@/api"

export default function QuotationsPage() {
  const { isAuthenticated } = useAuth()
  const money = useMoney()
  const { data: quotations = [] } = useQuotations(isAuthenticated)
  const [createOpen, setCreateOpen] = useState(false)

  const kpis = useMemo((): Kpi[] => {
    const open = quotations.filter((q) =>
      ["draft", "sent"].includes(q.status),
    ).length
    const accepted = quotations.filter((q) => q.status === "accepted").length
    const value = quotations.reduce((s, q) => s + q.totalCents, 0)
    const converted = quotations.filter((q) => q.status === "converted").length
    const denom = quotations.length || 1
    return [
      {
        id: "open",
        label: "Open quotes",
        value: String(open),
        delta: "live",
        trend: open > 0 ? "up" : "down",
        helper: "draft + sent",
      },
      {
        id: "accepted",
        label: "Accepted",
        value: String(accepted),
        delta: "ready",
        trend: "up",
        helper: "ready to invoice",
      },
      {
        id: "value",
        label: "Quoted value",
        value: money.format(value),
        delta: "all time",
        trend: "up",
        helper: "sum of quote totals",
      },
      {
        id: "convert",
        label: "Converted",
        value: `${Math.round((converted / denom) * 100)}%`,
        delta: `${converted} docs`,
        trend: converted > 0 ? "up" : "down",
        helper: "quote → invoice",
      },
    ]
  }, [quotations, money])

  return (
    <DashboardShell
      title="Quotations"
      subtitle="Price proposals for B2B and high-touch chats — send on WhatsApp or email."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Quotes"
          description="Attach payment options (transfer default). Accept → convert to invoice."
          actions={
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New quotation
            </Button>
          }
        />
        <KpiCards items={kpis} />
        <QuotationsTable />
      </div>

      <CreateDocumentDrawer
        kind="quotation"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </DashboardShell>
  )
}
