"use client"

import Link from "next/link"
import { Bot, Lock, Pause, Play, Sparkles } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  aiAgentKpis,
  aiAgents,
  aiAgentsAllowedForTier,
  business,
  tierLimits,
} from "@/lib/data"
import { cn } from "@/lib/utils"

export default function AiAgentsPage() {
  const allowed = aiAgentsAllowedForTier()
  const locked = allowed === 0
  const limit = tierLimits[business.tier]

  return (
    <DashboardShell
      title="AI Agents"
      subtitle="Automated order handling on WhatsApp — included by subscription tier."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="AI sales agents"
          description="Separate from your human Sales Team. Minimum 1 AI agent when your plan includes AI — implementation details next."
          actions={
            locked ? (
              <Button render={<Link href="/settings" />}>Upgrade plan</Button>
            ) : (
              <Button className="gap-2" disabled={aiAgents.length >= allowed}>
                <Sparkles className="size-4" />
                Add AI agent
              </Button>
            )
          }
        />

        <Card
          className={cn(
            locked ? "border-warning/40 bg-warning/5" : "border-primary/30 bg-primary/5",
          )}
        >
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  locked ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary",
                )}
              >
                {locked ? <Lock className="size-5" /> : <Bot className="size-5" />}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {locked
                    ? "AI agents are not on Starter"
                    : `${limit.label} includes up to ${allowed} AI agent${allowed === 1 ? "" : "s"}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locked
                    ? "Upgrade to Growth (1 AI) or Scale (up to 3). Your Sales Team seats are separate."
                    : "AI can capture orders, send quotes/invoices, follow up on payment, and hand off to humans."}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {aiAgents.filter((a) => a.status === "active").length}/{allowed || 0} active
            </Badge>
          </CardContent>
        </Card>

        <KpiCards items={aiAgentKpis} />

        {locked ? (
          <Card>
            <CardHeader>
              <CardTitle>What AI agents will do</CardTitle>
              <CardDescription>Preview — full AI implementation comes next</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                "Answer product questions from catalog",
                "Create orders with inventory holds",
                "Send quotations & invoices on WhatsApp/email",
                "Share transfer details or card payment links",
                "Collect proof of payment for review",
                "Escalate complex chats to Sales Team",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {aiAgents.map((agent) => (
              <Card key={agent.id} className="animate-fade-in">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Bot className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription className="mt-1">{agent.focus}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    className={
                      agent.status === "active"
                        ? "border-0 bg-success/15 text-success"
                        : "border-0 bg-muted text-muted-foreground"
                    }
                  >
                    {agent.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Orders" value={String(agent.ordersHandled)} />
                    <Stat label="Chat → paid" value={`${agent.conversion}%`} />
                    <Stat label="Last active" value={agent.lastActive} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-2 bg-card">
                      {agent.status === "active" ? (
                        <>
                          <Pause className="size-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5" /> Resume
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" className="bg-card" disabled>
                      Configure (soon)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI implementation (tools, memory, handoff) will be designed next — this seat is
                    reserved on your plan.
                  </p>
                </CardContent>
              </Card>
            ))}

            {Array.from({ length: Math.max(0, allowed - aiAgents.length) }).map((_, i) => (
              <Card
                key={`slot-${i}`}
                className="border-dashed bg-card/40"
              >
                <CardContent className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center">
                  <Bot className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Open AI seat</p>
                  <p className="text-xs text-muted-foreground">
                    Your plan includes this slot. Provisioning comes with the AI build.
                  </p>
                  <Button size="sm" className="mt-2" disabled>
                    Provision (soon)
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}
