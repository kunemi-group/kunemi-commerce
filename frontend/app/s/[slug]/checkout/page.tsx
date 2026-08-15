"use client"

import { FormEvent, use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import {
  checkoutPublicStore,
  fetchPublicStore,
  type PublicStore,
  type StoreCheckoutResult,
} from "@/api"
import { Button } from "@/components/ui/button"
import { StoreShell } from "@/components/storefront/store-shell"
import { formatPublicMoney } from "@/lib/format-money-public"
import {
  cartCount,
  cartSubtotalCents,
  checkoutIdempotencyKey,
  clearCheckoutIdempotencyKey,
  clearStoreCart,
  loadStoreCart,
  type StoreCartLine,
} from "@/lib/store-cart"

export default function PublicCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [store, setStore] = useState<PublicStore | null>(null)
  const [lines, setLines] = useState<StoreCartLine[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StoreCheckoutResult | null>(null)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")

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

  const brand = store?.brandColor || "#4f6bed"
  const subtotal = useMemo(() => cartSubtotalCents(lines), [lines])
  const shipping = store?.shipping.defaultFeeCents ?? 0

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!store || lines.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const order = await checkoutPublicStore(slug, {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        deliveryAddress: address.trim() || undefined,
        shippingFeeCents: shipping,
        idempotencyKey: checkoutIdempotencyKey(slug),
        items: lines.map((l) => ({
          variantId: l.variantId,
          quantity: l.quantity,
        })),
      })
      setResult(order)
      clearStoreCart(slug)
      clearCheckoutIdempotencyKey(slug)
      setLines([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading || !store) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        {error && !store ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <Loader2 className="size-5 animate-spin" />
            Loading checkout…
          </>
        )}
      </div>
    )
  }

  if (result) {
    return (
      <StoreShell store={store} slug={slug} cartCount={0}>
        <div className="mx-auto max-w-md rounded-xl border border-success/30 bg-success/10 p-6 text-center">
          <h1 className="text-xl font-semibold">Order placed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pay by bank transfer to complete your order. Your seller will
            confirm payment in Workspace.
          </p>
          <p
            className="mt-3 text-lg font-semibold tabular-nums"
            style={{ color: brand }}
          >
            {formatPublicMoney(
              result.totalCents,
              result.currency || store.currency,
            )}
          </p>
          <Button
            className="mt-4 w-full"
            style={{ backgroundColor: brand }}
            render={
              <Link href={result.paymentLink || result.payment.paymentUrl} />
            }
          >
            Open payment page
          </Button>
          <Button
            variant="outline"
            className="mt-2 w-full bg-card"
            render={<Link href={`/s/${slug}`} />}
          >
            Back to store
          </Button>
        </div>
      </StoreShell>
    )
  }

  if (lines.length === 0) {
    return (
      <StoreShell store={store} slug={slug} cartCount={0}>
        <p className="font-medium">Nothing to checkout</p>
        <Button className="mt-4" render={<Link href={`/s/${slug}`} />}>
          Browse products
        </Button>
      </StoreShell>
    )
  }

  return (
    <StoreShell store={store} slug={slug} cartCount={cartCount(lines)}>
      <Link
        href={`/s/${slug}/cart`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Cart
      </Link>

      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Guest checkout · creates an order for {store.name} on Kunemi Workspace ·
        pay by bank transfer
      </p>

      <form
        className="grid gap-6 lg:grid-cols-3"
        onSubmit={(e) => void onSubmit(e)}
      >
        <div className="space-y-3 lg:col-span-2">
          <Field label="Full name" value={name} onChange={setName} required />
          <Field
            label="Phone"
            value={phone}
            onChange={setPhone}
            required
            type="tel"
          />
          <Field
            label="Email (optional)"
            value={email}
            onChange={setEmail}
            type="email"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Delivery address (optional)
            </span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="h-fit rounded-xl border border-border bg-card p-4">
          <p className="font-medium">
            {lines.length} item{lines.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {lines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-2">
                <span className="truncate">
                  {l.productName} × {l.quantity}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatPublicMoney(l.priceCents * l.quantity, store.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">
                {formatPublicMoney(subtotal, store.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="tabular-nums">
                {formatPublicMoney(shipping, store.currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tax (if any) is calculated on the server for taxable products
              only.
            </p>
          </div>
          <Button
            type="submit"
            className="mt-4 w-full gap-2"
            style={{ backgroundColor: brand }}
            disabled={busy}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Place order &amp; pay
          </Button>
        </div>
      </form>
    </StoreShell>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  )
}
