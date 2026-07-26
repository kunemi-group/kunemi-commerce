import { describe, expect, it } from "vitest"
import { buildPaymentMethodSeries, buildRevenueSeries } from "./analytics"
import type { ApiOrder, ApiPayment } from "./types"

function order(
  partial: Partial<ApiOrder> & Pick<ApiOrder, "id" | "status" | "totalCents" | "createdAt">,
): ApiOrder {
  return {
    customerName: "Test",
    customerPhone: "+234",
    customerEmail: null,
    deliveryAddress: null,
    subtotalCents: partial.totalCents,
    taxCents: 0,
    shippingFeeCents: 0,
    reservedUntil: null,
    ...partial,
  }
}

describe("buildRevenueSeries", () => {
  it("buckets confirmed orders into the last N days", () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const series = buildRevenueSeries(
      [
        order({
          id: "1",
          status: "paid",
          totalCents: 15_000_000, // ₦150,000
          createdAt: today.toISOString(),
        }),
        order({
          id: "2",
          status: "pending",
          totalCents: 9_900_000,
          createdAt: today.toISOString(),
        }),
      ],
      3,
    )
    expect(series).toHaveLength(3)
    const last = series[series.length - 1]
    expect(last.orders).toBe(1)
    expect(last.revenue).toBe(150_000)
  })
})

describe("buildPaymentMethodSeries", () => {
  it("counts bank transfers", () => {
    const payments: ApiPayment[] = [
      {
        id: "p1",
        orderId: "o1",
        method: "bank_transfer",
        status: "verified",
        amountCents: 1000,
        reference: "R1",
        paymentToken: "t",
        paymentUrl: "/pay/t",
        claimedAt: new Date().toISOString(),
        customerNote: null,
        hasProof: false,
        proofFilename: null,
        proofUrl: null,
        rejectReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    const series = buildPaymentMethodSeries(payments)
    expect(series[0]?.method).toBe("Bank transfer")
    expect(series[0]?.value).toBe(1)
  })
})
