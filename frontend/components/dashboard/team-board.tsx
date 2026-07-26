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
  Trash2,
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
import { InviteMemberSheet } from "./invite-member-sheet"
import { cn } from "@/lib/utils"
import { tierLimits, type SubscriptionTier } from "@/lib/data"
import { useAuth } from "@/lib/auth-context"
import {
  getApiErrorMessage,
  relativeTime,
  useRemoveMember,
  useTeam,
  useUpdateMemberRole,
  type UserRole,
} from "@/api"

const roleLabel: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  sales: "Sales",
  ops: "Ops",
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
  const { isAuthenticated, business, user } = useAuth()
  const [query, setQuery] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useTeam(isAuthenticated)
  const members = data?.members ?? []
  const seats = data?.seats ?? tierLimits[(business?.tier ?? "starter") as SubscriptionTier].teamSeats
  const updateRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  const canManage =
    user?.role === "owner" || user?.role === "manager"

  const error = queryError
    ? getApiErrorMessage(queryError)
    : updateRole.error
      ? getApiErrorMessage(updateRole.error)
      : removeMember.error
        ? getApiErrorMessage(removeMember.error)
        : null

  const tier = (business?.tier ?? data?.tier ?? "starter") as SubscriptionTier

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

  async function setRole(id: string, role: UserRole) {
    await updateRole.mutateAsync({ id, role })
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from this team?`)) return
    await removeMember.mutateAsync(id)
  }

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
            {!canManage ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Only owners and managers can invite or change roles.
              </p>
            ) : null}
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
            <Button
              size="sm"
              className="gap-2"
              disabled={!canManage || members.length >= seats}
              title={
                !canManage
                  ? "Owners and managers only"
                  : members.length >= seats
                    ? "Seat limit reached"
                    : "Invite teammate"
              }
              onClick={() => setInviteOpen(true)}
            >
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
                description={
                  canManage
                    ? "Invite sales, ops, or managers. Seat limits follow your plan."
                    : "Ask an owner or manager to invite you."
                }
                actionLabel={canManage ? "Invite" : undefined}
                onAction={canManage ? () => setInviteOpen(true) : undefined}
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
                  {rows.map((member) => {
                    const isSelf = member.id === user?.id
                    const busy =
                      updateRole.isPending || removeMember.isPending
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-secondary text-xs font-medium">
                                {initials(member.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="leading-tight">
                              <span className="block font-medium">
                                {member.fullName}
                                {isSelf ? (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    (you)
                                  </span>
                                ) : null}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="secondary"
                            className={cn(
                              member.role === "owner" && "bg-primary/15 text-primary",
                            )}
                          >
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
                                  disabled={!canManage || busy}
                                />
                              }
                            >
                              {busy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="size-4" />
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user?.role === "owner" && !isSelf ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void setRole(member.id, "owner")
                                    }
                                  >
                                    Make owner
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void setRole(member.id, "manager")
                                    }
                                  >
                                    Make manager
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                              {canManage && !isSelf && member.role !== "owner" ? (
                                <>
                                  {(user?.role === "owner" ||
                                    member.role !== "manager") && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          void setRole(member.id, "sales")
                                        }
                                      >
                                        Make sales
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          void setRole(member.id, "ops")
                                        }
                                      >
                                        Make ops
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {user?.role === "owner" &&
                                  member.role === "manager" ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        void setRole(member.id, "sales")
                                      }
                                    >
                                      Demote to sales
                                    </DropdownMenuItem>
                                  ) : null}
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      void remove(member.id, member.fullName)
                                    }
                                  >
                                    <Trash2 className="size-4" />
                                    Remove
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                              {isSelf ? (
                                <DropdownMenuItem disabled>
                                  You cannot edit yourself here
                                </DropdownMenuItem>
                              ) : null}
                              {!canManage ? (
                                <DropdownMenuItem disabled>
                                  View only
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberSheet open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
