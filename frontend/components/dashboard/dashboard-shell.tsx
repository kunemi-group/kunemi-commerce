"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
import { useAuth } from "@/lib/auth-context"
import { isOwnerRole, productRoleLabel } from "@/lib/workspace-roles"
import { cn } from "@/lib/utils"

export function DashboardShell({
  children,
  title = "Home",
  subtitle = "Welcome back — here is what is happening today.",
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user: authUser, business, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  const displayName = authUser?.fullName ?? "Account"
  const displayInitials = authUser
    ? authUser.fullName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"
  const roleLabel = productRoleLabel(authUser?.role)
  const owner = isOwnerRole(authUser?.role)

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-svh">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-sidebar-border bg-sidebar p-0"
            >
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
                placeholder="Search orders, customers…"
                aria-label="Search"
                className="h-9 w-56 rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
            >
              <Bell className="size-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                }
              >
                <Avatar className="size-8">
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
                      <p className="text-xs font-normal text-muted-foreground">
                        {business?.name
                          ? `${business.name} · ${roleLabel}`
                          : roleLabel}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/")}>
                  Home
                </DropdownMenuItem>
                {owner ? (
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    Business settings
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => router.push("/orders")}>
                    Orders
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

        <main className={cn("flex-1 p-4 md:p-6")}>{children}</main>
      </div>
    </div>
  )
}
