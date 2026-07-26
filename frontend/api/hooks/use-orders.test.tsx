import { describe, expect, it, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useOrders } from "./use-orders"
import * as ordersApi from "../services/orders"

vi.mock("../services/orders", () => ({
  listOrders: vi.fn(),
  getOrder: vi.fn(),
  createOrder: vi.fn(),
  cancelOrder: vi.fn(),
}))

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe("useOrders", () => {
  beforeEach(() => {
    vi.mocked(ordersApi.listOrders).mockReset()
  })

  it("loads orders via TanStack Query", async () => {
    vi.mocked(ordersApi.listOrders).mockResolvedValue([
      {
        id: "ord-1",
        status: "pending",
        customerName: "Ada",
        customerPhone: "+234",
        customerEmail: null,
        deliveryAddress: null,
        subtotalCents: 1000,
        taxCents: 0,
        shippingFeeCents: 0,
        totalCents: 1000,
        reservedUntil: null,
        createdAt: new Date().toISOString(),
      },
    ])

    const { result } = renderHook(() => useOrders(true), {
      wrapper: wrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].customerName).toBe("Ada")
    expect(ordersApi.listOrders).toHaveBeenCalledOnce()
  })
})
