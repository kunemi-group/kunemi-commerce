"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as deliveriesApi from "../services/deliveries"

export function useDeliveries(enabled = true) {
  return useQuery({
    queryKey: queryKeys.deliveries.list(),
    queryFn: deliveriesApi.listDeliveries,
    enabled,
  })
}

export function useCreateDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deliveriesApi.createDelivery,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.deliveries.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string
      status: string
      note?: string
    }) => deliveriesApi.updateDeliveryStatus(id, { status, note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.deliveries.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}

export function usePublicTracking(token: string) {
  return useQuery({
    queryKey: queryKeys.tracking.public(token),
    queryFn: () => deliveriesApi.getPublicTracking(token),
    enabled: Boolean(token),
  })
}
