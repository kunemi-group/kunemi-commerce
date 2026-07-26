// Mock data modeling the Kunemi Workspace B2B commerce domain (Phase 1 PRD)
// All figures are illustrative and meant to be replaced by real API responses.

export type SubscriptionTier = "starter" | "growth" | "scale"

/** What each plan includes — AI agents are optional add-ons by tier */
export const tierLimits: Record<
  SubscriptionTier,
  {
    label: string
    price: string
    teamSeats: number
    aiAgents: number // 0 = not included; min 1 when plan includes AI
    blurb: string
  }
> = {
  starter: {
    label: "Starter",
    price: "₦15k/mo",
    teamSeats: 2,
    aiAgents: 0,
    blurb: "Owner + 1 sales seat · orders, inventory, bank transfer",
  },
  growth: {
    label: "Growth",
    price: "₦45k/mo",
    teamSeats: 5,
    aiAgents: 1,
    blurb: "Sales team metrics · 1 AI agent · card + transfer · courier APIs",
  },
  scale: {
    label: "Scale",
    price: "₦120k/mo",
    teamSeats: 20,
    aiAgents: 3,
    blurb: "Multi-seat teams · up to 3 AI agents · advanced analytics",
  },
}

export const business = {
  name: "Lagos Threads Co.",
  tier: "growth" as SubscriptionTier,
  whatsapp: "+234 801 234 5678",
  email: "hello@lagosthreads.co",
  address: "12 Allen Ave, Ikeja, Lagos",
  currency: "NGN",
  reservationMinutes: 30,
  channels: ["WhatsApp", "Instagram"] as const,
  /** Document / storefront branding (PDF quotes & invoices) */
  branding: {
    brandColor: "#4f6bed",
    /** null = use initials mark; can be overridden via Settings logo upload */
    logoDataUrl: null as string | null,
  },
  /**
   * VAT from settings — auto-calculated on taxable product lines only.
   * Shipping is never taxed. Tax-free product lines are exempt.
   */
  tax: {
    enabled: true,
    ratePercent: 7.5,
    label: "VAT",
  },
  /** Default delivery fee suggested on new orders (editable per order) */
  shipping: {
    defaultFeeNaira: 2500,
    label: "Shipping",
  },
  /** Prefer bank details when card MDR/fees hurt margins */
  payments: {
    acceptCard: true,
    acceptTransfer: true,
    /** When true, default checkout & chat links emphasize transfer + account details */
    preferTransferToAvoidFees: true,
    bank: {
      bankName: "GTBank",
      accountName: "Lagos Threads Co.",
      accountNumber: "0123456789",
    },
  },
}

export type KpiTrend = "up" | "down"

export interface Kpi {
  id: string
  label: string
  value: string
  delta: string
  trend: KpiTrend
  helper: string
}

export const kpis: Kpi[] = [
  {
    id: "revenue",
    label: "Revenue (30d)",
    value: "₦18.4M",
    delta: "+12.6%",
    trend: "up",
    helper: "vs. previous 30 days",
  },
  {
    id: "orders",
    label: "Orders",
    value: "1,284",
    delta: "+8.1%",
    trend: "up",
    helper: "342 in the last 7 days",
  },
  {
    id: "conversion",
    label: "Chat → Paid",
    value: "62.4%",
    delta: "+3.2%",
    trend: "up",
    helper: "conversion across sales team",
  },
  {
    id: "aov",
    label: "Avg. Order Value",
    value: "₦14,320",
    delta: "-1.4%",
    trend: "down",
    helper: "blended across channels",
  },
]

// Revenue + order volume over time (daily)
export const revenueSeries = [
  { date: "Jun 01", revenue: 520000, orders: 38 },
  { date: "Jun 03", revenue: 610000, orders: 44 },
  { date: "Jun 05", revenue: 480000, orders: 33 },
  { date: "Jun 07", revenue: 720000, orders: 51 },
  { date: "Jun 09", revenue: 690000, orders: 49 },
  { date: "Jun 11", revenue: 830000, orders: 58 },
  { date: "Jun 13", revenue: 770000, orders: 54 },
  { date: "Jun 15", revenue: 910000, orders: 63 },
  { date: "Jun 17", revenue: 1020000, orders: 71 },
  { date: "Jun 19", revenue: 980000, orders: 68 },
  { date: "Jun 21", revenue: 1150000, orders: 79 },
  { date: "Jun 23", revenue: 1080000, orders: 74 },
]

// Order lifecycle funnel — mirrors the saga states in the PRD
export const orderStatusSeries = [
  { status: "Pending", count: 86, fill: "var(--color-pending)" },
  { status: "Paid", count: 233, fill: "var(--color-paid)" },
  { status: "Shipped", count: 174, fill: "var(--color-shipped)" },
  { status: "Delivered", count: 612, fill: "var(--color-delivered)" },
  { status: "Cancelled", count: 41, fill: "var(--color-cancelled)" },
]

// Payment method split (card vs manual transfer)
export const paymentMethodSeries = [
  { method: "Card", value: 742, fill: "var(--color-card)" },
  { method: "Manual transfer", value: 542, fill: "var(--color-manual)" },
]

// Fulfillment mode split
export const fulfillmentSeries = [
  { mode: "Manual", value: 58 },
  { mode: "API integrated", value: 42 },
]

/**
 * Human team members (not AI).
 * App login role `agent` in role-context = sales person session; permissions live here.
 */
export type TeamPermissionRole = "owner" | "manager" | "sales" | "ops"

export interface TeamMember {
  id: string
  name: string
  initials: string
  orders: number
  conversion: number
  revenue: string
  /** RBAC role for dashboard access */
  role: TeamPermissionRole
  status: "online" | "away" | "offline"
  openChats: number
  avgResponse: string
  joined: string
  email: string
}

/** @deprecated Use teamMembers — kept as alias while components migrate */
export type Agent = TeamMember

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Amaka Obi",
    initials: "AO",
    orders: 318,
    conversion: 71,
    revenue: "₦5.1M",
    role: "owner",
    status: "online",
    openChats: 4,
    avgResponse: "2m",
    joined: "Jan 2025",
    email: "amaka@lagosthreads.co",
  },
  {
    id: "2",
    name: "Tunde Bello",
    initials: "TB",
    orders: 276,
    conversion: 64,
    revenue: "₦4.3M",
    role: "sales",
    status: "online",
    openChats: 7,
    avgResponse: "4m",
    joined: "Mar 2025",
    email: "tunde@lagosthreads.co",
  },
  {
    id: "3",
    name: "Ngozi Eze",
    initials: "NE",
    orders: 241,
    conversion: 59,
    revenue: "₦3.6M",
    role: "manager",
    status: "away",
    openChats: 2,
    avgResponse: "6m",
    joined: "Apr 2025",
    email: "ngozi@lagosthreads.co",
  },
  {
    id: "4",
    name: "Kola Adeyemi",
    initials: "KA",
    orders: 198,
    conversion: 55,
    revenue: "₦2.9M",
    role: "sales",
    status: "online",
    openChats: 5,
    avgResponse: "5m",
    joined: "May 2025",
    email: "kola@lagosthreads.co",
  },
  {
    id: "5",
    name: "Fatima Sani",
    initials: "FS",
    orders: 167,
    conversion: 48,
    revenue: "₦2.1M",
    role: "ops",
    status: "offline",
    openChats: 0,
    avgResponse: "9m",
    joined: "Jun 2025",
    email: "fatima@lagosthreads.co",
  },
]

export const agents = teamMembers

/** AI agents — tier-gated; implementation details later */
export type AiAgentStatus = "active" | "paused" | "provisioning" | "locked"

export interface AiAgent {
  id: string
  name: string
  status: AiAgentStatus
  focus: string
  ordersHandled: number
  conversion: number
  lastActive: string
}

export const aiAgents: AiAgent[] = [
  {
    id: "ai_1",
    name: "Kunemi Closer",
    status: "active",
    focus: "WhatsApp order capture · payment follow-ups · stock holds",
    ordersHandled: 412,
    conversion: 58,
    lastActive: "2m ago",
  },
]

export function aiAgentsAllowedForTier(tier: SubscriptionTier = business.tier): number {
  return tierLimits[tier].aiAgents
}

export type OrderStatus =
  | "pending"
  | "payment_review"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired"

export interface Order {
  id: string
  customer: string
  agent: string
  items: number
  total: string
  status: OrderStatus
  payment: "card" | "manual_transfer"
  placed: string
  /** Minutes remaining on inventory hold — only for pending */
  holdMinutesLeft?: number
  phone?: string
  email?: string
}

export const recentOrders: Order[] = [
  { id: "#A3C9", customer: "Amaka Obi", agent: "Tunde B.", items: 2, total: "₦15,000", status: "paid", payment: "card", placed: "2m ago", phone: "+2348011110001", email: "amaka.o@example.com" },
  { id: "#A3C2", customer: "Chidi N.", agent: "Amaka O.", items: 1, total: "₦8,500", status: "pending", payment: "manual_transfer", placed: "14m ago", holdMinutesLeft: 16, phone: "+2348022220002", email: "chidi@example.com" },
  { id: "#A3B8", customer: "Bisi A.", agent: "Ngozi E.", items: 4, total: "₦32,400", status: "shipped", payment: "card", placed: "1h ago", phone: "+2348033330003", email: "bisi@example.com" },
  { id: "#A3B1", customer: "Emeka U.", agent: "Kola A.", items: 3, total: "₦21,750", status: "delivered", payment: "card", placed: "3h ago", phone: "+2348044440004" },
  { id: "#A3A7", customer: "Zainab M.", agent: "Fatima S.", items: 1, total: "₦6,200", status: "cancelled", payment: "manual_transfer", placed: "5h ago", phone: "+2348055550005", email: "zainab@example.com" },
  { id: "#A3A0", customer: "Femi O.", agent: "Tunde B.", items: 2, total: "₦18,900", status: "paid", payment: "card", placed: "6h ago", phone: "+2348066660006" },
  { id: "#A39C", customer: "Grace I.", agent: "Amaka O.", items: 5, total: "₦44,100", status: "delivered", payment: "card", placed: "8h ago", phone: "+2348077770007", email: "grace@mail.com" },
]

// Larger order book used by the dedicated Orders page
export const allOrders: Order[] = [
  { id: "#A3C9", customer: "Amaka Obi", agent: "Tunde B.", items: 2, total: "₦15,000", status: "paid", payment: "card", placed: "2m ago", phone: "+2348011110001" },
  { id: "#A3C2", customer: "Chidi Nwosu", agent: "Amaka O.", items: 1, total: "₦8,500", status: "pending", payment: "manual_transfer", placed: "14m ago", holdMinutesLeft: 16, phone: "+2348022220002" },
  { id: "#A3B8", customer: "Bisi Adewale", agent: "Ngozi E.", items: 4, total: "₦32,400", status: "shipped", payment: "card", placed: "1h ago", phone: "+2348033330003" },
  { id: "#A3B1", customer: "Emeka Umeh", agent: "Kola A.", items: 3, total: "₦21,750", status: "delivered", payment: "card", placed: "3h ago", phone: "+2348044440004" },
  { id: "#A3A7", customer: "Zainab Musa", agent: "Fatima S.", items: 1, total: "₦6,200", status: "cancelled", payment: "manual_transfer", placed: "5h ago", phone: "+2348055550005" },
  { id: "#A3A0", customer: "Femi Okafor", agent: "Tunde B.", items: 2, total: "₦18,900", status: "paid", payment: "card", placed: "6h ago", phone: "+2348066660006" },
  { id: "#A39C", customer: "Grace Ibe", agent: "Amaka O.", items: 5, total: "₦44,100", status: "delivered", payment: "card", placed: "8h ago", phone: "+2348077770007" },
  { id: "#A398", customer: "Kunle Bakare", agent: "Ngozi E.", items: 2, total: "₦12,300", status: "pending", payment: "manual_transfer", placed: "9h ago", holdMinutesLeft: 21, phone: "+2348088880008" },
  { id: "#A392", customer: "Halima Yusuf", agent: "Kola A.", items: 1, total: "₦5,400", status: "expired", payment: "manual_transfer", placed: "11h ago", phone: "+2348099990009" },
  { id: "#A38D", customer: "Tobi Coker", agent: "Fatima S.", items: 6, total: "₦58,200", status: "shipped", payment: "card", placed: "13h ago", phone: "+2348010100010" },
  { id: "#A386", customer: "Ada Eze", agent: "Tunde B.", items: 3, total: "₦27,600", status: "paid", payment: "card", placed: "15h ago", phone: "+2348012120012" },
  { id: "#A381", customer: "Sola Martins", agent: "Amaka O.", items: 2, total: "₦16,750", status: "delivered", payment: "manual_transfer", placed: "18h ago", phone: "+2348013130013" },
  { id: "#A37C", customer: "Ifeanyi Obi", agent: "Ngozi E.", items: 1, total: "₦9,900", status: "cancelled", payment: "card", placed: "20h ago", phone: "+2348014140014" },
  { id: "#A378", customer: "Maryam Bello", agent: "Kola A.", items: 4, total: "₦34,800", status: "delivered", payment: "card", placed: "22h ago", phone: "+2348015150015" },
  { id: "#A374", customer: "Daniel Effiong", agent: "Fatima S.", items: 2, total: "₦19,250", status: "pending", payment: "manual_transfer", placed: "1d ago", holdMinutesLeft: 8, phone: "+2348016160016" },
  { id: "#A36F", customer: "Patience Udo", agent: "Tunde B.", items: 3, total: "₦23,400", status: "shipped", payment: "card", placed: "1d ago", phone: "+2348017170017" },
]

// KPI tiles specific to the Orders page
export const orderKpis: Kpi[] = [
  { id: "total", label: "Total orders", value: "1,284", delta: "+8.1%", trend: "up", helper: "last 30 days" },
  { id: "pending", label: "Awaiting payment", value: "86", delta: "+5", trend: "up", helper: "needs follow-up" },
  { id: "fulfillment", label: "Fulfillment rate", value: "94.2%", delta: "+1.8%", trend: "up", helper: "shipped on time" },
  { id: "cancelled", label: "Cancelled / expired", value: "127", delta: "-2.3%", trend: "down", helper: "abandoned or voided" },
]

export interface LowStockItem {
  id: string
  product: string
  variant: string
  sku: string
  onHand: number
  reserved: number
  threshold: number
}

export const lowStock: LowStockItem[] = [
  { id: "1", product: "Ankara Maxi Dress", variant: "M / Red", sku: "AMX-M-RED", onHand: 3, reserved: 2, threshold: 5 },
  { id: "2", product: "Linen Shirt", variant: "L / White", sku: "LIN-L-WHT", onHand: 4, reserved: 1, threshold: 6 },
  { id: "3", product: "Leather Tote", variant: "Tan", sku: "LTR-TOT-TAN", onHand: 2, reserved: 0, threshold: 4 },
  { id: "4", product: "Denim Jacket", variant: "S / Blue", sku: "DNM-S-BLU", onHand: 1, reserved: 1, threshold: 5 },
]

// ── Inventory (product variants) ────────────────────────────────────────────

export interface InventoryItem {
  id: string
  product: string
  variant: string
  sku: string
  price: string
  onHand: number
  reserved: number
  threshold: number
  category: string
  /** Catalog default — order lines inherit; can override at order time */
  taxExempt?: boolean
}

export const inventory: InventoryItem[] = [
  { id: "1", product: "Ankara Maxi Dress", variant: "M / Red", sku: "AMX-M-RED", price: "₦18,500", onHand: 3, reserved: 2, threshold: 5, category: "Dresses" },
  { id: "2", product: "Ankara Maxi Dress", variant: "L / Blue", sku: "AMX-L-BLU", price: "₦18,500", onHand: 14, reserved: 3, threshold: 5, category: "Dresses" },
  { id: "3", product: "Linen Shirt", variant: "L / White", sku: "LIN-L-WHT", price: "₦12,000", onHand: 4, reserved: 1, threshold: 6, category: "Tops" },
  { id: "4", product: "Linen Shirt", variant: "M / Olive", sku: "LIN-M-OLV", price: "₦12,000", onHand: 22, reserved: 4, threshold: 6, category: "Tops" },
  { id: "5", product: "Leather Tote", variant: "Tan", sku: "LTR-TOT-TAN", price: "₦32,000", onHand: 2, reserved: 0, threshold: 4, category: "Bags" },
  { id: "6", product: "Leather Tote", variant: "Black", sku: "LTR-TOT-BLK", price: "₦32,000", onHand: 9, reserved: 2, threshold: 4, category: "Bags" },
  { id: "7", product: "Denim Jacket", variant: "S / Blue", sku: "DNM-S-BLU", price: "₦24,500", onHand: 1, reserved: 1, threshold: 5, category: "Outerwear" },
  { id: "8", product: "Denim Jacket", variant: "M / Blue", sku: "DNM-M-BLU", price: "₦24,500", onHand: 11, reserved: 0, threshold: 5, category: "Outerwear" },
  { id: "9", product: "Adire Wrap Skirt", variant: "Free / Indigo", sku: "ADR-WRP-IND", price: "₦15,800", onHand: 18, reserved: 5, threshold: 8, category: "Bottoms" },
  { id: "10", product: "Cotton Tee Pack", variant: "M / 3-pack", sku: "CTN-TEE-M3", price: "₦9,500", onHand: 40, reserved: 6, threshold: 12, category: "Tops" },
  { id: "11", product: "Beaded Clutch", variant: "Gold", sku: "BD-CLT-GLD", price: "₦14,200", onHand: 7, reserved: 1, threshold: 4, category: "Bags", taxExempt: true },
  { id: "12", product: "Kente Scarf", variant: "One size", sku: "KNT-SCF-01", price: "₦8,000", onHand: 25, reserved: 0, threshold: 10, category: "Accessories", taxExempt: true },
]

export const inventoryKpis: Kpi[] = [
  { id: "skus", label: "Active SKUs", value: "12", delta: "+2", trend: "up", helper: "variants in catalog" },
  { id: "onhand", label: "Units on hand", value: "156", delta: "-8", trend: "down", helper: "physical stock" },
  { id: "reserved", label: "Reserved (holds)", value: "25", delta: "+6", trend: "up", helper: "pending payment windows" },
  { id: "low", label: "Low stock SKUs", value: "4", delta: "+1", trend: "up", helper: "at or below threshold" },
]

// ── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = "awaiting_payment" | "under_review" | "confirmed" | "failed"
export type PaymentMethod = "card" | "manual_transfer"

export interface Payment {
  id: string
  orderId: string
  customer: string
  agent: string
  method: PaymentMethod
  amount: string
  status: PaymentStatus
  reference?: string
  proofLabel?: string
  updated: string
}

export const payments: Payment[] = [
  { id: "pay_91", orderId: "#A3C2", customer: "Chidi Nwosu", agent: "Amaka O.", method: "manual_transfer", amount: "₦8,500", status: "under_review", proofLabel: "transfer_chidi.jpg", updated: "4m ago" },
  { id: "pay_90", orderId: "#A398", customer: "Kunle Bakare", agent: "Ngozi E.", method: "manual_transfer", amount: "₦12,300", status: "under_review", proofLabel: "gtb_receipt.png", updated: "18m ago" },
  { id: "pay_89", orderId: "#A374", customer: "Daniel Effiong", agent: "Fatima S.", method: "manual_transfer", amount: "₦19,250", status: "under_review", proofLabel: "uba_shot.jpg", updated: "1h ago" },
  { id: "pay_88", orderId: "#A3C9", customer: "Amaka Obi", agent: "Tunde B.", method: "card", amount: "₦15,000", status: "confirmed", reference: "PSK-8821", updated: "2m ago" },
  { id: "pay_87", orderId: "#A386", customer: "Ada Eze", agent: "Tunde B.", method: "card", amount: "₦27,600", status: "confirmed", reference: "PSK-8790", updated: "15h ago" },
  { id: "pay_86", orderId: "#A3A0", customer: "Femi Okafor", agent: "Tunde B.", method: "card", amount: "₦18,900", status: "confirmed", reference: "PSK-8744", updated: "6h ago" },
  { id: "pay_85", orderId: "#A392", customer: "Halima Yusuf", agent: "Kola A.", method: "manual_transfer", amount: "₦5,400", status: "failed", proofLabel: "blurry_shot.jpg", updated: "11h ago" },
  { id: "pay_84", orderId: "#A381", customer: "Sola Martins", agent: "Amaka O.", method: "manual_transfer", amount: "₦16,750", status: "confirmed", proofLabel: "zenith_ok.pdf", updated: "18h ago" },
  { id: "pay_83", orderId: "#A3B1", customer: "Emeka Umeh", agent: "Kola A.", method: "card", amount: "₦21,750", status: "confirmed", reference: "PSK-8701", updated: "3h ago" },
  { id: "pay_82", orderId: "#A370", customer: "Ruth Okon", agent: "Ngozi E.", method: "card", amount: "₦11,200", status: "awaiting_payment", reference: "PSK-pending", updated: "25m ago" },
  { id: "pay_81", orderId: "#A36C", customer: "Ibrahim Lawal", agent: "Fatima S.", method: "manual_transfer", amount: "₦22,000", status: "awaiting_payment", updated: "40m ago" },
]

export const paymentKpis: Kpi[] = [
  { id: "collected", label: "Collected (30d)", value: "₦18.4M", delta: "+12.6%", trend: "up", helper: "confirmed payments" },
  { id: "review", label: "Under review", value: "3", delta: "+2", trend: "up", helper: "manual transfers waiting" },
  { id: "awaiting", label: "Awaiting payment", value: "86", delta: "+5", trend: "up", helper: "open payment links" },
  { id: "failed", label: "Failed / rejected", value: "14", delta: "-3", trend: "down", helper: "last 30 days" },
]

// ── Deliveries ──────────────────────────────────────────────────────────────

export type DeliveryStatus =
  | "awaiting_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed"

export type FulfillmentMode = "manual" | "api_integrated"

export interface Delivery {
  id: string
  orderId: string
  customer: string
  destination: string
  mode: FulfillmentMode
  provider?: string
  status: DeliveryStatus
  trackingToken: string
  externalTrackingUrl?: string
  updated: string
}

export const deliveries: Delivery[] = [
  {
    id: "d1",
    orderId: "#A3B8",
    customer: "Bisi Adewale",
    destination: "Ikeja, Lagos",
    mode: "manual",
    provider: "GIG Logistics",
    status: "out_for_delivery",
    trackingToken: "trk_8a2f",
    externalTrackingUrl: "https://giglogistics.com/track/9F3K2",
    updated: "22m ago",
  },
  {
    id: "d2",
    orderId: "#A38D",
    customer: "Tobi Coker",
    destination: "Lekki Phase 1",
    mode: "api_integrated",
    provider: "Kwik Delivery",
    status: "picked_up",
    trackingToken: "trk_91bc",
    updated: "1h ago",
  },
  {
    id: "d3",
    orderId: "#A36F",
    customer: "Patience Udo",
    destination: "Surulere",
    mode: "manual",
    status: "awaiting_pickup",
    trackingToken: "trk_44de",
    updated: "2h ago",
  },
  {
    id: "d4",
    orderId: "#A3B1",
    customer: "Emeka Umeh",
    destination: "Yaba",
    mode: "api_integrated",
    provider: "Kwik Delivery",
    status: "delivered",
    trackingToken: "trk_22aa",
    updated: "3h ago",
  },
  {
    id: "d5",
    orderId: "#A39C",
    customer: "Grace Ibe",
    destination: "Abuja · Garki",
    mode: "manual",
    provider: "DHL",
    status: "delivered",
    trackingToken: "trk_77cf",
    externalTrackingUrl: "https://www.dhl.com/track",
    updated: "8h ago",
  },
  {
    id: "d6",
    orderId: "#A381",
    customer: "Sola Martins",
    destination: "Ibadan",
    mode: "manual",
    provider: "In-house rider",
    status: "out_for_delivery",
    trackingToken: "trk_55bb",
    updated: "5h ago",
  },
  {
    id: "d7",
    orderId: "#A378",
    customer: "Maryam Bello",
    destination: "Port Harcourt",
    mode: "api_integrated",
    provider: "Kwik Delivery",
    status: "delivered",
    trackingToken: "trk_33ee",
    updated: "22h ago",
  },
  {
    id: "d8",
    orderId: "#A360",
    customer: "Uche Nnaji",
    destination: "Enugu",
    mode: "manual",
    provider: "GIG Logistics",
    status: "failed",
    trackingToken: "trk_19ff",
    updated: "1d ago",
  },
]

export const deliveryKpis: Kpi[] = [
  { id: "transit", label: "In transit", value: "3", delta: "+1", trend: "up", helper: "picked up or out for delivery" },
  { id: "pickup", label: "Awaiting pickup", value: "1", delta: "0", trend: "down", helper: "ready to hand off" },
  { id: "delivered", label: "Delivered (7d)", value: "48", delta: "+9%", trend: "up", helper: "successful handovers" },
  { id: "manual", label: "Manual share", value: "58%", delta: "-4%", trend: "down", helper: "vs API-integrated" },
]

// Sample public tracking payload (customer-facing page)
export const trackingByToken: Record<
  string,
  {
    token: string
    businessName: string
    orderId: string
    customer: string
    status: DeliveryStatus
    mode: FulfillmentMode
    provider?: string
    externalTrackingUrl?: string
    items: { name: string; qty: number }[]
    timeline: { label: string; at: string; done: boolean }[]
    eta: string
  }
> = {
  trk_8a2f: {
    token: "trk_8a2f",
    businessName: "Lagos Threads Co.",
    orderId: "#A3B8",
    customer: "Bisi Adewale",
    status: "out_for_delivery",
    mode: "manual",
    provider: "GIG Logistics",
    externalTrackingUrl: "https://giglogistics.com/track/9F3K2",
    items: [
      { name: "Ankara Maxi Dress · L / Blue", qty: 2 },
      { name: "Kente Scarf", qty: 1 },
      { name: "Cotton Tee Pack · M", qty: 1 },
    ],
    timeline: [
      { label: "Order placed", at: "Jun 23 · 10:12", done: true },
      { label: "Payment confirmed", at: "Jun 23 · 10:28", done: true },
      { label: "Packed & awaiting pickup", at: "Jun 23 · 14:05", done: true },
      { label: "Out for delivery", at: "Jun 24 · 09:40", done: true },
      { label: "Delivered", at: "ETA today", done: false },
    ],
    eta: "Today by 6:00 PM",
  },
}

export const teamKpis: Kpi[] = [
  { id: "team", label: "Team seats", value: "5", delta: "+1", trend: "up", helper: "including owner" },
  { id: "conversion", label: "Team chat → paid", value: "62.4%", delta: "+3.2%", trend: "up", helper: "last 30 days" },
  { id: "open", label: "Open chats", value: "18", delta: "-3", trend: "down", helper: "across the floor now" },
  { id: "top", label: "Top closer", value: "Amaka O.", delta: "71%", trend: "up", helper: "conversion rate" },
]

/** @deprecated use teamKpis */
export const agentKpis = teamKpis

export const aiAgentKpis: Kpi[] = [
  {
    id: "included",
    label: "AI seats on plan",
    value: String(tierLimits[business.tier].aiAgents),
    delta: business.tier === "starter" ? "0" : "incl.",
    trend: "up",
    helper: `${tierLimits[business.tier].label} plan`,
  },
  {
    id: "active",
    label: "Active AI agents",
    value: "1",
    delta: "min 1",
    trend: "up",
    helper: "when AI is on the subscription",
  },
  {
    id: "orders",
    label: "AI-handled orders",
    value: "412",
    delta: "+18%",
    trend: "up",
    helper: "last 30 days",
  },
  {
    id: "conv",
    label: "AI chat → paid",
    value: "58%",
    delta: "+2.1%",
    trend: "up",
    helper: "auto + human handoff",
  },
]

// ── Quotations & invoices ───────────────────────────────────────────────────

export type QuoteStatus = "draft" | "sent" | "accepted" | "expired" | "converted"
export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "void"

export interface QuoteLine {
  name: string
  qty: number
  unitPrice: string
  /** When true, line is excluded from VAT base (tax-free) */
  taxExempt?: boolean
}

export interface Quotation {
  id: string
  customer: string
  email?: string
  phone?: string
  address?: string
  total: string
  status: QuoteStatus
  validUntil: string
  channel: "whatsapp" | "email" | "both"
  paymentMethods: ("card" | "transfer")[]
  lines: QuoteLine[]
  /** Delivery fee in naira (number) or display string */
  shippingFee?: number
  created: string
  owner: string
  notes?: string
  issueDate?: string
}

export interface Invoice {
  id: string
  customer: string
  email?: string
  phone?: string
  address?: string
  total: string
  status: InvoiceStatus
  dueDate: string
  channel: "whatsapp" | "email" | "both"
  paymentMethods: ("card" | "transfer")[]
  orderId?: string
  quoteId?: string
  created: string
  owner: string
  lines: QuoteLine[]
  shippingFee?: number
  notes?: string
  issueDate?: string
  /** Amount already paid (for partial) */
  amountPaid?: string
}

export const quotations: Quotation[] = [
  {
    id: "QT-1042",
    customer: "Riverside Boutique",
    email: "buy@riverside.ng",
    phone: "+2348091112233",
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
    total: "₦185,000",
    status: "sent",
    validUntil: "Jul 18, 2026",
    issueDate: "Jul 10, 2026",
    channel: "both",
    paymentMethods: ["transfer", "card"],
    shippingFee: 8500,
    // Long line list — PDF re-prints table headers across pages
    lines: [
      { name: "Ankara Maxi Dress · S / Red", qty: 2, unitPrice: "₦18,500" },
      { name: "Ankara Maxi Dress · M / Red", qty: 3, unitPrice: "₦18,500" },
      { name: "Ankara Maxi Dress · L / Blue", qty: 3, unitPrice: "₦18,500" },
      { name: "Kente Scarf · One size", qty: 5, unitPrice: "₦8,000", taxExempt: true },
      { name: "Linen Shirt · M / White", qty: 4, unitPrice: "₦12,000" },
      { name: "Linen Shirt · L / Olive", qty: 4, unitPrice: "₦12,000" },
      { name: "Leather Tote · Tan", qty: 2, unitPrice: "₦32,000" },
      { name: "Leather Tote · Black", qty: 2, unitPrice: "₦32,000" },
      { name: "Denim Jacket · S / Blue", qty: 1, unitPrice: "₦24,500" },
      { name: "Denim Jacket · M / Blue", qty: 2, unitPrice: "₦24,500" },
      { name: "Adire Wrap Skirt · Indigo", qty: 3, unitPrice: "₦15,800" },
      { name: "Cotton Tee Pack · S", qty: 6, unitPrice: "₦9,500" },
      { name: "Cotton Tee Pack · M", qty: 8, unitPrice: "₦9,500" },
      { name: "Cotton Tee Pack · L", qty: 6, unitPrice: "₦9,500" },
      { name: "Beaded Clutch · Gold", qty: 2, unitPrice: "₦14,200", taxExempt: true },
      { name: "Beaded Clutch · Silver", qty: 2, unitPrice: "₦14,200", taxExempt: true },
      { name: "Ankara Headwrap · Assorted", qty: 10, unitPrice: "₦3,500", taxExempt: true },
      { name: "Kids Ankara Set · 4Y", qty: 3, unitPrice: "₦11,000" },
      { name: "Kids Ankara Set · 6Y", qty: 3, unitPrice: "₦11,000" },
      { name: "Mens Kaftan · M", qty: 2, unitPrice: "₦28,000" },
      { name: "Mens Kaftan · L", qty: 2, unitPrice: "₦28,000" },
      { name: "Gift Packaging · Large", qty: 15, unitPrice: "₦800", taxExempt: true },
      { name: "Sample swatch pack", qty: 5, unitPrice: "₦1,500", taxExempt: true },
      { name: "Display hanger kit", qty: 4, unitPrice: "₦2,200", taxExempt: true },
      { name: "Bulk crate handling", qty: 1, unitPrice: "₦12,000", taxExempt: true },
    ],
    created: "2d ago",
    owner: "Tunde B.",
    notes: "VAT auto-applied only on taxable lines. Tax-free lines marked. Shipping is separate.",
  },
  {
    id: "QT-1041",
    customer: "Chidi Nwosu",
    phone: "+2348022220002",
    address: "Yaba, Lagos",
    total: "₦32,000",
    status: "accepted",
    validUntil: "Jul 12, 2026",
    issueDate: "Jul 6, 2026",
    channel: "whatsapp",
    paymentMethods: ["transfer"],
    shippingFee: 2000,
    lines: [{ name: "Leather Tote · Tan", qty: 1, unitPrice: "₦32,000" }],
    created: "4d ago",
    owner: "Amaka O.",
  },
  {
    id: "QT-1038",
    customer: "Event Co. Lagos",
    email: "ops@eventco.ng",
    address: "Victoria Island, Lagos",
    total: "₦420,000",
    status: "draft",
    validUntil: "Jul 25, 2026",
    issueDate: "Jul 9, 2026",
    channel: "email",
    paymentMethods: ["transfer"],
    shippingFee: 15000,
    lines: [
      { name: "Cotton Tee Pack", qty: 40, unitPrice: "₦9,500" },
      { name: "Adire Wrap Skirt", qty: 5, unitPrice: "₦15,800" },
      { name: "Event gift bags", qty: 40, unitPrice: "₦500", taxExempt: true },
    ],
    created: "1d ago",
    owner: "Ngozi E.",
    notes: "Corporate event supply — gift bags tax-free.",
  },
  {
    id: "QT-1035",
    customer: "Halima Yusuf",
    phone: "+2348099990009",
    total: "₦24,500",
    status: "expired",
    validUntil: "Jun 30, 2026",
    issueDate: "Jun 20, 2026",
    channel: "whatsapp",
    paymentMethods: ["card", "transfer"],
    lines: [{ name: "Denim Jacket · M", qty: 1, unitPrice: "₦24,500" }],
    created: "12d ago",
    owner: "Kola A.",
  },
  {
    id: "QT-1030",
    customer: "Grace Ibe",
    email: "grace@mail.com",
    phone: "+2348077770007",
    total: "₦44,100",
    status: "converted",
    validUntil: "Jun 28, 2026",
    issueDate: "Jun 15, 2026",
    channel: "both",
    paymentMethods: ["card"],
    lines: [
      { name: "Ankara Maxi Dress · M / Red", qty: 1, unitPrice: "₦18,500" },
      { name: "Linen Shirt · L / Olive", qty: 1, unitPrice: "₦12,000" },
      { name: "Kente Scarf", qty: 1, unitPrice: "₦8,000" },
      { name: "Cotton Tee Pack · M", qty: 1, unitPrice: "₦9,500" },
    ],
    created: "18d ago",
    owner: "Amaka O.",
  },
]

export const invoices: Invoice[] = [
  {
    id: "INV-2201",
    customer: "Riverside Boutique",
    email: "buy@riverside.ng",
    phone: "+2348091112233",
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
    total: "₦185,000",
    status: "sent",
    dueDate: "Jul 20, 2026",
    issueDate: "Jul 10, 2026",
    channel: "both",
    paymentMethods: ["transfer", "card"],
    quoteId: "QT-1042",
    shippingFee: 8500,
    created: "1d ago",
    owner: "Tunde B.",
    lines: [
      { name: "Ankara Maxi Dress · mix", qty: 8, unitPrice: "₦18,500" },
      { name: "Kente Scarf", qty: 5, unitPrice: "₦8,000", taxExempt: true },
    ],
    notes: "Wholesale order · VAT only on taxable lines · shipping separate.",
  },
  {
    id: "INV-2198",
    customer: "Bisi Adewale",
    phone: "+2348033330003",
    address: "Ikeja GRA, Lagos",
    total: "₦32,400",
    status: "paid",
    dueDate: "Jun 24, 2026",
    issueDate: "Jun 23, 2026",
    channel: "whatsapp",
    paymentMethods: ["card"],
    orderId: "#A3B8",
    shippingFee: 2500,
    created: "6d ago",
    owner: "Ngozi E.",
    lines: [
      { name: "Ankara Maxi Dress · L / Blue", qty: 2, unitPrice: "₦18,500" },
      { name: "Kente Scarf", qty: 1, unitPrice: "₦8,000", taxExempt: true },
      { name: "Cotton Tee Pack · M", qty: 1, unitPrice: "₦9,500" },
    ],
    amountPaid: "₦32,400",
  },
  {
    id: "INV-2195",
    customer: "Event Co. Lagos",
    email: "ops@eventco.ng",
    address: "Victoria Island, Lagos",
    total: "₦210,000",
    status: "partial",
    dueDate: "Jul 15, 2026",
    issueDate: "Jul 5, 2026",
    channel: "email",
    paymentMethods: ["transfer"],
    shippingFee: 12000,
    created: "5d ago",
    owner: "Amaka O.",
    lines: [
      { name: "Cotton Tee Pack", qty: 20, unitPrice: "₦9,500" },
      { name: "Adire Wrap Skirt", qty: 2, unitPrice: "₦15,800" },
      { name: "Event gift bags", qty: 20, unitPrice: "₦500", taxExempt: true },
    ],
    amountPaid: "₦100,000",
    notes: "50% deposit received · balance due before delivery.",
  },
  {
    id: "INV-2190",
    customer: "Kunle Bakare",
    phone: "+2348088880008",
    total: "₦12,300",
    status: "overdue",
    dueDate: "Jul 1, 2026",
    issueDate: "Jun 20, 2026",
    channel: "whatsapp",
    paymentMethods: ["transfer"],
    shippingFee: 1500,
    created: "10d ago",
    owner: "Ngozi E.",
    lines: [{ name: "Linen Shirt · L / White", qty: 1, unitPrice: "₦12,000" }],
  },
  {
    id: "INV-2188",
    customer: "Ada Eze",
    phone: "+2348012120012",
    total: "₦27,600",
    status: "draft",
    dueDate: "Jul 22, 2026",
    issueDate: "Jul 10, 2026",
    channel: "whatsapp",
    paymentMethods: ["card", "transfer"],
    shippingFee: 2500,
    created: "3h ago",
    owner: "Tunde B.",
    lines: [
      { name: "Denim Jacket · M / Blue", qty: 1, unitPrice: "₦24,500" },
      { name: "Beaded Clutch · Gold", qty: 1, unitPrice: "₦14,200", taxExempt: true },
    ],
  },
]

export function getQuotation(id: string): Quotation | undefined {
  return quotations.find((q) => q.id === id)
}

export function getInvoice(id: string): Invoice | undefined {
  return invoices.find((i) => i.id === id)
}

export const quoteKpis: Kpi[] = [
  { id: "open", label: "Open quotes", value: "2", delta: "+1", trend: "up", helper: "sent or draft" },
  { id: "accepted", label: "Accepted (30d)", value: "14", delta: "+3", trend: "up", helper: "ready to invoice" },
  { id: "value", label: "Quoted value", value: "₦2.1M", delta: "+9%", trend: "up", helper: "last 30 days" },
  { id: "convert", label: "Quote → order", value: "41%", delta: "+2%", trend: "up", helper: "conversion rate" },
]

export const invoiceKpis: Kpi[] = [
  { id: "out", label: "Outstanding", value: "₦407k", delta: "+12%", trend: "up", helper: "sent + partial + overdue" },
  { id: "paid", label: "Collected (30d)", value: "₦6.8M", delta: "+8%", trend: "up", helper: "marked paid" },
  { id: "overdue", label: "Overdue", value: "1", delta: "0", trend: "down", helper: "needs chase" },
  { id: "avg", label: "Avg. days to pay", value: "4.2", delta: "-0.6", trend: "down", helper: "faster is better" },
]

// ── Attention inbox ─────────────────────────────────────────────────────────

export type AttentionKind =
  | "payment_review"
  | "hold_expiring"
  | "low_stock"
  | "awaiting_pickup"
  | "failed_delivery"

export interface AttentionItem {
  id: string
  kind: AttentionKind
  title: string
  detail: string
  href: string
  urgency: "high" | "medium" | "low"
  meta?: string
}

export const attentionItems: AttentionItem[] = [
  {
    id: "a1",
    kind: "payment_review",
    title: "3 transfers need confirmation",
    detail: "Manual proofs waiting — confirm to mark orders paid",
    href: "/payments",
    urgency: "high",
    meta: "₦40,050 total",
  },
  {
    id: "a2",
    kind: "hold_expiring",
    title: "Hold expiring on #A374",
    detail: "Daniel Effiong · ~8 min left · stock will release if unpaid",
    href: "/orders",
    urgency: "high",
    meta: "8m left",
  },
  {
    id: "a3",
    kind: "low_stock",
    title: "4 SKUs at or below threshold",
    detail: "Denim Jacket S is critical (1 available)",
    href: "/inventory",
    urgency: "medium",
  },
  {
    id: "a4",
    kind: "awaiting_pickup",
    title: "1 parcel awaiting pickup",
    detail: "#A36F · Patience Udo · Surulere",
    href: "/deliveries",
    urgency: "medium",
  },
  {
    id: "a5",
    kind: "failed_delivery",
    title: "Delivery failed · #A360",
    detail: "Uche Nnaji · Enugu — customer unreachable",
    href: "/deliveries",
    urgency: "high",
  },
]

// ── Onboarding checklist ────────────────────────────────────────────────────

export interface OnboardingStep {
  id: string
  label: string
  description: string
  href: string
  done: boolean
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "wa",
    label: "Connect WhatsApp business number",
    description: "So the sales team can paste payment & tracking links into chats",
    href: "/settings",
    done: true,
  },
  {
    id: "products",
    label: "Add products (optional)",
    description: "Inventory is optional — freeform orders work with no catalog",
    href: "/inventory",
    done: true,
  },
  {
    id: "team",
    label: "Invite your first sales teammate",
    description: "Humans with roles & permissions — separate from AI agents",
    href: "/team",
    done: false,
  },
  {
    id: "order",
    label: "Create a test order from Workspace",
    description: "Catalog or freeform lines · shipping · VAT on products only",
    href: "/workspace",
    done: false,
  },
]

// ── Order detail enrichment ─────────────────────────────────────────────────

export interface OrderLineItem {
  name: string
  qty: number
  price: string
}

export interface OrderTimelineStep {
  label: string
  at: string
  done: boolean
}

export interface OrderDetail extends Order {
  address: string
  paymentLink: string
  trackingToken?: string
  lineItems: OrderLineItem[]
  timeline: OrderTimelineStep[]
}

const defaultLines: OrderLineItem[] = [
  { name: "Ankara Maxi Dress · M / Red", qty: 1, price: "₦18,500" },
  { name: "Kente Scarf", qty: 1, price: "₦8,000" },
]

export function getOrderDetail(orderId: string): OrderDetail | null {
  const base =
    allOrders.find((o) => o.id === orderId) ??
    recentOrders.find((o) => o.id === orderId)
  if (!base) return null

  const delivery = deliveries.find((d) => d.orderId === orderId)

  const timeline: OrderTimelineStep[] = [
    { label: "Order created · stock reserved", at: base.placed, done: true },
    {
      label: base.payment === "card" ? "Card payment" : "Transfer proof",
      at:
        base.status === "pending" || base.status === "expired"
          ? "Waiting…"
          : "Confirmed",
      done: !["pending", "expired", "cancelled"].includes(base.status),
    },
    {
      label: "Shipped",
      at: base.status === "shipped" || base.status === "delivered" ? "In progress" : "—",
      done: base.status === "shipped" || base.status === "delivered",
    },
    {
      label: "Delivered",
      at: base.status === "delivered" ? "Complete" : "—",
      done: base.status === "delivered",
    },
  ]

  if (base.status === "cancelled") {
    timeline.push({ label: "Cancelled · stock released", at: base.placed, done: true })
  }
  if (base.status === "expired") {
    timeline.push({ label: "Expired · stock released", at: base.placed, done: true })
  }

  return {
    ...base,
    phone: base.phone ?? "+2348000000000",
    email: base.email,
    address: delivery?.destination ?? "12 Allen Ave, Ikeja, Lagos",
    paymentLink: `https://pay.workspace.kunemi.com/o/${orderId.replace("#", "")}`,
    trackingToken: delivery?.trackingToken,
    lineItems: defaultLines.slice(0, Math.min(base.items, 2)).map((line, i) =>
      i === 0 ? { ...line, qty: Math.max(1, base.items - 1) } : line,
    ),
    timeline,
  }
}

/** Open chats for agent workspace mock */
export const openChats = [
  {
    id: "c1",
    customer: "Chidi Nwosu",
    phone: "+2348022220002",
    preview: "Can you hold the linen shirt in olive?",
    channel: "WhatsApp" as const,
    waiting: "3m",
    unread: 2,
  },
  {
    id: "c2",
    customer: "Ada Eze",
    phone: "+2348012120012",
    preview: "Just paid via transfer — screenshot coming",
    channel: "WhatsApp" as const,
    waiting: "8m",
    unread: 1,
  },
  {
    id: "c3",
    customer: "Bisi Adewale",
    phone: "+2348033330003",
    preview: "Where is my package today?",
    channel: "Instagram" as const,
    waiting: "12m",
    unread: 0,
  },
  {
    id: "c4",
    customer: "Kunle Bakare",
    phone: "+2348088880008",
    preview: "Do you have size L in the denim?",
    channel: "WhatsApp" as const,
    waiting: "1m",
    unread: 3,
  },
]

