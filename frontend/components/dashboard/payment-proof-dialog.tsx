"use client"

import { useState } from "react"
import { Check, FileImage, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PaymentStatusBadge } from "./status-badge"
import type { Payment } from "@/lib/data"
import { cn } from "@/lib/utils"
import { API_BASE } from "@/api"

type ExtPayment = Payment & {
  _proofUrl?: string
  _customerNote?: string
  _paymentUrl?: string
}

export function PaymentProofDialog({
  payment,
  open,
  onOpenChange,
  onResolved,
}: {
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolved?: (id: string, action: "confirm" | "reject", note?: string) => void
}) {
  const [note, setNote] = useState("")
  const [done, setDone] = useState<"confirm" | "reject" | null>(null)
  const [busy, setBusy] = useState(false)
  const ext = payment as ExtPayment | null

  async function resolve(action: "confirm" | "reject") {
    if (!payment || busy) return
    setBusy(true)
    setDone(action)
    try {
      await onResolved?.(payment.id, action, note.trim() || undefined)
      window.setTimeout(() => {
        onOpenChange(false)
        setDone(null)
        setNote("")
        setBusy(false)
      }, 500)
    } catch {
      setBusy(false)
      setDone(null)
    }
  }

  const proofSrc = ext?._proofUrl
    ? ext._proofUrl.includes("?")
      ? ext._proofUrl
      : ext._proofUrl
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg data-[side=right]:sm:max-w-lg"
      >
        {payment ? (
          <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <SheetTitle>Verify bank transfer</SheetTitle>
                  <SheetDescription>
                    {payment.orderId} · {payment.customer} · {payment.amount}
                  </SheetDescription>
                </div>
                <PaymentStatusBadge status={payment.status} />
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 animate-fade-in">
              <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-muted">
                {proofSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_BASE}/payments/${payment.id}/proof`}
                    alt="Payment proof"
                    className="max-h-[380px] w-full object-contain bg-background"
                    // browsers can't set Authorization on img — use blob fetch below via object URL would be better;
                    // show filename fallback if image fails
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : null}
                <div className="flex aspect-[3/4] max-h-[380px] flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <FileImage className="size-7" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {payment.proofLabel ?? "No proof uploaded"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.proofLabel
                        ? "Customer attached evidence (optional)"
                        : "Customer claimed payment without a receipt"}
                    </p>
                  </div>
                  <div className="mt-2 w-full max-w-xs space-y-2 rounded-lg border border-border/80 bg-background/60 p-4 text-left text-xs backdrop-blur">
                    <Row k="Customer" v={payment.customer} />
                    <Row k="Amount" v={payment.amount} />
                    <Row k="Reference" v={payment.reference ?? payment.orderId} />
                    <Row k="Note" v={ext?._customerNote ?? "—"} />
                    <Row k="Claimed" v={payment.updated} />
                  </div>
                  {payment.proofLabel ? (
                    <a
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      href={`${API_BASE}/payments/${payment.id}/proof`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={async (e) => {
                        e.preventDefault()
                        const res = await fetch(
                          `${API_BASE}/payments/${payment.id}/proof`,
                          { credentials: "include" },
                        )
                        if (!res.ok) return
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        window.open(url, "_blank")
                      }}
                    >
                      Open proof file
                    </a>
                  ) : null}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Note (optional, shown if rejected)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Amount mismatch — please re-transfer"
                  className="resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <p className="text-xs text-muted-foreground">
                Confirming moves the order to <strong className="text-foreground">paid</strong>{" "}
                only after you verify the money landed. Do not confirm from the claim alone.
              </p>
            </div>

            <SheetFooter className="border-t border-border sm:flex-row sm:justify-between">
              {done ? (
                <p
                  className={cn(
                    "text-sm font-medium",
                    done === "confirm" ? "text-success" : "text-destructive",
                  )}
                >
                  {done === "confirm" ? "Payment verified — order paid" : "Claim rejected"}
                </p>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive"
                    disabled={busy}
                    onClick={() => void resolve("reject")}
                  >
                    <X className="size-4" />
                    Reject
                  </Button>
                  <Button
                    className="gap-2"
                    disabled={busy}
                    onClick={() => void resolve("confirm")}
                  >
                    <Check className="size-4" />
                    Confirm paid
                  </Button>
                </>
              )}
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="max-w-[60%] truncate text-right font-medium">{v}</span>
    </div>
  )
}
