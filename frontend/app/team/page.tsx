"use client"

import { useMemo } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { TeamBoard } from "@/components/dashboard/team-board"
import { useAuth } from "@/lib/auth-context"
import type { Kpi } from "@/lib/data"
import { useTeam } from "@/api"
import { isOwnerRole } from "@/lib/workspace-roles"

export default function TeamPage() {
  const { isAuthenticated } = useAuth()
  const { data } = useTeam(isAuthenticated)
  const members = data?.members ?? []
  const kpis = useMemo((): Kpi[] => {
    const total = members.length
    const owners = members.filter((m) => isOwnerRole(m.role)).length
    const team = total - owners
    const seats = data?.seats ?? 0
    return [
      {
        id: "people",
        label: "Team members",
        value: String(total),
        delta: seats ? `${total}/${seats}` : "live",
        trend: "up",
        helper: "accounts on this business",
      },
      {
        id: "owners",
        label: "Owners",
        value: String(owners),
        delta: "admin",
        trend: "up",
        helper: "settings · bank · team",
      },
      {
        id: "team",
        label: "Team",
        value: String(team),
        delta: team > 0 ? "floor" : "—",
        trend: team > 0 ? "up" : "down",
        helper: "day-to-day commerce",
      },
      {
        id: "seats",
        label: "Open seats",
        value: String(Math.max(0, seats - total)),
        delta: seats ? "plan" : "—",
        trend: seats - total > 0 ? "up" : "down",
        helper: "invite capacity left",
      },
    ]
  }, [members, data?.seats])

  return (
    <DashboardShell
      title="Team"
      subtitle="Owner and Team only — no manager/ops split until you need it."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="People who sell with you"
          description="Invite Team members for orders, products, payments, and deliveries. Only owners manage bank details, settings, and seats."
        />
        <KpiCards items={kpis} />
        <TeamBoard />
      </div>
    </DashboardShell>
  )
}
