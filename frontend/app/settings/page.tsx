import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { SettingsPanel } from "@/components/dashboard/settings-panel"

export default function SettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      subtitle="Business profile, payment paths, and hold windows for chat-native commerce."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Workspace settings"
          description="Configure how Lagos Threads sells, holds stock, and collects payment."
        />
        <SettingsPanel />
      </div>
    </DashboardShell>
  )
}
