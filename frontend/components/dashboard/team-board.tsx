"use client"

import { useMemo, useState } from "react"
import {
  Search,
  MoreHorizontal,
  MessageCircle,
  UserPlus,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/utils"
import { tierLimits, type SubscriptionTier } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import { relativeTime, useTeam } from "@/api"

const roleLabel: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  sales: "Sales",
  ops: "Ops",
  agent: "Sales",
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function TeamBoard() {
  const { isAuthenticated, business } = useAuth()
  const [query, setQuery] = useState("")
  const {
    data: members = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useTeam(isAuthenticated)
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load team"
    : null

  const tier = (business?.tier ?? "starter") as SubscriptionTier
  const seats = tierLimits[tier].teamSeats

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter(
      (a) =>
        q === "" ||
        a.fullName.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    )
  }, [query, members])

  const owner = members.find((m) => m.role === "owner") ?? members[0]

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
      <div className="flex flex-col gap-4 md:gap-6 xl:col-span-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Team owner</CardTitle>
              <CardDescription>Account owner on this business</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => void refetch()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </div>
            ) : owner ? (
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                    {initials(owner.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium">{owner.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {roleLabel[owner.role] ?? owner.role}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{owner.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No members yet</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {members.length}/{seats}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="mt-1 text-lg font-semibold">{tierLimits[tier].label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              Live floor
            </CardTitle>
            <CardDescription>Roster from API (chat presence later)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-secondary text-xs font-medium">
                    {initials(member.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabel[member.role] ?? member.role}
                  </p>
                </div>
              </div>
            ))}
            {!loading && members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teammates yet</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden p-0 xl:col-span-2">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Sales team roster</p>
            <p className="text-sm text-muted-foreground">
              Roles · {members.length}/{seats} seats on {tierLimits[tier].label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search team…"
                aria-label="Search team"
                className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button size="sm" className="gap-2" disabled title="Invites coming next">
              <UserPlus className="size-4" />
              Invite
            </Button>
          </div>
        </div>

        {error ? (
          <p className="px-4 pt-3 text-sm text-destructive">{error}</p>
        ) : null}

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading team…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Users}
                title="No team members"
                description="Owner is created at registration. Invites come next."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Member</TableHead>
                    <TableHead className="hidden sm:table-cell">Role</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Joined</TableHead>
                    <TableHead className="w-10 pr-4" aria-label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-secondary text-xs font-medium">
                              {initials(member.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <span className="block font-medium">{member.fullName}</span>
                            <span className="block text-xs text-muted-foreground">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">
                          {roleLabel[member.role] ?? member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-right text-sm text-muted-foreground md:table-cell">
                        {relativeTime(member.createdAt)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Actions for ${member.fullName}`}
                              />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>Edit role (soon)</DropdownMenuItem>
                            <DropdownMenuItem disabled>Message member</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
