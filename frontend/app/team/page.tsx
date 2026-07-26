import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { TeamBoard } from "@/components/dashboard/team-board"
import { teamKpis } from "@/lib/data"

export default function TeamPage() {
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
        <KpiCards items={teamKpis} />
        <TeamBoard />
      </div>
    </DashboardShell>
  )
}
