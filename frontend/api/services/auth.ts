import { apiClient, setStoredToken, toApiError } from "../client"
import type {
  AuthMeResponse,
  BusinessProfile,
  TokenResponse,
} from "../types"

export async function loginRequest(email: string, password: string) {
  try {
    const { data } = await apiClient.post<TokenResponse>("/auth/login", {
      email,
      password,
    })
    setStoredToken(data.accessToken)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function registerRequest(input: {
  businessName: string
  fullName: string
  email: string
  password: string
  whatsappNumber?: string
}) {
  try {
    const { data } = await apiClient.post<TokenResponse>("/auth/register", input)
    setStoredToken(data.accessToken)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function fetchMe() {
  try {
    const { data } = await apiClient.get<AuthMeResponse>("/auth/me")
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function updateBusinessRequest(patch: Record<string, unknown>) {
  try {
    const { data } = await apiClient.patch<BusinessProfile>(
      "/businesses/me",
      patch,
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export function logoutLocal() {
  setStoredToken(null)
}
