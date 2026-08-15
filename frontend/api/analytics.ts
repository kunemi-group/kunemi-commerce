import type { ApiOrder, ApiPayment, ApiProduct } from "./types"
import { minorToMajor } from "./format"

const CONFIRMED = new Set(["paid", "shipped", "delivered"])
const OUTSTANDING = new Set(["pending", "payment_review"])

export type InsightsPeriodPreset = "today" | "7d" | "30d" | "custom"

export type InsightsPeriod = {
  preset: InsightsPeriodPreset
  /** Inclusive start (local midnight) */
  start: Date
  /** Exclusive end */
  end: Date
  /** Chart day count (at least 1) */
  days: number
  label: string
}

/** Local YYYY-MM-DD (avoids UTC day-shift vs merchant timezone). */
export function localDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function startOfLocalDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/**
 * Resolve a reporting period in local time.
 * Custom: `customStart`/`customEnd` are `YYYY-MM-DD` inclusive dates.
 */
export function resolveInsightsPeriod(
  preset: InsightsPeriodPreset,
  opts?: { customStart?: string; customEnd?: string; now?: Date },
): InsightsPeriod {
  const now = opts?.now ? new Date(opts.now) : new Date()
  const today = startOfLocalDay(now)
  const tomorrow = addDays(today, 1)

  if (preset === "today") {
    return {
      preset,
      start: today,
      end: tomorrow,
      days: 1,
      label: "Today",
    }
  }

  if (preset === "7d") {
    const start = addDays(today, -6)
    return {
      preset,
      start,
      end: tomorrow,
      days: 7,
      label: "Last 7 days",
    }
  }

  if (preset === "30d") {
    const start = addDays(today, -29)
    return {
      preset,
      start,
      end: tomorrow,
      days: 30,
      label: "Last 30 days",
    }
  }

  // custom
  const startStr = opts?.customStart
  const endStr = opts?.customEnd
  let start = today
  let end = tomorrow
  if (startStr && /^\d{4}-\d{2}-\d{2}$/.test(startStr)) {
    const [y, m, d] = startStr.split("-").map(Number)
    start = new Date(y, m - 1, d, 0, 0, 0, 0)
  }
  if (endStr && /^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
    const [y, m, d] = endStr.split("-").map(Number)
    end = addDays(new Date(y, m - 1, d, 0, 0, 0, 0), 1)
  }
  if (end <= start) {
    end = addDays(start, 1)
  }
  const ms = end.getTime() - start.getTime()
  const days = Math.max(1, Math.round(ms / 86_400_000))
  return {
    preset: "custom",
    start,
    end,
    days,
    label: `${localDateKey(start)} → ${localDateKey(addDays(end, -1))}`,
  }
}

export function inPeriod(
  iso: string | Date | null | undefined,
  period: InsightsPeriod,
) {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= period.start.getTime() && t < period.end.getTime()
}

export function filterOrdersByPeriod(
  orders: ApiOrder[],
  period: InsightsPeriod,
) {
  return orders.filter((o) => inPeriod(o.createdAt, period))
}

export function filterPaymentsByPeriod(
  payments: ApiPayment[],
  period: InsightsPeriod,
) {
  return payments.filter((p) => inPeriod(p.createdAt, period))
}

export type InsightsMoney = {
  /** Confirmed orders total (paid/shipped/delivered) */
  grossSalesCents: number
  /** Verified payment amounts in period */
  collectedCents: number
  /** Pending + payment_review order totals */
  outstandingCents: number
  orderCount: number
  confirmedOrderCount: number
  outstandingOrderCount: number
}

export function buildInsightsMoney(
  orders: ApiOrder[],
  payments: ApiPayment[],
  period: InsightsPeriod,
): InsightsMoney {
  const periodOrders = filterOrdersByPeriod(orders, period)
  const periodPayments = filterPaymentsByPeriod(payments, period)

  let grossSalesCents = 0
  let outstandingCents = 0
  let confirmedOrderCount = 0
  let outstandingOrderCount = 0

  for (const o of periodOrders) {
    if (CONFIRMED.has(o.status)) {
      grossSalesCents += o.totalCents
      confirmedOrderCount += 1
    } else if (OUTSTANDING.has(o.status)) {
      outstandingCents += o.totalCents
      outstandingOrderCount += 1
    }
  }

  let collectedCents = 0
  for (const p of periodPayments) {
    if (p.status === "verified") {
      collectedCents += p.amountCents
    }
  }

  return {
    grossSalesCents,
    collectedCents,
    outstandingCents,
    orderCount: periodOrders.length,
    confirmedOrderCount,
    outstandingOrderCount,
  }
}

export type OrdersFunnel = {
  created: number
  paid: number
  shipped: number
  delivered: number
  cancelled: number
  expired: number
  paymentReview: number
  pending: number
}

export function buildOrdersFunnel(
  orders: ApiOrder[],
  period: InsightsPeriod,
): OrdersFunnel {
  const periodOrders = filterOrdersByPeriod(orders, period)
  const funnel: OrdersFunnel = {
    created: periodOrders.length,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    expired: 0,
    paymentReview: 0,
    pending: 0,
  }
  for (const o of periodOrders) {
    switch (o.status) {
      case "paid":
        funnel.paid += 1
        break
      case "shipped":
        funnel.shipped += 1
        break
      case "delivered":
        funnel.delivered += 1
        break
      case "cancelled":
        funnel.cancelled += 1
        break
      case "expired":
        funnel.expired += 1
        break
      case "payment_review":
        funnel.paymentReview += 1
        break
      case "pending":
        funnel.pending += 1
        break
      default:
        break
    }
  }
  return funnel
}

export type TopProductRow = {
  key: string
  name: string
  units: number
  revenueCents: number
}

/** Top lines from confirmed orders in period (by revenue). */
export function buildTopProducts(
  orders: ApiOrder[],
  period: InsightsPeriod,
  limit = 8,
): TopProductRow[] {
  const map = new Map<string, TopProductRow>()
  for (const o of filterOrdersByPeriod(orders, period)) {
    if (!CONFIRMED.has(o.status)) continue
    for (const item of o.items ?? []) {
      const name = item.description?.trim() || "Item"
      const key = item.variantId || name
      const prev = map.get(key) ?? {
        key,
        name,
        units: 0,
        revenueCents: 0,
      }
      prev.units += item.quantity
      prev.revenueCents += item.unitPriceCents * item.quantity
      map.set(key, prev)
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenueCents - a.revenueCents || b.units - a.units)
    .slice(0, limit)
}

export type PaymentHealth = {
  claims: number
  verified: number
  rejected: number
  awaiting: number
  /** Median minutes claim → verified; null if insufficient data */
  medianVerifyMinutes: number | null
}

export function buildPaymentHealth(
  payments: ApiPayment[],
  period: InsightsPeriod,
): PaymentHealth {
  const periodPayments = filterPaymentsByPeriod(payments, period)
  let claims = 0
  let verified = 0
  let rejected = 0
  let awaiting = 0
  const verifyMinutes: number[] = []

  for (const p of periodPayments) {
    const status = (p.status || "").toLowerCase()
    if (status === "claimed") claims += 1
    else if (status === "verified") verified += 1
    else if (status === "rejected") rejected += 1
    else if (
      status === "awaiting_transfer" ||
      status === "pending" ||
      status === "awaiting_payment"
    ) {
      awaiting += 1
    }

    if (status === "verified" && p.claimedAt && p.verifiedAt) {
      const mins =
        (new Date(p.verifiedAt).getTime() - new Date(p.claimedAt).getTime()) /
        60_000
      if (Number.isFinite(mins) && mins >= 0) verifyMinutes.push(mins)
    }
  }

  verifyMinutes.sort((a, b) => a - b)
  let medianVerifyMinutes: number | null = null
  if (verifyMinutes.length > 0) {
    const mid = Math.floor(verifyMinutes.length / 2)
    medianVerifyMinutes =
      verifyMinutes.length % 2 === 1
        ? verifyMinutes[mid]
        : (verifyMinutes[mid - 1] + verifyMinutes[mid]) / 2
    medianVerifyMinutes = Math.round(medianVerifyMinutes)
  }

  return { claims, verified, rejected, awaiting, medianVerifyMinutes }
}

export type StockRiskRow = {
  id: string
  product: string
  variant: string
  available: number
  threshold: number
  critical: boolean
}

export function buildStockRisk(
  products: ApiProduct[],
  limit = 8,
): StockRiskRow[] {
  const rows: StockRiskRow[] = []
  for (const p of products) {
    for (const v of p.variants ?? []) {
      const available = v.available ?? v.stockOnHand - v.stockReserved
      const threshold = v.lowStockThreshold ?? 0
      if (available <= threshold) {
        const attrs = v.attributes
          ? Object.values(v.attributes).join(" / ")
          : "Default"
        rows.push({
          id: v.id,
          product: p.name,
          variant: attrs,
          available,
          threshold,
          critical: available <= 1,
        })
      }
    }
  }
  return rows
    .sort((a, b) => a.available - b.available || a.threshold - b.threshold)
    .slice(0, limit)
}

/** Last N calendar days of confirmed revenue (major units) + order counts. */
export function buildRevenueSeries(
  orders: ApiOrder[],
  days = 14,
  currency = "NGN",
  opts?: { end?: Date },
): Array<{ date: string; revenue: number; orders: number }> {
  const today = startOfLocalDay(opts?.end ?? new Date())
  // series ends on the day before exclusive end if end is tomorrow-style — default: include today
  const endDay = today

  const buckets = new Map<string, { revenue: number; orders: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(endDay, -i)
    buckets.set(localDateKey(d), { revenue: 0, orders: 0 })
  }

  for (const o of orders) {
    if (!CONFIRMED.has(o.status)) continue
    const key = localDateKey(new Date(o.createdAt))
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.revenue += minorToMajor(o.totalCents, currency)
    bucket.orders += 1
  }

  return Array.from(buckets.entries()).map(([iso, v]) => {
    const [y, m, day] = iso.split("-").map(Number)
    const d = new Date(y, m - 1, day, 12)
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
    return { date: label, revenue: v.revenue, orders: v.orders }
  })
}

/** Revenue series aligned to an Insights period. */
export function buildRevenueSeriesForPeriod(
  orders: ApiOrder[],
  period: InsightsPeriod,
  currency = "NGN",
) {
  const endDay = startOfLocalDay(addDays(period.end, -1))
  return buildRevenueSeries(orders, period.days, currency, { end: endDay })
}

/** Count payments by method for confirmed (verified) or all known methods. */
export function buildPaymentMethodSeries(
  payments: ApiPayment[],
): Array<{ method: string; value: number; fill: string }> {
  let bank = 0
  let other = 0
  for (const p of payments) {
    if (p.status === "pending" && !p.claimedAt) continue
    const m = (p.method || "").toLowerCase()
    if (m.includes("bank") || m.includes("transfer") || m.includes("manual")) {
      bank += 1
    } else {
      other += 1
    }
  }
  if (bank + other === 0) {
    for (const p of payments) {
      const m = (p.method || "").toLowerCase()
      if (
        m.includes("bank") ||
        m.includes("transfer") ||
        m.includes("manual")
      ) {
        bank += 1
      } else {
        other += 1
      }
    }
  }

  const rows: Array<{ method: string; value: number; fill: string }> = []
  if (bank > 0 || other === 0) {
    rows.push({
      method: "Bank transfer",
      value: bank,
      fill: "var(--color-bank)",
    })
  }
  if (other > 0) {
    rows.push({
      method: "Other",
      value: other,
      fill: "var(--color-other)",
    })
  }
  if (rows.length === 0) {
    rows.push({
      method: "Bank transfer",
      value: 0,
      fill: "var(--color-bank)",
    })
  }
  return rows
}
