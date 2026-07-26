"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, Rocket, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const DISMISS_KEY = "shopflow-onboarding-dismissed"

export function OnboardingChecklist() {
  const { business, onboardingComplete } = useAuth()
  const [dismissed, setDismissed] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1")
    } catch {
      setDismissed(false)
    }
    setMounted(true)
  }, [])

  const steps = useMemo(() => {
    const bankOk = Boolean(
      business?.bank.bankName &&
        business?.bank.accountName &&
        business?.bank.accountNumber,
    )
    const waOk = Boolean(business?.whatsappNumber)
    return [
      {
        id: "bank",
        label: "Bank transfer details",
        description: "Account customers transfer to on pay links",
        href: "/settings",
        done: bankOk,
      },
      {
        id: "wa",
        label: "WhatsApp business number",
        description: "So the team can share pay & tracking links in chat",
        href: "/settings",
        done: waOk,
      },
      {
        id: "order",
        label: "Create your first order",
        description: "Freeform or catalog · customer pays by transfer",
        href: "/workspace",
        done: false,
      },
      {
        id: "products",
        label: "Add products (optional)",
        description: "Inventory is optional — freeform lines always work",
        href: "/inventory",
        done: false,
      },
    ]
  }, [business])

  // Required setup is forced on /onboarding; this is optional next steps
  if (!mounted || dismissed || !onboardingComplete) return null

  const doneCount = steps.filter((s) => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // ignore
    }
  }

  return (
    <Card className="border-primary/25 bg-primary/5 animate-fade-in">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="size-4 text-primary" />
            Get ShopFlow running
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {steps.length} next steps · {pct}%
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss onboarding"
          onClick={dismiss}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-1.5" />
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-card/60",
                  step.done && "opacity-70",
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.done && "line-through decoration-muted-foreground/60",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
