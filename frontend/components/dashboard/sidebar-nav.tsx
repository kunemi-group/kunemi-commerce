"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { navForUser } from "./nav-items"
import { useAuth } from "@/lib/auth-context"
import { isOwnerRole } from "@/lib/workspace-roles"

const tierLabel: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { business, user } = useAuth()
  // Always include Insights for every staff role (not owner-gated).
  const groups = navForUser({ isOwner: isOwnerRole(user?.role) })
  const name = business?.name ?? "Your business"
  const tier = business?.tier ?? "starter"
  const phone = business?.whatsappNumber ?? ""

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Boxes className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">
            Kunemi Workspace
          </p>
          <p className="text-xs text-muted-foreground">Kunemi Commerce</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Primary">
        {groups.map((group) => (
          <div key={group.heading} className="mb-5">
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.heading}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)
                return (
                  <li key={`${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="truncate text-sm font-medium">{name}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted-foreground">
              {phone || "Set WhatsApp in settings"}
            </span>
            <Badge className="shrink-0 border-0 bg-primary/15 text-[11px] text-primary">
              {tierLabel[tier] ?? tier}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
