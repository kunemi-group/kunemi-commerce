/** Parse display money like ₦18,500 / $19.99 / — into a major-unit number. */
export function parseMoney(value: string): number {
  if (!value || value === "—" || value === "-") return 0
  const n = Number(value.replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

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

function fractionDigits(currency: string): number {
  const c = (currency || "NGN").toUpperCase()
  return ZERO_DECIMAL.has(c) ? 0 : 2
}

/**
 * Format a major-unit amount for PDF lines and form totals.
 * Currency is ISO 4217 (default NGN for legacy mocks only).
 */
export function formatMoney(amountMajor: number, currency: string = "NGN"): string {
  const c = (currency || "NGN").trim().toUpperCase() || "NGN"
  const digits = fractionDigits(c)
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(amountMajor)
  } catch {
    return `${c} ${amountMajor.toFixed(digits)}`
  }
}

export function lineTotal(qty: number, unitPrice: string): number {
  return qty * parseMoney(unitPrice)
}
