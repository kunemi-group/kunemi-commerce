"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { InsightsPanel } from "@/components/dashboard/insights-panel"

export default function InsightsPage() {
  return (
    <DashboardShell
      title="Insights"
      subtitle="What sold, what you’re owed, and what’s stuck — for the period you pick."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Business pulse"
          description="Money, order funnel, top products, payment health, and stock risk. No vanity charts."
        />
        <InsightsPanel />
      </div>
    </DashboardShell>
  )
}
