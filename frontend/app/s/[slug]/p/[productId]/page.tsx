"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Package, Plus } from "lucide-react"
import {
  fetchPublicStoreProduct,
  type PublicStore,
  type PublicStoreProduct,
  type PublicStoreVariant,
} from "@/api"
import { Button } from "@/components/ui/button"
import { StoreShell } from "@/components/storefront/store-shell"
import { formatPublicMoney } from "@/lib/format-money-public"
import {
  cartCount,
  loadStoreCart,
  saveStoreCart,
  type StoreCartLine,
} from "@/lib/store-cart"

export default function PublicProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>
}) {
  const { slug, productId } = use(params)
  const [store, setStore] = useState<PublicStore | null>(null)
  const [product, setProduct] = useState<PublicStoreProduct | null>(null)
  const [variant, setVariant] = useState<PublicStoreVariant | null>(null)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(cartCount(loadStoreCart(slug)))
    let cancelled = false
    setLoading(true)
    void fetchPublicStoreProduct(slug, productId)
      .then((data) => {
        if (cancelled) return
        setStore(data.store)
        setProduct(data.product)
        const first =
          data.product.variants.find((v) => v.inStock) ??
          data.product.variants[0] ??
          null
        setVariant(first)
        setError(null)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Product not found")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, productId])

  const brand = store?.brandColor || "#4f6bed"
  const variantLabel = useMemo(() => {
    if (!variant) return "Default"
    if (variant.attributes) {
      return Object.values(variant.attributes).join(" / ") || "Default"
    }
    return variant.sku || "Default"
  }, [variant])

  function addToCart() {
    if (!product || !variant || !store) return
    if (!variant.inStock) return
    const lines = loadStoreCart(slug)
    const existing = lines.find((l) => l.variantId === variant.id)
    let next: StoreCartLine[]
    if (existing) {
      next = lines.map((l) =>
        l.variantId === variant.id ? { ...l, quantity: l.quantity + qty } : l,
      )
    } else {
      next = [
        ...lines,
        {
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantLabel,
          priceCents: variant.priceCents,
          quantity: qty,
          imageUrl: variant.imageUrl || product.imageUrl,
          taxExempt: variant.taxExempt,
        },
      ]
    }
    saveStoreCart(slug, next)
    setCount(cartCount(next))
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading product…
      </div>
    )
  }

  if (error || !store || !product) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-medium">Product not found</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" render={<Link href={`/s/${slug}`} />}>
          Back to store
        </Button>
      </div>
    )
  }

  return (
    <StoreShell store={store} slug={slug} cartCount={count}>
      <Link
        href={`/s/${slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All products
      </Link>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="aspect-square overflow-hidden rounded-xl border border-border bg-secondary/40">
          {product.imageUrl || variant?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={variant?.imageUrl || product.imageUrl || ""}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Package className="size-12 opacity-40" />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          {product.description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          <p
            className="mt-4 text-2xl font-semibold tabular-nums"
            style={{ color: brand }}
          >
            {variant
              ? formatPublicMoney(variant.priceCents, store.currency)
              : "—"}
          </p>

          {product.variants.length > 1 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Option
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const label = v.attributes
                    ? Object.values(v.attributes).join(" / ") ||
                      v.sku ||
                      "Option"
                    : v.sku || "Default"
                  const active = variant?.id === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!v.inStock}
                      onClick={() => setVariant(v)}
                      className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
                      style={
                        active
                          ? {
                              borderColor: brand,
                              backgroundColor: `${brand}18`,
                              color: brand,
                            }
                          : undefined
                      }
                    >
                      {label}
                      {!v.inStock ? " · sold out" : ""}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground">
              Qty
              <input
                type="number"
                min={1}
                max={variant?.available ?? 99}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))
                }
                className="mt-1 block h-9 w-20 rounded-md border border-input bg-background px-2 text-sm tabular-nums"
              />
            </label>
            <Button
              className="mt-5 gap-2"
              style={{ backgroundColor: brand }}
              disabled={!variant?.inStock}
              onClick={addToCart}
            >
              <Plus className="size-4" />
              {added ? "Added" : "Add to cart"}
            </Button>
          </div>

          {variant && !variant.inStock ? (
            <p className="mt-3 text-sm text-destructive">Out of stock</p>
          ) : null}

          <Button
            variant="outline"
            className="mt-4 bg-card"
            render={<Link href={`/s/${slug}/cart`} />}
          >
            View cart
          </Button>
        </div>
      </div>
    </StoreShell>
  )
}
