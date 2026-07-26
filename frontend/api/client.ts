import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api"

export const TOKEN_KEY = "kunemi_workspace_token"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
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
