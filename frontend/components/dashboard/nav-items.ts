import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Truck,
  Settings,
  MessageSquare,
  Bot,
  FileText,
  Receipt,
  type LucideIcon,
} from "lucide-react"
import type { AppRole } from "@/lib/role-context"

export interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  badge?: string
  /** If set, only these roles see the item */
  roles?: AppRole[]
}

export interface NavGroup {
  heading: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/",
        roles: ["owner"],
      },
      {
        label: "Workspace",
        icon: MessageSquare,
        href: "/workspace",
      },
      {
        label: "Inbox",
        icon: MessageSquare,
        href: "/inbox",
      },
      { label: "Orders", icon: ShoppingCart, href: "/orders", badge: "86" },
      {
        label: "Inventory",
        icon: Package,
        href: "/inventory",
        badge: "4",
      },
    ],
  },
  {
    heading: "Commerce",
    items: [
      { label: "Quotations", icon: FileText, href: "/quotations", badge: "2" },
      { label: "Invoices", icon: Receipt, href: "/invoices", badge: "3" },
      { label: "Payments", icon: CreditCard, href: "/payments", badge: "3" },
      { label: "Deliveries", icon: Truck, href: "/deliveries", badge: "4" },
    ],
  },
  {
    heading: "People",
    items: [
      {
        label: "Sales Team",
        icon: Users,
        href: "/team",
        roles: ["owner"],
      },
      {
        label: "AI Agents",
        icon: Bot,
        href: "/ai-agents",
        roles: ["owner"],
      },
    ],
  },
  {
    heading: "Account",
    items: [{ label: "Settings", icon: Settings, href: "/settings", roles: ["owner"] }],
  },
]

export function navForRole(role: AppRole): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || item.roles.includes(role),
      ),
    }))
    .filter((g) => g.items.length > 0)
}
