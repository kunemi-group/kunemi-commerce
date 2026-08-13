import type { QuoteLine } from "@/lib/data"
import { formatMoney, lineTotal, parseMoney } from "@/lib/pdf/money"

export type DocTotals = {
  /** All merchandise (taxable + exempt products) */
  subtotal: number
  taxableSubtotal: number
  exemptSubtotal: number
  shipping: number
  /** Base amount VAT is applied to = taxable products only (never shipping) */
  vatBase: number
  tax: number
  total: number
  paid: number
  balance: number
  subtotalLabel: string
  taxableLabel: string
  exemptLabel: string
  shippingLabel: string
  taxAmountLabel: string
  taxName: string
  totalLabel: string
  paidLabel: string
  balanceLabel: string
  hasExemptLines: boolean
  hasShipping: boolean
}

export function taxDisplayName(label: string, rate: number, enabled: boolean): string {
  if (!enabled || rate <= 0) return "Tax"
  return `${label} (${rate}%)`
}

/**
 * Automatic VAT from settings rate.
 * - VAT applies only to taxable product lines
 * - Tax-free product lines are excluded
 * - Shipping is never included in the VAT base
 */
export function computeDocTotals(opts: {
  lines: QuoteLine[]
  statedTotal?: string
  shippingFee?: number | string
  taxEnabled: boolean
  taxRatePercent: number
  taxLabel: string
  amountPaid?: string
  /** ISO currency for labels (default NGN) */
  currency?: string
}): DocTotals {
  const currency = opts.currency ?? "NGN"
  let merchandise = 0
  let taxable = 0
  let exempt = 0
  let hasExemptLines = false

  for (const line of opts.lines) {
    const amount = lineTotal(line.qty, line.unitPrice)
    merchandise += amount
    if (line.taxExempt) {
      exempt += amount
      hasExemptLines = true
    } else {
      taxable += amount
    }
  }

  if (merchandise === 0 && opts.statedTotal) {
    merchandise = parseMoney(opts.statedTotal)
    taxable = merchandise
  }

  const shipping =
    typeof opts.shippingFee === "number"
      ? opts.shippingFee
      : parseMoney(String(opts.shippingFee ?? "0"))

  // VAT base = taxable products only — shipping is never taxed
  const vatBase = taxable

  const tax =
    opts.taxEnabled && opts.taxRatePercent > 0 && vatBase > 0
      ? Math.round(vatBase * (opts.taxRatePercent / 100))
      : 0

  const total = merchandise + shipping + tax
  const paid = parseMoney(opts.amountPaid ?? "0")
  const balance = Math.max(0, total - paid)

  return {
    subtotal: merchandise,
    taxableSubtotal: taxable,
    exemptSubtotal: exempt,
    shipping,
    vatBase,
    tax,
    total,
    paid,
    balance,
    subtotalLabel: formatMoney(merchandise, currency),
    taxableLabel: formatMoney(taxable, currency),
    exemptLabel: formatMoney(exempt, currency),
    shippingLabel: formatMoney(shipping, currency),
    taxAmountLabel:
      opts.taxEnabled && opts.taxRatePercent > 0
        ? formatMoney(tax, currency)
        : "—",
    taxName: taxDisplayName(opts.taxLabel, opts.taxRatePercent, opts.taxEnabled),
    totalLabel: formatMoney(total, currency),
    paidLabel: formatMoney(paid, currency),
    balanceLabel: formatMoney(balance, currency),
    hasExemptLines,
    hasShipping: shipping > 0,
  }
}
