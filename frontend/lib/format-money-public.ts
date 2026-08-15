/** Public storefront money format (no auth / business context). */
export function formatPublicMoney(
  amountMinor: number,
  currency = "NGN",
  locale?: string,
) {
  const c = (currency || "NGN").trim().toUpperCase() || "NGN"
  const zeroDecimal = new Set([
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
  const digits = zeroDecimal.has(c) ? 0 : 2
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
