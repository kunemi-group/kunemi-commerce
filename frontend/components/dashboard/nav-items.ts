import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Truck,
  Settings,
  MessageSquare,
  FileText,
  Receipt,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  icon: LucideIcon
  href: string
  /** Owner-only nav (settings, team manage). */
  ownerOnly?: boolean
}

export interface NavGroup {
  heading: string
  items: NavItem[]
}

/**
 * Simplified Workspace IA (Phase A):
 * Home · Inbox · Orders · Products · Money · Deliveries · Quotes · Invoices · Team · Settings
 * Store + Insights land in later phases. AI Agents stay unlisted.
 */
export const navGroups: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { label: "Home", icon: LayoutDashboard, href: "/" },
      { label: "Inbox", icon: MessageSquare, href: "/inbox" },
      { label: "Orders", icon: ShoppingCart, href: "/orders" },
      { label: "Products", icon: Package, href: "/inventory" },
    ],
  },
  {
    heading: "Commerce",
    items: [
      { label: "Money", icon: CreditCard, href: "/payments" },
      { label: "Deliveries", icon: Truck, href: "/deliveries" },
      { label: "Quotations", icon: FileText, href: "/quotations" },
      { label: "Invoices", icon: Receipt, href: "/invoices" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Team", icon: Users, href: "/team", ownerOnly: true },
      { label: "Settings", icon: Settings, href: "/settings", ownerOnly: true },
    ],
  },
]

export function navForUser(opts: { isOwner: boolean }): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.ownerOnly || opts.isOwner),
    }))
    .filter((g) => g.items.length > 0)
}
