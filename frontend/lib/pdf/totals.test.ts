import { describe, expect, it } from "vitest"
import { computeDocTotals } from "./totals"

describe("computeDocTotals", () => {
  it("applies VAT only to taxable products, never shipping", () => {
    const t = computeDocTotals({
      lines: [
        { name: "Dress", qty: 1, unitPrice: "₦10,000", taxExempt: false },
        { name: "Headwrap", qty: 1, unitPrice: "₦2,000", taxExempt: true },
      ],
      shippingFee: 1500,
      taxEnabled: true,
      taxRatePercent: 7.5,
      taxLabel: "VAT",
    })
    expect(t.subtotal).toBe(12000)
    expect(t.taxableSubtotal).toBe(10000)
    expect(t.exemptSubtotal).toBe(2000)
    expect(t.shipping).toBe(1500)
    expect(t.tax).toBe(750) // 7.5% of 10000
    expect(t.total).toBe(12000 + 1500 + 750)
  })

  it("skips tax when disabled", () => {
    const t = computeDocTotals({
      lines: [{ name: "Item", qty: 2, unitPrice: "₦1,000", taxExempt: false }],
      shippingFee: 500,
      taxEnabled: false,
      taxRatePercent: 7.5,
      taxLabel: "VAT",
    })
    expect(t.tax).toBe(0)
    expect(t.total).toBe(2500)
  })
})
