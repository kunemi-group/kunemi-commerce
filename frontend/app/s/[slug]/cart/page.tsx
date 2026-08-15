"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Minus, Plus, Trash2 } from "lucide-react"
import { fetchPublicStore, type PublicStore } from "@/api"
import { Button } from "@/components/ui/button"
import { StoreShell } from "@/components/storefront/store-shell"
import { formatPublicMoney } from "@/lib/format-money-public"
import {
  cartCount,
  cartSubtotalCents,
  loadStoreCart,
  saveStoreCart,
  type StoreCartLine,
} from "@/lib/store-cart"

export default function PublicCartPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [store, setStore] = useState<PublicStore | null>(null)
  const [lines, setLines] = useState<StoreCartLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLines(loadStoreCart(slug))
    let cancelled = false
    void fetchPublicStore(slug)
      .then((s) => {
        if (!cancelled) setStore(s)
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Store not found")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const subtotal = useMemo(() => cartSubtotalCents(lines), [lines])
  const shipping = store?.shipping.defaultFeeCents ?? 0
  const brand = store?.brandColor || "#4f6bed"

  function updateLines(next: StoreCartLine[]) {
    setLines(next)
    saveStoreCart(slug, next)
  }

  if (loading || !store) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <Loader2 className="size-5 animate-spin" />
            Loading cart…
          </>
        )}
      </div>
    )
  }

  return (
    <StoreShell store={store} slug={slug} cartCount={cartCount(lines)}>
      <Link
        href={`/s/${slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Continue shopping
      </Link>

      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Your cart</h1>

      {lines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-medium">Cart is empty</p>
          <Button className="mt-4" render={<Link href={`/s/${slug}`} />}>
            Browse products
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {lines.map((line) => (
              <div
                key={line.variantId}
                className="flex gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-secondary/40">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.imageUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.variantLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatPublicMoney(line.priceCents, store.currency)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded border border-input p-1"
                      onClick={() =>
                        updateLines(
                          lines
                            .map((l) =>
                              l.variantId === line.variantId
                                ? {
                                    ...l,
                                    quantity: Math.max(1, l.quantity - 1),
                                  }
                                : l,
                            )
                            .filter((l) => l.quantity > 0),
                        )
                      }
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="rounded border border-input p-1"
                      onClick={() =>
                        updateLines(
                          lines.map((l) =>
                            l.variantId === line.variantId
                              ? { ...l, quantity: l.quantity + 1 }
                              : l,
                          ),
                        )
                      }
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        updateLines(
                          lines.filter((l) => l.variantId !== line.variantId),
                        )
                      }
                      aria-label="Remove"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl border border-border bg-card p-4">
            <p className="font-medium">Summary</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatPublicMoney(subtotal, store.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Shipping (default)
                </span>
                <span className="tabular-nums">
                  {formatPublicMoney(shipping, store.currency)}
                </span>
              </div>
              {store.tax.enabled ? (
                <p className="text-xs text-muted-foreground">
                  {store.tax.label} {store.tax.ratePercent}% calculated at
                  checkout on taxable items.
                </p>
              ) : null}
            </div>
            <Button
              className="mt-4 w-full"
              style={{ backgroundColor: brand }}
              render={<Link href={`/s/${slug}/checkout`} />}
            >
              Checkout
            </Button>
          </div>
        </div>
      )}
    </StoreShell>
  )
}
