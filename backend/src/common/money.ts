/**
 * Order totals — mirrors frontend/lib/pdf/totals.ts product rules:
 * - VAT only on non–tax-exempt product lines
 * - Shipping never in VAT base
 */
export type OrderLineInput = {
  unitPriceCents: number;
  quantity: number;
  taxExempt?: boolean;
};

export type OrderTotals = {
  subtotalCents: number;
  taxableSubtotalCents: number;
  exemptSubtotalCents: number;
  shippingFeeCents: number;
  taxCents: number;
  totalCents: number;
};

export function computeOrderTotals(opts: {
  lines: OrderLineInput[];
  shippingFeeCents?: number;
  taxEnabled: boolean;
  taxRatePercent: number;
}): OrderTotals {
  let subtotalCents = 0;
  let taxableSubtotalCents = 0;
  let exemptSubtotalCents = 0;

  for (const line of opts.lines) {
    const lineTotal = line.unitPriceCents * line.quantity;
    subtotalCents += lineTotal;
    if (line.taxExempt) {
      exemptSubtotalCents += lineTotal;
    } else {
      taxableSubtotalCents += lineTotal;
    }
  }

  const shippingFeeCents = Math.max(0, opts.shippingFeeCents ?? 0);
  const taxCents =
    opts.taxEnabled && opts.taxRatePercent > 0 && taxableSubtotalCents > 0
      ? Math.round(taxableSubtotalCents * (opts.taxRatePercent / 100))
      : 0;

  return {
    subtotalCents,
    taxableSubtotalCents,
    exemptSubtotalCents,
    shippingFeeCents,
    taxCents,
    totalCents: subtotalCents + shippingFeeCents + taxCents,
  };
}
