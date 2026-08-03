"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as chatApi from "../services/chat"

export function useInbox(enabled = true) {
  return useQuery({
    queryKey: queryKeys.chat.inbox(),
    queryFn: chatApi.listInbox,
    enabled,
    refetchInterval: 15_000,
  })
}

export function useInboxThread(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chat.thread(id ?? ""),
    queryFn: () => chatApi.getInboxThread(id!),
    enabled: Boolean(id) && enabled,
    refetchInterval: 8_000,
  })
}

export function useSendInboxMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      chatApi.sendInboxMessage(id, body),
    onSuccess: (_d, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.chat.inbox() })
      void qc.invalidateQueries({ queryKey: queryKeys.chat.thread(id) })
    },
  })
}
