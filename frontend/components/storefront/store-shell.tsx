"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import type { PublicStore } from "@/api"
import { cn } from "@/lib/utils"

export function StoreShell({
  store,
  slug,
  cartCount = 0,
  children,
}: {
  store: PublicStore
  slug: string
  cartCount?: number
  children: React.ReactNode
}) {
  const color = store.brandColor || "#4f6bed"

  return (
    <div className="min-h-svh bg-background">
      <header
        className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur"
        style={{ borderBottomColor: `${color}33` }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            href={`/s/${slug}`}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt=""
                className="size-9 rounded-lg object-cover ring-1 ring-border"
              />
            ) : (
              <div
                className="flex size-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {store.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {store.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Powered by Kunemi Workspace
              </p>
            </div>
          </Link>
          <Link
            href={`/s/${slug}/cart`}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm font-medium hover:bg-secondary/60",
            )}
          >
            <ShoppingBag className="size-4" />
            Cart
            {cartCount > 0 ? (
              <span
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {store.whatsappNumber ? (
          <p className="mb-1">WhatsApp {store.whatsappNumber}</p>
        ) : null}
        <p>
          © {new Date().getFullYear()} {store.name} · Store on Kunemi Workspace
        </p>
      </footer>
    </div>
  )
}
