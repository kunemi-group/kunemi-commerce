"use client"

import { useMemo, useState } from "react"
import {
  MessageCircle,
  Plus,
  Camera,
  Clock,
  Loader2,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { AttentionInbox } from "@/components/dashboard/attention-inbox"
import { CreateOrderDrawer } from "@/components/dashboard/create-order-drawer"
import { OrderDetailSheet } from "@/components/dashboard/order-detail-sheet"
import { HoldCountdown } from "@/components/dashboard/hold-countdown"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { openChats } from "@/lib/data"
import { useRole } from "@/lib/role-context"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  minutesLeft,
  shortId,
  useMoney,
  useOrders,
} from "@/api"

export default function WorkspacePage() {
  const { user, dense } = useRole()
  const { isAuthenticated } = useAuth()
  const money = useMoney()
  const [createOpen, setCreateOpen] = useState(false)
  const [preset, setPreset] = useState<{ customer?: string; phone?: string }>({})
  const [detailId, setDetailId] = useState<string | null>(null)
  const { data: orders = [], isLoading: ordersLoading, refetch } = useOrders(
    isAuthenticated,
  )

  const myPending = useMemo(
    () =>
      orders
        .filter((o) =>
          ["pending", "payment_review", "paid"].includes(o.status),
        )
        .slice(0, 6),
    [orders],
  )

  function openCreate(customer?: string, phone?: string) {
    setPreset({ customer, phone })
    setCreateOpen(true)
  }

  return (
    <DashboardShell
      title="Workspace"
      subtitle={`${user.name.split(" ")[0]}, close chats into paid orders — sales team mode.`}
    >
      <div className={cn("flex flex-col", dense ? "gap-3" : "gap-4 md:gap-6")}>
        <PageHeader
          title="Sales floor"
          description="Open chats, expiring holds, quotes/invoices next — one-tap order creation for WhatsApp selling."
          actions={
            <Button className="gap-2" onClick={() => openCreate()}>
              <Plus className="size-4" />
              New order
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
          {/* Open chats — mock until messaging API exists */}
          <Card className="lg:col-span-1 animate-fade-in">
            <CardHeader className={cn(dense && "py-3")}>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="size-4 text-primary" />
                Open chats
                <Badge variant="secondary" className="ml-auto tabular-nums">
                  {openChats.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className={cn("space-y-2", dense && "pt-0")}>
              {openChats.length === 0 ? (
                <EmptyState
                  dense
                  icon={MessageCircle}
                  title="Inbox zero"
                  description="No open chats right now. When a customer messages, they'll land here."
                />
              ) : (
                openChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => openCreate(chat.customer, chat.phone)}
                    className="flex w-full items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card">
                      {chat.channel === "Instagram" ? (
                        <Camera className="size-4 text-chart-2" />
                      ) : (
                        <MessageCircle className="size-4 text-success" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{chat.customer}</p>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="size-3" />
                          {chat.waiting}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {chat.preview}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {chat.channel}
                        </span>
                        {chat.unread > 0 ? (
                          <Badge className="h-5 border-0 bg-primary/20 px-1.5 text-[10px] text-primary tabular-nums">
                            {chat.unread} new
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))
              )}
              <p className="pt-1 text-[11px] text-muted-foreground">
                Sample inbox · messaging API not wired yet
              </p>
            </CardContent>
          </Card>

          {/* Live pipeline */}
          <Card className="lg:col-span-1 animate-fade-in" style={{ animationDelay: "40ms" }}>
            <CardHeader className={cn(dense && "py-3")}>
              <CardTitle className="text-base">Your pipeline</CardTitle>
            </CardHeader>
            <CardContent className={cn("space-y-2", dense && "pt-0")}>
              {ordersLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading orders…
                </div>
              ) : myPending.length === 0 ? (
                <EmptyState
                  dense
                  icon={Clock}
                  title="Pipeline clear"
                  description="No pending, review, or paid orders waiting. Create one from a chat."
                />
              ) : (
                myPending.map((order) => {
                  const hold = minutesLeft(order.reservedUntil)
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setDetailId(order.id)}
                      className="flex w-full flex-col gap-1.5 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium tabular-nums">
                          {shortId(order.id)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{order.customerName}</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {money.format(order.totalCents)}
                        </span>
                      </div>
                      {order.status === "pending" && hold != null ? (
                        <HoldCountdown minutesLeft={hold} compact />
                      ) : null}
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>

          <div className="animate-fade-in" style={{ animationDelay: "80ms" }}>
            <AttentionInbox dense limit={4} />
          </div>
        </div>
      </div>

      <CreateOrderDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        presetCustomer={preset.customer}
        presetPhone={preset.phone}
        onCreated={() => void refetch()}
      />
      <OrderDetailSheet
        orderId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        onChanged={() => void refetch()}
      />
    </DashboardShell>
  )
}
