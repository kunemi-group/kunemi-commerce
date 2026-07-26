"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as ordersApi from "../services/orders"
import type { CreateOrderPayload } from "../types"

export function useOrders(enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: ordersApi.listOrders,
    enabled,
  })
}

export function useOrder(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => ordersApi.getOrder(id!),
    enabled: Boolean(id) && enabled,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.createOrder(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      void qc.invalidateQueries({ queryKey: queryKeys.payments.all })
      void qc.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersApi.cancelOrder(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(id) })
      void qc.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}
