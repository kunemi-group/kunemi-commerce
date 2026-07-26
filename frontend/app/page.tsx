"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { OrderStatusChart } from "@/components/dashboard/order-status-chart"
import { PaymentSplitChart } from "@/components/dashboard/payment-split-chart"
import { AgentPerformance } from "@/components/dashboard/agent-performance"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { LowStock } from "@/components/dashboard/low-stock"
import { AttentionInbox } from "@/components/dashboard/attention-inbox"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import { useRole } from "@/lib/role-context"

export default function Page() {
  const { role } = useRole()
  const router = useRouter()

  useEffect(() => {
    if (role === "agent") {
      router.replace("/workspace")
    }
  }, [role, router])

  if (role === "agent") {
    return (
      <DashboardShell title="Redirecting…" subtitle="Opening your sales workspace.">
        <div className="text-sm text-muted-foreground">Loading workspace…</div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <AttentionInbox />
          </div>
          <OnboardingChecklist />
        </div>

        <KpiCards />

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <PaymentSplitChart />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OrderStatusChart />
          </div>
          <AgentPerformance />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentOrders />
          </div>
          <LowStock />
        </div>
      </div>
    </DashboardShell>
  )
}
