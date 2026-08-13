import type { ApiOrder, ApiPayment } from "./types"
import { minorToMajor } from "./format"

const CONFIRMED = new Set(["paid", "shipped", "delivered"])

/** Local YYYY-MM-DD (avoids UTC day-shift vs merchant timezone). */
function localDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Last N calendar days of confirmed revenue (major units) + order counts. */
export function buildRevenueSeries(
  orders: ApiOrder[],
  days = 14,
  currency = "NGN",
): Array<{ date: string; revenue: number; orders: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets = new Map<string, { revenue: number; orders: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
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
    const label = d.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    })
    return { date: label, revenue: v.revenue, orders: v.orders }
  })
}

/** Count payments by method for confirmed (verified) or all known methods. */
export function buildPaymentMethodSeries(
  payments: ApiPayment[],
): Array<{ method: string; value: number; fill: string }> {
  let bank = 0
  let other = 0
  for (const p of payments) {
    // Count claimed + verified as "used" payment paths; skip pure pending creates if desired
    if (p.status === "pending" && !p.claimedAt) continue
    const m = (p.method || "").toLowerCase()
    if (m.includes("bank") || m.includes("transfer") || m.includes("manual")) {
      bank += 1
    } else {
      other += 1
    }
  }
  // If nothing activity-based, fall back to all payments
  if (bank + other === 0) {
    for (const p of payments) {
      const m = (p.method || "").toLowerCase()
      if (m.includes("bank") || m.includes("transfer") || m.includes("manual")) {
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
