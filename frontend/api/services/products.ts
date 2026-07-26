import { apiClient, toApiError } from "../client"
import type { ApiProduct } from "../types"

export type CreateProductPayload = {
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
}

export type UpdateProductPayload = {
  name?: string
  description?: string | null
}

export type VariantPayload = {
  sku?: string | null
  priceCents?: number
  stockOnHand?: number
  taxExempt?: boolean
  lowStockThreshold?: number
  attributes?: Record<string, string> | null
}

export async function listProducts() {
  try {
    const { data } = await apiClient.get<{ products: ApiProduct[] }>("/products")
    return data.products ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function createProduct(payload: CreateProductPayload) {
  try {
    const { data } = await apiClient.post<ApiProduct>("/products", payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function updateProduct(id: string, payload: UpdateProductPayload) {
  try {
    const { data } = await apiClient.patch<ApiProduct>(`/products/${id}`, payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function deleteProduct(id: string) {
  try {
    const { data } = await apiClient.delete<{ ok: boolean; id: string }>(
      `/products/${id}`,
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function addVariant(
  productId: string,
  payload: {
    sku?: string
    priceCents: number
    stockOnHand?: number
    taxExempt?: boolean
    lowStockThreshold?: number
    attributes?: Record<string, string>
  },
) {
  try {
    const { data } = await apiClient.post(`/products/${productId}/variants`, payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function updateVariant(variantId: string, payload: VariantPayload) {
  try {
    const { data } = await apiClient.patch(`/variants/${variantId}`, payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function restockVariant(variantId: string, delta: number) {
  try {
    const { data } = await apiClient.post(`/variants/${variantId}/restock`, {
      delta,
    })
    return data
  } catch (e) {
    throw toApiError(e)
  }
}
