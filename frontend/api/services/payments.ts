import { apiClient, toApiError } from "../client"
import type { ApiPayment, PublicPayResponse } from "../types"

export async function listPayments() {
  try {
    const { data } = await apiClient.get<{ payments: ApiPayment[] }>("/payments")
    return data.payments ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function verifyPayment(id: string, note?: string) {
  try {
    const { data } = await apiClient.patch(`/payments/${id}/verify`, { note })
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function rejectPayment(id: string, reason?: string) {
  try {
    const { data } = await apiClient.patch(`/payments/${id}/reject`, { reason })
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function getPublicPay(token: string) {
  try {
    const { data } = await apiClient.get<PublicPayResponse>(`/pay/${token}`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function claimPayment(
  token: string,
  body: {
    customerNote?: string
    proofFilename?: string
    proofMimeType?: string
    proofBase64?: string
  },
) {
  try {
    const { data } = await apiClient.post(`/pay/${token}/claim`, body)
    return data as { ok: boolean; message: string }
  } catch (e) {
    throw toApiError(e)
  }
}
