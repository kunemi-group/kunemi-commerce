"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../keys"
import * as productsApi from "../services/products"
import type {
  CreateProductPayload,
  UpdateProductPayload,
  VariantPayload,
} from "../services/products"

function invalidateProducts(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.products.all })
}

export function useProducts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: productsApi.listProducts,
    enabled,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      productsApi.createProduct(payload),
    onSuccess: () => invalidateProducts(qc),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateProductPayload
    }) => productsApi.updateProduct(id, payload),
    onSuccess: () => invalidateProducts(qc),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => invalidateProducts(qc),
  })
}

export function useAddVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string
      payload: {
        sku?: string
        priceCents: number
        stockOnHand?: number
        taxExempt?: boolean
        lowStockThreshold?: number
        attributes?: Record<string, string>
      }
    }) => productsApi.addVariant(productId, payload),
    onSuccess: () => invalidateProducts(qc),
  })
}

export function useUpdateVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      variantId,
      payload,
    }: {
      variantId: string
      payload: VariantPayload
    }) => productsApi.updateVariant(variantId, payload),
    onSuccess: () => invalidateProducts(qc),
  })
}

export function useRestockVariant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ variantId, delta }: { variantId: string; delta: number }) =>
      productsApi.restockVariant(variantId, delta),
    onSuccess: () => invalidateProducts(qc),
  })
}
