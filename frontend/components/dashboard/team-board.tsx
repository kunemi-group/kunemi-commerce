"use client"

import { useMemo, useState } from "react"
import { Search, MoreHorizontal, MessageCircle, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
import { cn } from "@/lib/utils"
import { teamMembers, tierLimits, business } from "@/lib/data"

const statusDot: Record<(typeof teamMembers)[number]["status"], string> = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-muted-foreground",
}

const roleLabel: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  sales: "Sales",
  ops: "Ops",
}

export function TeamBoard() {
  const [query, setQuery] = useState("")
  const seats = tierLimits[business.tier].teamSeats

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teamMembers.filter(
      (a) =>
        q === "" ||
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    )
  }, [query])

  const top = [...teamMembers].sort((a, b) => b.conversion - a.conversion)[0]

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
      <div className="flex flex-col gap-4 md:gap-6 xl:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Top closer</CardTitle>
            <CardDescription>Highest chat → paid among humans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                  {top.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium">{top.name}</p>
                <p className="text-sm text-muted-foreground">{roleLabel[top.role]}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-semibold tabular-nums">{top.conversion}%</p>
                <p className="text-xs text-muted-foreground">conversion</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{top.orders}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{top.revenue}</p>
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
            <CardDescription>Open WhatsApp / IG chats by teammate</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
              >
                <div className="relative">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-secondary text-xs font-medium">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-card",
                      statusDot[member.status],
                    )}
                    aria-label={member.status}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabel[member.role]} · avg reply {member.avgResponse}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{member.openChats}</p>
                  <p className="text-xs text-muted-foreground">open</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden p-0 xl:col-span-2">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Sales team roster</p>
            <p className="text-sm text-muted-foreground">
              Roles & permissions · {teamMembers.length}/{seats} seats on{" "}
              {tierLimits[business.tier].label}
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
            <Button size="sm" className="gap-2">
              <UserPlus className="size-4" />
              Invite
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Member</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead>Chat → paid</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Joined</TableHead>
                  <TableHead className="w-10 pr-4" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-secondary text-xs font-medium">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-card",
                              statusDot[member.status],
                            )}
                          />
                        </div>
                        <div className="leading-tight">
                          <span className="block font-medium">{member.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{roleLabel[member.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{member.orders}</TableCell>
                    <TableCell>
                      <div className="flex min-w-[7rem] items-center gap-2">
                        <Progress value={member.conversion} className="h-1.5 flex-1" />
                        <span className="w-10 text-right text-sm font-medium tabular-nums">
                          {member.conversion}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {member.revenue}
                    </TableCell>
                    <TableCell className="hidden text-right text-sm text-muted-foreground md:table-cell">
                      {member.joined}
                    </TableCell>
                    <TableCell className="pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Actions for ${member.name}`}
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View performance</DropdownMenuItem>
                          <DropdownMenuItem>Edit role & permissions</DropdownMenuItem>
                          <DropdownMenuItem>Message member</DropdownMenuItem>
                          {member.role !== "owner" ? (
                            <DropdownMenuItem variant="destructive">
                              Deactivate
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
