import type { ApiProduct } from "./types"

/** ISO currencies we surface in Workspace settings (global product). */
export const SUPPORTED_CURRENCIES = [
  "NGN",
  "USD",
  "GBP",
  "EUR",
  "GHS",
  "KES",
  "ZAR",
  "XOF",
  "XAF",
  "CAD",
  "AUD",
  "INR",
] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
])

export function normalizeCurrency(code?: string | null): string {
  const c = (code || "NGN").trim().toUpperCase()
  return /^[A-Z]{3}$/.test(c) ? c : "NGN"
}

export function currencyFractionDigits(currency: string): number {
  return ZERO_DECIMAL.has(normalizeCurrency(currency)) ? 0 : 2
}

/**
 * Format integer minor units (cents/kobo) in any ISO currency.
 */
export function formatMoney(
  amountMinor: number,
  currency: string = "NGN",
  locale?: string,
) {
  const c = normalizeCurrency(currency)
  const digits = currencyFractionDigits(c)
  const major = amountMinor / Math.pow(10, digits)
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: digits,
      minimumFractionDigits: digits === 0 ? 0 : undefined,
    }).format(major)
  } catch {
    return `${c} ${major.toFixed(digits)}`
  }
}

/** Format major units (user-entered shipping/price fields). */
export function formatMajor(
  amountMajor: number,
  currency: string = "NGN",
  locale?: string,
) {
  const c = normalizeCurrency(currency)
  const digits = currencyFractionDigits(c)
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(amountMajor)
  } catch {
    return `${c} ${amountMajor.toFixed(digits)}`
  }
}

/** Convert major → minor for API payloads */
export function majorToMinor(amountMajor: number, currency: string = "NGN") {
  const d = currencyFractionDigits(currency)
  return Math.round(amountMajor * Math.pow(10, d))
}

/** Convert minor → major for form fields */
export function minorToMajor(amountMinor: number, currency: string = "NGN") {
  const d = currencyFractionDigits(currency)
  return amountMinor / Math.pow(10, d)
}

/** @deprecated Use formatMoney(cents, currency) or useMoney().format */
export function formatNgn(cents: number) {
  return formatMoney(cents, "NGN")
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

/** Flatten products → inventory rows for tables / order drawer */
export function flattenInventory(
  products: ApiProduct[],
  currency: string = "NGN",
) {
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
        price: formatMoney(v.priceCents, currency),
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
