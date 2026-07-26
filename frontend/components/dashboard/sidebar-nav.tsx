"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { navForRole } from "./nav-items"
import { business } from "@/lib/data"
import { useRole } from "@/lib/role-context"

const tierLabel: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { role, dense } = useRole()
  const groups = navForRole(role)

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn("flex items-center gap-2.5 px-5", dense ? "py-3.5" : "py-5")}>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Kunemi Workspace</p>
          <p className="text-xs text-muted-foreground">
            {role === "agent" ? "Sales floor" : "Kunemi Commerce"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav
        className={cn("flex-1 overflow-y-auto px-3", dense ? "py-1" : "py-2")}
        aria-label="Primary"
      >
        {groups.map((group) => (
          <div key={group.heading} className={dense ? "mb-3" : "mb-5"}>
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.heading}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-2.5 text-sm transition-colors duration-150",
                        dense ? "py-1.5" : "py-2",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px] tabular-nums"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Business card */}
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="truncate text-sm font-medium">{business.name}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{business.whatsapp}</span>
            <Badge className="border-0 bg-primary/15 text-[11px] text-primary">
              {tierLabel[business.tier]}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
