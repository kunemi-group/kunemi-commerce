import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api"

export const TOKEN_KEY = "kunemi_workspace_token"
export const REFRESH_TOKEN_KEY = "kunemi_workspace_refresh_token"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(accessToken: string | null, refreshToken?: string | null) {
  if (typeof window === "undefined") return
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
    else localStorage.removeItem(TOKEN_KEY)

    if (refreshToken !== undefined) {
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      else localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  } catch {
    /* ignore */
  }
}

/** Axios instance for Kunemi Workspace Nest API */
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30_000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto refresh interceptor on 401 Unauthorized
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken()
      if (
        refreshToken &&
        !originalRequest.url?.includes("/auth/login") &&
        !originalRequest.url?.includes("/auth/refresh")
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return apiClient(originalRequest)
            })
            .catch((err) => Promise.reject(err))
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
            `${API_BASE}/auth/refresh`,
            { refreshToken },
          )
          setStoredToken(data.accessToken, data.refreshToken)
          processQueue(null, data.accessToken)
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return apiClient(originalRequest)
        } catch (refreshErr) {
          processQueue(refreshErr, null)
          setStoredToken(null, null)
          return Promise.reject(refreshErr)
        } finally {
          isRefreshing = false
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
