"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as paymentsApi from "../services/payments"

export function usePayments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.payments.list(),
    queryFn: paymentsApi.listPayments,
    enabled,
  })
}

export function useVerifyPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      paymentsApi.verifyPayment(id, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.payments.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}

export function useRejectPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      paymentsApi.rejectPayment(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.payments.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}

export function usePublicPay(token: string) {
  return useQuery({
    queryKey: queryKeys.pay.public(token),
    queryFn: () => paymentsApi.getPublicPay(token),
    enabled: Boolean(token),
  })
}

export function useClaimPayment(token: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      customerNote?: string
      proofFilename?: string
      proofMimeType?: string
      proofBase64?: string
    }) => paymentsApi.claimPayment(token, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pay.public(token) })
    },
  })
}
