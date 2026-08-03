"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { ChatInbox } from "@/components/dashboard/chat-inbox"

export default function InboxPage() {
  return (
    <DashboardShell
      title="Inbox"
      subtitle="ShopFlow buyers message your store here. Sellers only chat in Workspace — not on ShopFlow."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Buyer conversations"
          description="Replies go to the buyer in ShopFlow. Your team never logs into ShopFlow to chat."
        />
        <ChatInbox />
      </div>
    </DashboardShell>
  )
}
