"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Banknote,
  Boxes,
  CheckCircle2,
  Clock,
  Copy,
  FileImage,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  formatMoney,
  getApiErrorMessage,
  useClaimPayment,
  usePublicPay,
  type PublicPayResponse,
} from "@/api"
import { whatsappDeepLink } from "@/lib/whatsapp"

function PaymentCountdown({
  secondsRemaining,
  totalSeconds = 30 * 60,
}: {
  secondsRemaining: number
  totalSeconds?: number
}) {
  const [left, setLeft] = useState(Math.max(0, secondsRemaining))

  useEffect(() => {
    setLeft(Math.max(0, secondsRemaining))
  }, [secondsRemaining])

  useEffect(() => {
    if (left <= 0) return
    const id = window.setInterval(() => {
      setLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [left > 0])

  const m = Math.floor(left / 60)
  const s = left % 60
  const ratio = Math.min(1, left / totalSeconds)
  const critical = left > 0 && left < 5 * 60
  const expired = left <= 0

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        expired
          ? "border-border bg-muted/40"
          : critical
            ? "border-destructive/40 bg-destructive/10"
            : "border-warning/40 bg-warning/10",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" />
          Time left to transfer
        </p>
        <p
          className={cn(
            "text-lg font-semibold tabular-nums",
            expired
              ? "text-muted-foreground"
              : critical
                ? "text-destructive"
                : "text-warning",
          )}
        >
          {expired ? "Expired" : `${m}:${s.toString().padStart(2, "0")}`}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            expired
              ? "bg-muted-foreground"
              : critical
                ? "bg-destructive"
                : "bg-warning",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Pay before the timer ends. After expiry the order may cancel and any stock hold is
        released.
      </p>
    </div>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-medium tabular-nums">{value}</p>
      </div>
      <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={copy}>
        <Copy className="size-3.5" />
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  )
}

export function PayPageClient({ token }: { token: string }) {
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = usePublicPay(token)
  const claimMutation = useClaimPayment(token)
  const [formError, setFormError] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [proofName, setProofName] = useState<string | null>(null)
  const [proofBase64, setProofBase64] = useState<string | null>(null)
  const [proofMime, setProofMime] = useState<string | null>(null)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)

  const error =
    formError ||
    (queryError
      ? getApiErrorMessage(queryError)
      : claimMutation.error
        ? getApiErrorMessage(claimMutation.error)
        : null)

  const currency = data?.currency || data?.business?.currency || "NGN"
  const amountLabel = useMemo(
    () => (data ? formatMoney(data.amountCents, currency) : ""),
    [data, currency],
  )

  async function onFile(file: File | null) {
    if (!file) {
      setProofName(null)
      setProofBase64(null)
      setProofMime(null)
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setFormError("Proof must be 4MB or smaller")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || "")
      setProofBase64(result)
      setProofMime(file.type || "image/jpeg")
      setProofName(file.name)
    }
    reader.readAsDataURL(file)
  }

  async function claim() {
    if (!data?.canClaim) return
    setFormError(null)
    try {
      const res = await claimMutation.mutateAsync({
        customerNote: note.trim() || undefined,
        proofFilename: proofName || undefined,
        proofMimeType: proofMime || undefined,
        proofBase64: proofBase64 || undefined,
      })
      setDoneMsg(res.message)
      await refetch()
    } catch (e) {
      setFormError(getApiErrorMessage(e) || "Could not submit payment claim")
    }
  }

  const submitting = claimMutation.isPending

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading payment details…
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
        <Boxes className="mb-3 size-10 text-primary" />
        <h1 className="text-xl font-semibold">Payment link not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const wa = data.business.whatsapp
    ? whatsappDeepLink(
        data.business.whatsapp,
        `Hi ${data.business.name}, I paid for order ${data.reference} (${amountLabel}).`,
      )
    : null

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-chart-2 to-success" />

      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-2.5 px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Banknote className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">{data.business.name}</p>
            <p className="text-xs text-muted-foreground">
              Bank transfer · Powered by Kunemi Workspace
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Pay {amountLabel}</h1>
            <p className="text-sm text-muted-foreground">
              Ref {data.reference} · {data.order.customerName}
            </p>
          </div>
          <StatusPill data={data} />
        </div>

        {data.paid ? (
          <Card className="border-success/30 bg-success/10">
            <CardContent className="flex items-start gap-3 p-4">
              <CheckCircle2 className="mt-0.5 size-5 text-success" />
              <div>
                <p className="font-medium">Order confirmed</p>
                <p className="text-sm text-muted-foreground">
                  The business verified your bank transfer. You&apos;ll get delivery updates next.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {data.underReview ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldCheck className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-medium">Waiting for verification</p>
                <p className="text-sm text-muted-foreground">
                  You marked this as paid. The business will confirm the transfer before the
                  order is confirmed.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {data.expired && !data.paid && !data.underReview ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm">
              This payment window has expired. Message the seller for a new payment link.
            </CardContent>
          </Card>
        ) : null}

        {data.rejectReason && data.canClaim ? (
          <Card className="border-warning/40 bg-warning/10">
            <CardContent className="p-4 text-sm">
              <p className="font-medium">Previous claim was not verified</p>
              <p className="mt-1 text-muted-foreground">{data.rejectReason}</p>
              <p className="mt-2 text-muted-foreground">
                You can transfer again and resubmit below.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {data.canClaim && data.secondsRemaining !== null ? (
          <PaymentCountdown secondsRemaining={data.secondsRemaining} />
        ) : null}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Transfer to this account</CardTitle>
            <p className="text-sm text-muted-foreground">
              Default payment method is bank transfer. Use the exact amount and reference.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <CopyRow label="Bank" value={data.business.bankName || "—"} />
            <CopyRow label="Account name" value={data.business.bankAccountName || "—"} />
            <CopyRow
              label="Account number"
              value={data.business.bankAccountNumber || "—"}
            />
            <CopyRow label="Amount" value={amountLabel} />
            <CopyRow label="Reference / narration" value={data.reference} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.order.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {item.quantity}× {item.description}
                </span>
                <span className="tabular-nums">
                  {formatMoney(item.unitPriceCents * item.quantity, currency)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 text-muted-foreground">
              <span>Shipping</span>
              <span className="tabular-nums">
                {formatMoney(data.order.shippingFeeCents, currency)}
              </span>
            </div>
            {data.order.taxCents > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">
                  {formatMoney(data.order.taxCents, currency)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">
                {formatMoney(data.order.totalCents, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        {data.canClaim ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">I have made payment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell the business you transferred. Upload a receipt if you have one (optional).
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Note (optional)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Sent from GTBank · 2:14pm"
                  className="resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="flex cursor-pointer flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Payment evidence (optional)
                </span>
                <div className="flex items-center gap-2 rounded-md border border-dashed border-input px-3 py-3 text-sm">
                  <FileImage className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {proofName ?? "JPEG, PNG, WebP, or PDF · max 4MB"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="sr-only"
                  onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                />
              </label>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              {doneMsg ? (
                <p className="text-sm text-success">{doneMsg}</p>
              ) : null}

              <Button
                className="w-full gap-2"
                disabled={submitting}
                onClick={() => void claim()}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                I have made payment
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Order is confirmed only after the business verifies your transfer.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
          {data.instructions.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>

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
      </main>
    </div>
  )
}

function StatusPill({ data }: { data: PublicPayResponse }) {
  if (data.paid) {
    return <Badge className="border-0 bg-success/15 text-success">Paid</Badge>
  }
  if (data.underReview) {
    return <Badge className="border-0 bg-primary/15 text-primary">Under review</Badge>
  }
  if (data.expired) {
    return <Badge className="border-0 bg-muted text-muted-foreground">Expired</Badge>
  }
  return <Badge className="border-0 bg-warning/15 text-warning">Awaiting transfer</Badge>
}
