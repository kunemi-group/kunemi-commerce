import type { ApiProduct } from "./types"

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
