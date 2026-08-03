"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  getApiErrorMessage,
  relativeTime,
  useInbox,
  useInboxThread,
  useSendInboxMessage,
} from "@/api"

function initials(name: string | null | undefined) {
  if (!name?.trim()) return "?"
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Workspace seller inbox — staff reply to ShopFlow buyers.
 * Buyers never use this UI (they chat only in ShopFlow).
 */
export function ChatInbox() {
  const { isAuthenticated } = useAuth()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const {
    data: threads = [],
    isLoading,
    error: listError,
    refetch,
  } = useInbox(isAuthenticated)

  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
  } = useInboxThread(activeId, Boolean(activeId))

  const sendMutation = useSendInboxMessage()

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? detail?.thread ?? null,
    [threads, activeId, detail],
  )

  useEffect(() => {
    if (!activeId && threads.length > 0) {
      setActiveId(threads[0].id)
    }
  }, [threads, activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [detail?.messages?.length, activeId])

  async function send() {
    if (!activeId || !draft.trim()) return
    const body = draft.trim()
    setDraft("")
    try {
      await sendMutation.mutateAsync({ id: activeId, body })
    } catch {
      setDraft(body)
    }
  }

  const error = listError
    ? getApiErrorMessage(listError)
    : detailError
      ? getApiErrorMessage(detailError)
      : sendMutation.error
        ? getApiErrorMessage(sendMutation.error)
        : null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border">
      {/* Thread list */}
      <Card className="gap-0 overflow-hidden p-0 lg:rounded-none lg:border-0 lg:border-r lg:border-border">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-primary" />
            Buyer inbox
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="max-h-[420px] space-y-1 overflow-y-auto p-2 lg:max-h-[560px]">
          {error ? (
            <p className="p-2 text-sm text-destructive">{error}</p>
          ) : null}
          {isLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading threads…
            </div>
          ) : threads.length === 0 ? (
            <EmptyState
              dense
              icon={MessageSquare}
              title="No buyer messages"
              description="When ShopFlow buyers message your store, threads appear here. Sellers only chat in Workspace."
            />
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors",
                  activeId === t.id
                    ? "border-primary/30 bg-primary/5"
                    : "hover:bg-secondary/50",
                )}
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-secondary text-xs">
                    {initials(t.buyerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {t.buyerName ?? "Buyer"}
                    </p>
                    {t.unreadCount > 0 ? (
                      <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                        {t.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.productName
                      ? `Re: ${t.productName}`
                      : t.subject || t.buyerEmail || "Conversation"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {t.lastMessagePreview ?? "No messages yet"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {t.lastMessageAt
                      ? relativeTime(t.lastMessageAt)
                      : relativeTime(t.createdAt)}
                  </p>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className="gap-0 overflow-hidden p-0 lg:col-span-2 lg:rounded-none lg:border-0">
        {!activeId ? (
          <div className="flex h-[420px] items-center justify-center lg:h-[560px]">
            <EmptyState
              icon={UserRound}
              title="Select a conversation"
              description="Buyer messages from ShopFlow land here for your team to reply."
            />
          </div>
        ) : (
          <>
            <div className="border-b border-border px-4 py-3">
              <p className="font-medium">
                {active?.buyerName ?? detail?.thread.buyerName ?? "Buyer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {active?.buyerEmail ?? detail?.thread.buyerEmail}
                {active?.productName || detail?.thread.productName
                  ? ` · ${active?.productName ?? detail?.thread.productName}`
                  : ""}
              </p>
            </div>

            <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto p-4 lg:max-h-[460px]">
              {detailLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading messages…
                </div>
              ) : (
                (detail?.messages ?? []).map((m) => {
                  const mine = m.senderSide === "staff"
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex",
                        mine ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            mine
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {m.senderName ?? (mine ? "You" : "Buyer")} ·{" "}
                          {relativeTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 border-t border-border p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder="Reply as your store…"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                className="gap-2"
                disabled={!draft.trim() || sendMutation.isPending}
                onClick={() => void send()}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
