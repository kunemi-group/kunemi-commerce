"use client"

import { Loader2, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { relativeTime, useTeam } from "@/api"
import { EmptyState } from "./empty-state"

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/** Sales team roster widget (humans — not AI agents). Conversion metrics need messaging. */
export function AgentPerformance() {
  const { isAuthenticated } = useAuth()
  const { data, isLoading } = useTeam(isAuthenticated)
  const members = data?.members ?? []

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sales team</CardTitle>
        <CardDescription>
          Live roster · chat→paid conversion when messaging is wired
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading team…
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            dense
            icon={Users}
            title="No teammates yet"
            description="Invite sales and ops from the Team page when invites ship."
          />
        ) : (
          members.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-secondary text-xs font-medium">
                  {initials(member.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{member.fullName}</p>
                  <span className="text-xs capitalize text-muted-foreground">
                    {member.role}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {member.email}
                  {member.createdAt ? ` · joined ${relativeTime(member.createdAt)}` : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
