/** Client cart for a single-business Workspace storefront (localStorage). */

export type StoreCartLine = {
  productId: string
  productName: string
  variantId: string
  variantLabel: string
  priceCents: number
  quantity: number
  imageUrl: string | null
  taxExempt: boolean
}

function storageKey(slug: string) {
  return `kunemi-store-cart:${slug}`
}

export function loadStoreCart(slug: string): StoreCartLine[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(storageKey(slug))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoreCartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoreCart(slug: string, lines: StoreCartLine[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(lines))
  } catch {
    /* ignore */
  }
}

export function clearStoreCart(slug: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(storageKey(slug))
  } catch {
    /* ignore */
  }
}

export function cartCount(lines: StoreCartLine[]) {
  return lines.reduce((s, l) => s + l.quantity, 0)
}

export function cartSubtotalCents(lines: StoreCartLine[]) {
  return lines.reduce((s, l) => s + l.priceCents * l.quantity, 0)
}

export function checkoutIdempotencyKey(slug: string) {
  const key = `kunemi-store-checkout-key:${slug}`
  if (typeof window === "undefined") return `chk_${Date.now()}`
  try {
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const next = `chk_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`
    sessionStorage.setItem(key, next)
    return next
  } catch {
    return `chk_${Date.now()}`
  }
}

export function clearCheckoutIdempotencyKey(slug: string) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(`kunemi-store-checkout-key:${slug}`)
  } catch {
    /* ignore */
  }
}
