import { apiClient, toApiError } from "../client"
import type {
  PublicStore,
  PublicStoreProduct,
  StoreCheckoutPayload,
  StoreCheckoutResult,
} from "../types"

export async function fetchPublicStore(slug: string) {
  try {
    const { data } = await apiClient.get<PublicStore>(`/store/${slug}`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function fetchPublicStoreProducts(slug: string) {
  try {
    const { data } = await apiClient.get<{
      store: PublicStore
      products: PublicStoreProduct[]
    }>(`/store/${slug}/products`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function fetchPublicStoreProduct(slug: string, productId: string) {
  try {
    const { data } = await apiClient.get<{
      store: PublicStore
      product: PublicStoreProduct
    }>(`/store/${slug}/products/${productId}`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function checkoutPublicStore(
  slug: string,
  payload: StoreCheckoutPayload,
) {
  try {
    const { data } = await apiClient.post<StoreCheckoutResult>(
      `/store/${slug}/checkout`,
      payload,
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}
