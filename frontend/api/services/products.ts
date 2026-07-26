import { apiClient, toApiError } from "../client"
import type { ApiProduct } from "../types"

export async function listProducts() {
  try {
    const { data } = await apiClient.get<{ products: ApiProduct[] }>("/products")
    return data.products ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function restockVariant(variantId: string, delta: number) {
  try {
    const { data } = await apiClient.post(
      `/variants/${variantId}/restock`,
      { delta },
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function createProduct(payload: {
  name: string
  description?: string
  variant?: {
    sku?: string
    priceCents: number
    stockOnHand?: number
    taxExempt?: boolean
    lowStockThreshold?: number
    attributes?: Record<string, string>
  }
}) {
  try {
    const { data } = await apiClient.post<ApiProduct>("/products", payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}
