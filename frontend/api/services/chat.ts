import { apiClient, toApiError } from "../client"

export type ChatThread = {
  id: string
  businessId: string
  businessName: string | null
  businessSlug: string | null
  buyerUserId: string
  buyerName: string | null
  buyerEmail: string | null
  productId: string | null
  productName: string | null
  orderId: string | null
  subject: string | null
  lastMessageAt: string | null
  lastMessagePreview: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export type ChatMessage = {
  id: string
  threadId: string
  senderUserId: string
  senderName: string | null
  senderSide: "buyer" | "staff"
  body: string
  mediaKey: string | null
  mediaUrl: string | null
  createdAt: string
}

/** Workspace staff inbox */
export async function listInbox() {
  try {
    const { data } = await apiClient.get<{ threads: ChatThread[] }>("/chat/inbox")
    return data.threads ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function getInboxThread(id: string) {
  try {
    const { data } = await apiClient.get<{
      thread: ChatThread
      messages: ChatMessage[]
    }>(`/chat/inbox/${id}`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function sendInboxMessage(id: string, body: string) {
  try {
    const { data } = await apiClient.post<ChatMessage>(
      `/chat/inbox/${id}/messages`,
      { body },
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

/** ShopFlow buyer (for future client) */
export async function startBuyerThread(payload: {
  businessId: string
  productId?: string
  orderId?: string
  subject?: string
  message?: string
}) {
  try {
    const { data } = await apiClient.post<ChatThread>(
      "/chat/buyer/threads",
      payload,
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function listBuyerThreads() {
  try {
    const { data } = await apiClient.get<{ threads: ChatThread[] }>(
      "/chat/buyer/threads",
    )
    return data.threads ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function getBuyerThread(id: string) {
  try {
    const { data } = await apiClient.get<{
      thread: ChatThread
      messages: ChatMessage[]
    }>(`/chat/buyer/threads/${id}`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function sendBuyerMessage(id: string, body: string) {
  try {
    const { data } = await apiClient.post<ChatMessage>(
      `/chat/buyer/threads/${id}/messages`,
      { body },
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}
