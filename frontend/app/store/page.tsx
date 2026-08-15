"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, Store } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"

export default function WorkspaceStorePage() {
  const { business } = useAuth()
  const [copied, setCopied] = useState(false)

  const slug = business?.store?.slug ?? null
  const enabled = business?.store?.enabled ?? false
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://app.kunemi.com"
  const storeUrl = slug ? `${origin}/s/${slug}` : null

  const checklist = useMemo(
    () => [
      {
        id: "slug",
        label: "Store slug set",
        done: Boolean(slug),
        href: "/settings",
      },
      {
        id: "enabled",
        label: "Store enabled",
        done: enabled,
        href: "/settings",
      },
      {
        id: "products",
        label: "Publish products to store",
        done: false,
        href: "/inventory",
        helper: "Toggle “Publish to store” on products",
      },
    ],
    [slug, enabled],
  )

  async function copyLink() {
    if (!storeUrl) return
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <DashboardShell
      title="Store"
      subtitle="Your single-business shop on Kunemi Workspace — not ShopFlow marketplace."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Business storefront"
          description="Share one link (Instagram bio, WhatsApp). Buyers check out as guests; orders land in your Workspace Orders with bank-transfer pay links."
          actions={
            storeUrl ? (
              <Button
                className="gap-2"
                render={<a href={storeUrl} target="_blank" rel="noreferrer" />}
              >
                <ExternalLink className="size-4" />
                View store
              </Button>
            ) : (
              <Button className="gap-2" render={<Link href="/settings" />}>
                Set store slug
              </Button>
            )
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="size-4 text-primary" />
                Public link
              </CardTitle>
              <CardDescription>
                {enabled ? (
                  <Badge className="border-0 bg-success/15 text-success">
                    Live
                  </Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {storeUrl ? (
                <>
                  <p className="break-all rounded-lg border border-border bg-secondary/30 px-3 py-2 font-mono text-sm">
                    {storeUrl}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-card"
                      onClick={() => void copyLink()}
                    >
                      {copied ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      {copied ? "Copied" : "Copy link"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-card"
                      render={<Link href="/settings" />}
                    >
                      Store settings
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Set a store slug in Settings to get a public shop URL.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Go-live checklist</CardTitle>
              <CardDescription>
                Workspace store only — multi-seller ShopFlow is separate and
                later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklist.map((step) => (
                <Link
                  key={step.id}
                  href={step.href}
                  className="flex items-start gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary/40"
                >
                  <span
                    className={
                      step.done
                        ? "mt-0.5 size-4 rounded-full bg-success"
                        : "mt-0.5 size-4 rounded-full border border-border"
                    }
                  />
                  <span>
                    <span className="font-medium">{step.label}</span>
                    {"helper" in step && step.helper ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {step.helper}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
