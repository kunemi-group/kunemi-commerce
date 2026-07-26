import Link from "next/link"
import {
  Boxes,
  ExternalLink,
  MapPin,
  Package,
  MessageCircle,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { business, trackingByToken } from "@/lib/data"
import { cn } from "@/lib/utils"
import { DeliveryStatusBadge } from "@/components/dashboard/status-badge"
import { whatsappDeepLink, whatsappDigits } from "@/lib/whatsapp"
import { TrackShareButton } from "@/components/dashboard/track-share-button"

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = trackingByToken[token]

  if (!data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-center animate-fade-in">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Boxes className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Tracking link not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This token may have expired or been typed incorrectly. Ask your seller for a fresh
          tracking link.
        </p>
        <Button
          className="mt-6 gap-2"
          variant="outline"
          render={
            <a
              href={whatsappDeepLink(
                business.whatsapp,
                `Hi ${business.name}, I need help with my tracking link.`,
              )}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <MessageCircle className="size-4" />
          Message seller on WhatsApp
        </Button>
      </div>
    )
  }

  const waHref = whatsappDeepLink(
    business.whatsapp,
    `Hi ${business.name}, I have a question about order ${data.orderId}.`,
  )

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Brand accent bar */}
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
            title={`${data.businessName} · ${data.orderId}`}
            text={`Track order ${data.orderId}`}
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6 animate-fade-in">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Order {data.orderId}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Hi, {data.customer}
              </h1>
            </div>
            <DeliveryStatusBadge status={data.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Estimated delivery:{" "}
            <span className="font-medium text-foreground">{data.eta}</span>
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-0">
              {data.timeline.map((step, i) => {
                const isLast = i === data.timeline.length - 1
                return (
                  <li
                    key={step.label}
                    className="flex gap-3 animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "mt-1 size-2.5 shrink-0 rounded-full ring-4 transition-colors",
                          step.done
                            ? "bg-success ring-success/20"
                            : "bg-muted-foreground/40 ring-muted",
                        )}
                      />
                      {!isLast ? (
                        <span
                          className={cn(
                            "my-1 w-px min-h-8 flex-1",
                            step.done ? "bg-success/40" : "bg-border",
                          )}
                        />
                      ) : null}
                    </div>
                    <div className={cn("pb-5", isLast && "pb-0")}>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          !step.done && "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.at}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4" />
              Items
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2"
              >
                <span className="text-sm">{item.name}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  ×{item.qty}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Map stub */}
        <Card className="overflow-hidden">
          <div className="relative flex h-36 items-end bg-[radial-gradient(circle_at_30%_40%,oklch(0.35_0.04_256),oklch(0.22_0.02_256))] p-4">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,oklch(1_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm backdrop-blur">
              <MapPin className="size-4 text-primary" />
              <span>
                {data.provider ?? "Seller rider"} · en route
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Courier</p>
                <p className="text-sm text-muted-foreground">
                  {data.provider ?? "Seller fulfillment"} ·{" "}
                  {data.mode === "manual" ? "Manual" : "API"} handoff
                </p>
              </div>
            </div>
            {data.externalTrackingUrl ? (
              <Button
                variant="outline"
                className="w-full gap-2 bg-card"
                render={
                  <a href={data.externalTrackingUrl} target="_blank" rel="noreferrer" />
                }
              >
                <ExternalLink className="size-4" />
                Track with {data.provider}
              </Button>
            ) : null}
            <Button className="w-full gap-2" render={<a href={waHref} target="_blank" rel="noreferrer" />}>
              <MessageCircle className="size-4" />
              WhatsApp {business.name}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {business.whatsapp} · wa.me/{whatsappDigits(business.whatsapp)}
            </p>
          </CardContent>
        </Card>

        <p className="pb-6 text-center text-[11px] text-muted-foreground">
          Sold with{" "}
          <Link href="/" className="text-primary hover:underline">
            Kunemi Workspace
          </Link>
        </p>
      </main>
    </div>
  )
}
