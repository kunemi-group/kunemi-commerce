"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as productsApi from "../services/products"

export function useProducts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: productsApi.listProducts,
    enabled,
  })
}

export function useRestockVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ variantId, delta }: { variantId: string; delta: number }) =>
      productsApi.restockVariant(variantId, delta),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}
