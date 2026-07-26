/** Browser-side API helper for ShopFlow Nest backend */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api"

function errorMessage(body: unknown, status: number): string {
  const msg = (body as { message?: string | string[] })?.message
  if (Array.isArray(msg)) return msg.join(", ")
  if (typeof msg === "string") return msg
  return `Request failed (${status})`
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(errorMessage(body, res.status))
  }
  return res.json() as Promise<T>
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errorMessage(errBody, res.status))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function formatNgn(cents: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function shortId(uuid: string) {
  return `#${uuid.replace(/-/g, "").slice(0, 6).toUpperCase()}`
}

export function minutesLeft(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / 60000)
}

export function relativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 48) return `${hr}h ago`
  return new Date(iso).toLocaleDateString()
}

// ── API shapes ─────────────────────────────────────────────────────────────

export type ApiOrderStatus =
  | "pending"
  | "payment_review"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired"

export type ApiOrder = {
  id: string
  status: ApiOrderStatus
  customerName: string
  customerPhone: string
  customerEmail: string | null
  deliveryAddress: string | null
  subtotalCents: number
  taxCents: number
  shippingFeeCents: number
  totalCents: number
  reservedUntil: string | null
  createdAt: string
  items?: Array<{
    id: string
    variantId: string | null
    description: string
    quantity: number
    unitPriceCents: number
    taxExempt: boolean
  }>
  payment?: {
    id: string
    method: string
    status: string
    reference: string
    paymentToken: string
    paymentUrl: string
    amountCents: number
    claimedAt?: string | null
    hasProof?: boolean
  } | null
  delivery?: {
    id: string
    status: string
    fulfillmentMode: string
    provider: string | null
    trackingToken: string
    trackingPath: string
    externalTrackingUrl: string | null
  } | null
  statusHistory?: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    reason: string | null
    createdAt: string
  }>
}

export type ApiProduct = {
  id: string
  name: string
  description: string | null
  variants: Array<{
    id: string
    productId?: string
    sku: string | null
    attributes: Record<string, string> | null
    priceCents: number
    stockOnHand: number
    stockReserved: number
    available: number
    taxExempt: boolean
    lowStockThreshold: number
  }>
}

export type ApiDelivery = {
  id: string
  orderId: string
  fulfillmentMode: "manual" | "api_integrated"
  provider: string | null
  trackingToken: string
  trackingPath: string
  status: string
  externalTrackingUrl: string | null
  externalCourierName: string | null
  createdAt: string
  updatedAt: string
  order?: {
    id: string
    status: string
    customerName: string
    customerPhone: string
    deliveryAddress: string | null
  }
  events?: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    note: string | null
    createdAt: string
  }>
}

export type ApiTeamMember = {
  id: string
  email: string
  fullName: string
  role: string
  createdAt: string
}

export type PublicPayResponse = {
  token: string
  method: string
  paymentStatus: string
  orderStatus: string
  reference: string
  amountCents: number
  currency: string
  paymentDueAt: string | null
  secondsRemaining: number | null
  expired: boolean
  canClaim: boolean
  underReview: boolean
  paid: boolean
  rejectReason: string | null
  business: {
    name: string
    whatsapp: string | null
    bankName: string | null
    bankAccountName: string | null
    bankAccountNumber: string | null
  }
  order: {
    id: string
    customerName: string
    customerPhone: string
    deliveryAddress: string | null
    subtotalCents: number
    taxCents: number
    shippingFeeCents: number
    totalCents: number
    items: Array<{
      description: string
      quantity: number
      unitPriceCents: number
    }>
  }
  instructions: string[]
}

export type PublicTrackResponse = {
  token: string
  status: string
  fulfillmentMode: string
  provider: string | null
  externalTrackingUrl: string | null
  externalCourierName: string | null
  businessName: string
  businessWhatsapp: string | null
  orderId: string
  customerName: string | null
  deliveryAddress: string | null
  items: Array<{ name: string; qty: number; unitPriceCents: number }>
  timeline: Array<{
    label: string
    at: string | null
    note: string | null
    done: boolean
  }>
  eta: string
}

/** Flatten products → inventory rows for tables / order drawer */
export function flattenInventory(products: ApiProduct[]) {
  const rows: Array<{
    id: string
    productId: string
    product: string
    variant: string
    sku: string
    category: string
    price: string
    priceCents: number
    onHand: number
    reserved: number
    threshold: number
    taxExempt: boolean
  }> = []
  for (const p of products) {
    for (const v of p.variants ?? []) {
      const attrs = v.attributes
        ? Object.values(v.attributes).join(" / ")
        : "Default"
      rows.push({
        id: v.id,
        productId: p.id,
        product: p.name,
        variant: attrs,
        sku: v.sku || v.id.slice(0, 8).toUpperCase(),
        category: "Catalog",
        price: formatNgn(v.priceCents),
        priceCents: v.priceCents,
        onHand: v.stockOnHand,
        reserved: v.stockReserved,
        threshold: v.lowStockThreshold,
        taxExempt: v.taxExempt,
      })
    }
  }
  return rows
}
