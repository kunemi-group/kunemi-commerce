"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Search, Bell, Calendar, ChevronDown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarNav } from "./sidebar-nav"
import { useRole, type AppRole } from "@/lib/role-context"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const ranges = ["Last 7 days", "Last 30 days", "Last 90 days", "Year to date"]

export function DashboardShell({
  children,
  title = "Dashboard",
  subtitle = "Welcome back — here is what is happening today.",
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [range, setRange] = useState("Last 30 days")
  const { role, setRole, user, dense } = useRole()
  const { user: authUser, business, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const displayName = authUser?.fullName ?? user.name
  const displayInitials = authUser
    ? authUser.fullName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.initials
  const displayRole = authUser?.role ?? user.role

  function switchRole(next: AppRole) {
    setRole(next)
    if ((next === "sales" || next === "ops") && pathname === "/") {
      router.push("/workspace")
    }
    if (next === "owner" && pathname === "/workspace") {
      router.push("/")
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-svh bg-background text-foreground",
        dense && "density-compact",
      )}
      data-density={dense ? "compact" : "comfortable"}
    >
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-svh">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6",
            dense ? "h-14" : "h-16",
          )}
        >
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
              {title}
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {subtitle}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={
                  role === "agent"
                    ? "Search orders, chats, quotes…"
                    : "Search orders, customers…"
                }
                aria-label="Search"
                className={cn(
                  "w-56 rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  dense ? "h-8" : "h-9",
                )}
              />
            </div>

            {/* Demo role switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-card"
                  />
                }
              >
                <Sparkles className="size-3.5 text-primary" />
                <span className="hidden capitalize sm:inline">{role}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Preview Role</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => switchRole("owner")}>
                    Owner — Full Admin Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchRole("manager")}>
                    Manager — Store Operations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchRole("sales")}>
                    Sales — Dense Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchRole("ops")}>
                    Ops — Fulfillment & Delivery
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchRole("admin")}>
                    Platform Admin — System Control
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {role === "owner" ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" className="gap-2 bg-card" />}
                >
                  <Calendar className="size-4" />
                  <span className="hidden sm:inline">{range}</span>
                  <ChevronDown className="size-3.5 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {ranges.map((r) => (
                    <DropdownMenuItem key={r} onSelect={() => setRange(r)}>
                      {r}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 animate-pulse-soft rounded-full bg-primary ring-2 ring-background" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                }
              >
                <Avatar className={dense ? "size-7" : "size-8"}>
                  <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="leading-tight">
                      <p className="text-sm">{displayName}</p>
                      <p className="text-xs font-normal capitalize text-muted-foreground">
                        {business?.name
                          ? business.name
                          : displayRole === "owner"
                            ? "Owner"
                            : `Sales team · ${displayRole}`}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(role === "agent" ? "/workspace" : "/")}
                >
                  Home
                </DropdownMenuItem>
                {role === "owner" || authUser?.role === "owner" ? (
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    Business settings
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => router.push("/orders")}>
                    My orders
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    logout()
                    window.location.assign("/login")
                  }}
                >
                  {isAuthenticated ? "Sign out" : "Sign in"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main
          className={cn(
            "flex-1 animate-fade-in",
            dense ? "p-3 md:p-4" : "p-4 md:p-6",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
