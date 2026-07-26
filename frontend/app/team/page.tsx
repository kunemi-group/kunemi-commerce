"use client"

import { useMemo } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { TeamBoard } from "@/components/dashboard/team-board"
import { useAuth } from "@/lib/auth-context"
import type { Kpi } from "@/lib/data"
import { useTeam } from "@/api"

export default function TeamPage() {
  const { isAuthenticated } = useAuth()
  const { data: members = [] } = useTeam(isAuthenticated)
  const kpis = useMemo((): Kpi[] => {
    const total = members.length
    const owners = members.filter((m) => m.role === "owner").length
    const managers = members.filter((m) => m.role === "manager").length
    const sales = members.filter(
      (m) => m.role === "sales" || m.role === "agent",
    ).length
    return [
      {
        id: "people",
        label: "Team members",
        value: String(total),
        delta: "live",
        trend: "up",
        helper: "accounts on this business",
      },
      {
        id: "owners",
        label: "Owners",
        value: String(owners),
        delta: "admin",
        trend: "up",
        helper: "full control",
      },
      {
        id: "managers",
        label: "Managers",
        value: String(managers),
        delta: "ops",
        trend: "up",
        helper: "ops & team leads",
      },
      {
        id: "sales",
        label: "Sales / agents",
        value: String(sales),
        delta: sales > 0 ? "floor" : "—",
        trend: sales > 0 ? "up" : "down",
        helper: "chat → order closers",
      },
    ]
  }, [members])

  return (
    <DashboardShell
      title="Sales Team"
      subtitle="Human teammates with roles & permissions — performance, not AI agents."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="People who sell with you"
          description="Invite managers, sales, and ops. Track chat → paid per person. AI agents live under a separate menu."
        />
        <KpiCards items={kpis} />
        <TeamBoard />
      </div>
    </DashboardShell>
  )
}
