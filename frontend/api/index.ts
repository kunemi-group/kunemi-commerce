/** Kunemi Workspace API layer — Axios + TanStack Query */

export {
  apiClient,
  API_BASE,
  TOKEN_KEY,
  getStoredToken,
  setStoredToken,
  getApiErrorMessage,
  toApiError,
} from "./client"
export { queryKeys } from "./keys"
export { getQueryClient, makeQueryClient } from "./query-client"
export * from "./types"
export * from "./format"
export * from "./analytics"

export * from "./services/auth"
export * from "./services/orders"
export * from "./services/products"
export * from "./services/payments"
export * from "./services/deliveries"
export * from "./services/team"
export * from "./services/documents"

export * from "./hooks/use-orders"
export * from "./hooks/use-products"
export * from "./hooks/use-payments"
export * from "./hooks/use-deliveries"
export * from "./hooks/use-team"
export * from "./hooks/use-documents"
export * from "./document-map"
