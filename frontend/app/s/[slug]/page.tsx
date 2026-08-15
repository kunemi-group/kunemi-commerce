"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Package } from "lucide-react"
import {
  fetchPublicStoreProducts,
  type PublicStore,
  type PublicStoreProduct,
} from "@/api"
import { StoreShell } from "@/components/storefront/store-shell"
import { formatPublicMoney } from "@/lib/format-money-public"
import { cartCount, loadStoreCart } from "@/lib/store-cart"

export default function PublicStoreHomePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [store, setStore] = useState<PublicStore | null>(null)
  const [products, setProducts] = useState<PublicStoreProduct[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(cartCount(loadStoreCart(slug)))
    let cancelled = false
    setLoading(true)
    void fetchPublicStoreProducts(slug)
      .then((data) => {
        if (cancelled) return
        setStore(data.store)
        setProducts(data.products)
        setError(null)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Store not found")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const brand = store?.brandColor || "#4f6bed"
  const empty = useMemo(
    () => !loading && products.length === 0,
    [loading, products],
  )

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading store…
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-lg font-semibold">Store not found</h1>
        <p className="text-sm text-muted-foreground">
          {error || "This shop link is offline or the slug is wrong."}
        </p>
      </div>
    )
  }

  return (
    <StoreShell store={store} slug={slug} cartCount={count}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {store.name}
        </h1>
        {store.address ? (
          <p className="mt-1 text-sm text-muted-foreground">{store.address}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Shop published products · pay by bank transfer
          </p>
        )}
      </div>

      {empty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <Package className="mb-3 size-8 text-muted-foreground" />
          <p className="font-medium">No products yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This business has not published products to their store.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/s/${slug}/p/${p.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="aspect-square bg-secondary/40">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="size-full object-cover transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <Package className="size-8 opacity-40" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug">
                  {p.name}
                </p>
                <p
                  className="mt-1 text-sm font-semibold tabular-nums"
                  style={{ color: brand }}
                >
                  {p.fromPriceCents != null
                    ? `From ${formatPublicMoney(p.fromPriceCents, store.currency)}`
                    : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </StoreShell>
  )
}
