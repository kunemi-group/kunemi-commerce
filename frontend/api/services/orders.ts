import { apiClient, toApiError } from "../client"
import type { ApiOrder, CreateOrderPayload } from "../types"

export async function listOrders() {
  try {
    const { data } = await apiClient.get<{ orders: ApiOrder[] }>("/orders")
    return data.orders ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function getOrder(id: string) {
  try {
    const { data } = await apiClient.get<ApiOrder>(`/orders/${id}`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function createOrder(payload: CreateOrderPayload) {
  try {
    const { data } = await apiClient.post<ApiOrder>("/orders", payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function cancelOrder(id: string) {
  try {
    const { data } = await apiClient.patch<{ id: string; status: string }>(
      `/orders/${id}/cancel`,
      {},
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function markOrderPaid(id: string) {
  try {
    const { data } = await apiClient.patch(`/orders/${id}/mark-paid`, {})
    return data
  } catch (e) {
    throw toApiError(e)
  }
}
