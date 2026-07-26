import { apiClient, toApiError } from "../client"
import type { ApiDelivery, PublicTrackResponse } from "../types"

export async function listDeliveries() {
  try {
    const { data } = await apiClient.get<{ deliveries: ApiDelivery[] }>(
      "/deliveries",
    )
    return data.deliveries ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function createDelivery(payload: {
  orderId: string
  fulfillmentMode: "manual" | "api_integrated"
  provider?: string
  externalTrackingUrl?: string
  externalCourierName?: string
}) {
  try {
    const { data } = await apiClient.post<ApiDelivery>("/deliveries", payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function updateDeliveryStatus(
  id: string,
  payload: { status: string; note?: string },
) {
  try {
    const { data } = await apiClient.patch<ApiDelivery>(
      `/deliveries/${id}/status`,
      payload,
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function getPublicTracking(token: string) {
  try {
    const { data } = await apiClient.get<PublicTrackResponse>(
      `/tracking/${token}`,
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}
