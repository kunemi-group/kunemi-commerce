import { describe, expect, it } from "vitest"
import {
  formatMoney,
  formatNgn,
  shortId,
  minutesLeft,
  flattenInventory,
} from "./format"
import type { ApiProduct } from "./types"

describe("formatMoney", () => {
  it("formats minor units for multiple currencies", () => {
    expect(formatMoney(15_000, "NGN")).toMatch(/150/)
    expect(formatMoney(1_500_000, "NGN")).toMatch(/15/)
    expect(formatMoney(1999, "USD")).toMatch(/19/)
    expect(formatMoney(0, "EUR")).toMatch(/0/)
  })

  it("formatNgn remains a NGN convenience alias", () => {
    expect(formatNgn(15_000)).toMatch(/150/)
  })
})

describe("shortId", () => {
  it("shortens a uuid for display", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    expect(shortId(id)).toBe("#A1B2C3")
  })
})

describe("minutesLeft", () => {
  it("returns undefined for null", () => {
    expect(minutesLeft(null)).toBeUndefined()
  })

  it("returns 0 when past due", () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(minutesLeft(past)).toBe(0)
  })

  it("returns positive minutes when future", () => {
    const future = new Date(Date.now() + 5 * 60_000).toISOString()
    const m = minutesLeft(future)
    expect(m).toBeGreaterThanOrEqual(4)
    expect(m).toBeLessThanOrEqual(6)
  })
})

describe("flattenInventory", () => {
  it("flattens products into variant rows", () => {
    const products: ApiProduct[] = [
      {
        id: "p1",
        name: "Ankara Dress",
        description: null,
        variants: [
          {
            id: "v1",
            sku: "AD-M",
            attributes: { size: "M" },
            priceCents: 12000,
            stockOnHand: 10,
            stockReserved: 2,
            available: 8,
            taxExempt: false,
            lowStockThreshold: 3,
          },
        ],
      },
    ]
    const rows = flattenInventory(products)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe("v1")
    expect(rows[0].product).toBe("Ankara Dress")
    expect(rows[0].variant).toBe("M")
    expect(rows[0].onHand).toBe(10)
    expect(rows[0].reserved).toBe(2)
  })
})
