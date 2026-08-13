import { apiClient, toApiError } from "../client"
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

export async function logoutLocal() {
  try {
    await apiClient.post("/auth/logout")
  } catch {
    /* ignore network errors during logout */
  }
}
