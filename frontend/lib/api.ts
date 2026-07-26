/**
 * @deprecated Import from `@/api` instead.
 * Re-exports kept so existing screens keep working during migration.
 */
export {
  API_BASE,
  formatNgn,
  shortId,
  minutesLeft,
  relativeTime,
  flattenInventory,
  type ApiOrder,
  type ApiOrderStatus,
  type ApiProduct,
  type ApiDelivery,
  type ApiTeamMember,
  type PublicPayResponse,
  type PublicTrackResponse,
} from "@/api"

import { apiClient, toApiError } from "@/api/client"

/** Legacy fetch-style helpers — prefer axios services in `@/api/services` */
export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  try {
    const { data } = await apiClient.get<T>(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
  token?: string | null,
): Promise<T> {
  try {
    const { data } = await apiClient.request<T>({
      url: path,
      method,
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    return data
  } catch (e) {
    throw toApiError(e)
  }
}
