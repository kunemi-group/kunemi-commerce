import { describe, expect, it } from "vitest"
import {
  buildInsightsMoney,
  buildOrdersFunnel,
  buildPaymentHealth,
  buildPaymentMethodSeries,
  buildRevenueSeries,
  buildStockRisk,
  buildTopProducts,
  resolveInsightsPeriod,
} from "./analytics"
import type { ApiOrder, ApiPayment, ApiProduct } from "./types"

function order(
  partial: Partial<ApiOrder> &
    Pick<ApiOrder, "id" | "status" | "totalCents" | "createdAt">,
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

function payment(
  partial: Partial<ApiPayment> &
    Pick<ApiPayment, "id" | "status" | "amountCents" | "createdAt">,
): ApiPayment {
  return {
    orderId: "o1",
    method: "bank_transfer",
    reference: "R1",
    paymentToken: "t",
    paymentUrl: "/pay/t",
    claimedAt: null,
    customerNote: null,
    hasProof: false,
    proofFilename: null,
    proofUrl: null,
    rejectReason: null,
    updatedAt: partial.createdAt,
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
          totalCents: 15_000_000,
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
      payment({
        id: "p1",
        status: "verified",
        amountCents: 1000,
        claimedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }),
    ]
    const series = buildPaymentMethodSeries(payments)
    expect(series[0]?.method).toBe("Bank transfer")
    expect(series[0]?.value).toBe(1)
  })
})

describe("resolveInsightsPeriod", () => {
  it("builds today / 7d / 30d windows", () => {
    const now = new Date(2026, 7, 15, 15, 0, 0) // Aug 15 local
    const today = resolveInsightsPeriod("today", { now })
    expect(today.days).toBe(1)
    expect(today.label).toBe("Today")

    const week = resolveInsightsPeriod("7d", { now })
    expect(week.days).toBe(7)

    const month = resolveInsightsPeriod("30d", { now })
    expect(month.days).toBe(30)
  })

  it("supports inclusive custom date range", () => {
    const p = resolveInsightsPeriod("custom", {
      customStart: "2026-08-01",
      customEnd: "2026-08-03",
    })
    expect(p.days).toBe(3)
  })
})

describe("insights aggregates", () => {
  const now = new Date(2026, 7, 15, 12, 0, 0)
  const period = resolveInsightsPeriod("7d", { now })

  it("buildInsightsMoney separates gross, collected, outstanding", () => {
    const inPeriod = new Date(2026, 7, 14, 10, 0, 0).toISOString()
    const money = buildInsightsMoney(
      [
        order({
          id: "1",
          status: "paid",
          totalCents: 10_000,
          createdAt: inPeriod,
        }),
        order({
          id: "2",
          status: "pending",
          totalCents: 4_000,
          createdAt: inPeriod,
        }),
        order({
          id: "3",
          status: "payment_review",
          totalCents: 1_000,
          createdAt: inPeriod,
        }),
      ],
      [
        payment({
          id: "p1",
          status: "verified",
          amountCents: 10_000,
          createdAt: inPeriod,
        }),
      ],
      period,
    )
    expect(money.grossSalesCents).toBe(10_000)
    expect(money.collectedCents).toBe(10_000)
    expect(money.outstandingCents).toBe(5_000)
    expect(money.orderCount).toBe(3)
  })

  it("buildOrdersFunnel counts statuses", () => {
    const inPeriod = new Date(2026, 7, 14, 10, 0, 0).toISOString()
    const funnel = buildOrdersFunnel(
      [
        order({ id: "1", status: "paid", totalCents: 1, createdAt: inPeriod }),
        order({
          id: "2",
          status: "delivered",
          totalCents: 1,
          createdAt: inPeriod,
        }),
        order({
          id: "3",
          status: "cancelled",
          totalCents: 1,
          createdAt: inPeriod,
        }),
      ],
      period,
    )
    expect(funnel.created).toBe(3)
    expect(funnel.paid).toBe(1)
    expect(funnel.delivered).toBe(1)
    expect(funnel.cancelled).toBe(1)
  })

  it("buildTopProducts ranks confirmed line items", () => {
    const inPeriod = new Date(2026, 7, 14, 10, 0, 0).toISOString()
    const top = buildTopProducts(
      [
        order({
          id: "1",
          status: "paid",
          totalCents: 30_000,
          createdAt: inPeriod,
          items: [
            {
              id: "i1",
              variantId: "v1",
              description: "Dress",
              quantity: 2,
              unitPriceCents: 10_000,
              taxExempt: false,
            },
            {
              id: "i2",
              variantId: "v2",
              description: "Scarf",
              quantity: 1,
              unitPriceCents: 5_000,
              taxExempt: true,
            },
          ],
        }),
      ],
      period,
      5,
    )
    expect(top[0]?.name).toBe("Dress")
    expect(top[0]?.units).toBe(2)
    expect(top[0]?.revenueCents).toBe(20_000)
  })

  it("buildPaymentHealth computes median verify minutes", () => {
    const inPeriod = new Date(2026, 7, 14, 10, 0, 0).toISOString()
    const claim = new Date(2026, 7, 14, 10, 0, 0).toISOString()
    const health = buildPaymentHealth(
      [
        payment({
          id: "p1",
          status: "verified",
          amountCents: 1000,
          createdAt: inPeriod,
          claimedAt: claim,
          verifiedAt: new Date(2026, 7, 14, 10, 30, 0).toISOString(),
        }),
        payment({
          id: "p2",
          status: "verified",
          amountCents: 1000,
          createdAt: inPeriod,
          claimedAt: claim,
          verifiedAt: new Date(2026, 7, 14, 10, 10, 0).toISOString(),
        }),
        payment({
          id: "p3",
          status: "claimed",
          amountCents: 500,
          createdAt: inPeriod,
          claimedAt: claim,
        }),
        payment({
          id: "p4",
          status: "rejected",
          amountCents: 100,
          createdAt: inPeriod,
        }),
      ],
      period,
    )
    expect(health.verified).toBe(2)
    expect(health.claims).toBe(1)
    expect(health.rejected).toBe(1)
    expect(health.medianVerifyMinutes).toBe(20)
  })

  it("buildStockRisk lists variants at or below threshold", () => {
    const products: ApiProduct[] = [
      {
        id: "p1",
        name: "Dress",
        description: null,
        variants: [
          {
            id: "v1",
            sku: "D-M",
            attributes: { size: "M" },
            priceCents: 1000,
            stockOnHand: 3,
            stockReserved: 1,
            available: 2,
            taxExempt: false,
            lowStockThreshold: 5,
          },
          {
            id: "v2",
            sku: "D-L",
            attributes: { size: "L" },
            priceCents: 1000,
            stockOnHand: 20,
            stockReserved: 0,
            available: 20,
            taxExempt: false,
            lowStockThreshold: 5,
          },
        ],
      },
    ]
    const risk = buildStockRisk(products)
    expect(risk).toHaveLength(1)
    expect(risk[0]?.available).toBe(2)
    expect(risk[0]?.critical).toBe(false)
  })
})
