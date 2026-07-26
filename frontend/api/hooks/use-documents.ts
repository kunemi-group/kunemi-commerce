"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as docsApi from "../services/documents"
import type { CreateDocumentPayload } from "../types"

export function useQuotations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.quotations.list(),
    queryFn: docsApi.listQuotations,
    enabled,
  })
}

export function useQuotation(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.quotations.detail(id ?? ""),
    queryFn: () => docsApi.getQuotation(id!),
    enabled: Boolean(id) && enabled,
  })
}

export function useCreateQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDocumentPayload) =>
      docsApi.createQuotation(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.quotations.all })
    },
  })
}

export function useSendQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => docsApi.sendQuotation(id),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.quotations.all })
      void qc.invalidateQueries({ queryKey: queryKeys.quotations.detail(id) })
    },
  })
}

export function useAcceptQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => docsApi.acceptQuotation(id),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.quotations.all })
      void qc.invalidateQueries({ queryKey: queryKeys.quotations.detail(id) })
    },
  })
}

export function useConvertQuotation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => docsApi.convertQuotationToInvoice(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.quotations.all })
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.all })
    },
  })
}

export function useInvoices(enabled = true) {
  return useQuery({
    queryKey: queryKeys.invoices.list(),
    queryFn: docsApi.listInvoices,
    enabled,
  })
}

export function useInvoice(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id ?? ""),
    queryFn: () => docsApi.getInvoice(id!),
    enabled: Boolean(id) && enabled,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDocumentPayload) =>
      docsApi.createInvoice(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.all })
    },
  })
}

export function useSendInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => docsApi.sendInvoice(id),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.all })
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) })
    },
  })
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      amountPaidCents,
      notes,
    }: {
      id: string
      amountPaidCents?: number
      notes?: string
    }) => docsApi.markInvoicePaid(id, { amountPaidCents, notes }),
    onSuccess: (_d, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.all })
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) })
    },
  })
}

export function useVoidInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => docsApi.voidInvoice(id),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.all })
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) })
    },
  })
}
