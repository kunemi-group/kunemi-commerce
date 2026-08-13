"use client"

import Link from "next/link"
import {
  Boxes,
  ExternalLink,
  MapPin,
  Package,
  MessageCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DeliveryStatusBadge } from "@/components/dashboard/status-badge"
import { whatsappDeepLink, whatsappDigits } from "@/lib/whatsapp"
import { TrackShareButton } from "@/components/dashboard/track-share-button"
import { formatMoney, shortId, usePublicTracking } from "@/api"

export function TrackPageClient({ token }: { token: string }) {
  const {
    data,
    isLoading: loading,
    error: queryError,
  } = usePublicTracking(token)
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Not found"
    : null

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading tracking…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-center animate-fade-in">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Boxes className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Tracking link not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {error ??
            "This token may have expired or been typed incorrectly. Ask your seller for a fresh tracking link."}
        </p>
      </div>
    )
  }

  const wa =
    data.businessWhatsapp
      ? whatsappDeepLink(
          data.businessWhatsapp,
          `Hi ${data.businessName}, I have a question about order ${shortId(data.orderId)}.`,
        )
      : null

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-chart-2 to-success" />

      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2.5 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Boxes className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">{data.businessName}</p>
              <p className="text-xs text-muted-foreground">
                Order tracking · Powered by Kunemi Workspace
              </p>
            </div>
          </div>
          <TrackShareButton
            title={`${data.businessName} · ${shortId(data.orderId)}`}
            text={`Track order ${shortId(data.orderId)}`}
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6 animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Order</p>
            <h1 className="text-xl font-semibold tabular-nums tracking-tight">
              {shortId(data.orderId)}
            </h1>
            {data.customerName ? (
              <p className="text-sm text-muted-foreground">{data.customerName}</p>
            ) : null}
          </div>
          <DeliveryStatusBadge status={data.status} />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-primary" />
              Status · {data.eta}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-0">
              {data.timeline.map((step, i) => {
                const last = i === data.timeline.length - 1
                return (
                  <li key={`${step.label}-${i}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "mt-1 size-2.5 rounded-full ring-4",
                          step.done
                            ? "bg-success ring-success/20"
                            : "bg-muted-foreground/40 ring-muted",
                        )}
                      />
                      {!last ? (
                        <span
                          className={cn(
                            "my-1 min-h-6 w-px flex-1",
                            step.done ? "bg-success/40" : "bg-border",
                          )}
                        />
                      ) : null}
                    </div>
                    <div className={cn("pb-3", last && "pb-0")}>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          !step.done && "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </p>
                      {step.note ? (
                        <p className="text-xs text-muted-foreground">{step.note}</p>
                      ) : null}
                      {step.at ? (
                        <p className="text-xs text-muted-foreground">
                          {new Date(step.at).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        {data.deliveryAddress ? (
          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Delivery address</p>
                <p className="text-sm">{data.deliveryAddress}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {data.items?.length ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.items.map((item, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {item.qty}× {item.name}
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(
                      item.unitPriceCents * item.qty,
                      data.currency ?? "NGN",
                    )}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {data.externalTrackingUrl ? (
          <Button
            variant="outline"
            className="gap-2"
            render={
              <a href={data.externalTrackingUrl} target="_blank" rel="noreferrer" />
            }
          >
            <ExternalLink className="size-4" />
            {data.externalCourierName
              ? `Track with ${data.externalCourierName}`
              : "Courier tracking"}
          </Button>
        ) : null}

        {wa ? (
          <Button
            variant="outline"
            className="gap-2"
            render={<a href={wa} target="_blank" rel="noreferrer" />}
          >
            <MessageCircle className="size-4" />
            Message seller on WhatsApp
          </Button>
        ) : null}

        <p className="pb-6 text-center text-[11px] text-muted-foreground">
          Sold with{" "}
          <Link href="/" className="text-primary hover:underline">
            Kunemi Workspace
          </Link>
          {data.businessWhatsapp
            ? ` · ${whatsappDigits(data.businessWhatsapp)}`
            : null}
        </p>
      </main>
    </div>
  )
}
