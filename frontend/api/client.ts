import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api"

/** Axios instance for Kunemi Workspace Nest API */
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30_000,
  withCredentials: true,
})

// Auto refresh interceptor on 401 Unauthorized
let refreshPromise: Promise<void> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (
        !originalRequest.url?.includes("/auth/login") &&
        !originalRequest.url?.includes("/auth/refresh") &&
        !originalRequest.url?.includes("/auth/register")
      ) {
        originalRequest._retry = true
        try {
          refreshPromise ??= axios
            .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null
            })
          await refreshPromise
          return apiClient(originalRequest)
        } catch (refreshErr) {
          return Promise.reject(refreshErr)
        }
      }
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string | string[] }>
    const msg = ax.response?.data?.message
    if (Array.isArray(msg)) return msg.join(", ")
    if (typeof msg === "string") return msg
    if (ax.message) return ax.message
  }
  if (err instanceof Error) return err.message
  return "Request failed"
}

export function toApiError(err: unknown): Error {
  return new Error(getApiErrorMessage(err))
}
