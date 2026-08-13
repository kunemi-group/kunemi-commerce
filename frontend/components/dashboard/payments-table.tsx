"use client"

import { useMemo, useState } from "react"
import {
  Search,
  CreditCard,
  Banknote,
  MoreHorizontal,
  Check,
  X,
  FileImage,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaymentStatusBadge } from "./status-badge"
import { PaymentProofDialog } from "./payment-proof-dialog"
import { EmptyState } from "./empty-state"
import type { Payment, PaymentStatus } from "@/lib/data"
import {
  API_BASE,
  useMoney,
  usePayments,
  useRejectPayment,
  useVerifyPayment,
  type ApiPayment,
} from "@/api"
import { useAuth } from "@/lib/auth-context"

type FilterKey = "all" | "under_review" | "awaiting_payment" | "confirmed" | "failed"

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "under_review", label: "Needs review" },
  { key: "awaiting_payment", label: "Awaiting" },
  { key: "confirmed", label: "Confirmed" },
  { key: "failed", label: "Failed" },
]

function mapApiStatus(s: string): PaymentStatus {
  switch (s) {
    case "claimed":
      return "under_review"
    case "awaiting_transfer":
      return "awaiting_payment"
    case "verified":
      return "confirmed"
    case "rejected":
    case "expired":
      return "failed"
    default:
      return "awaiting_payment"
  }
}

function mapApiRow(p: ApiPayment, format: (cents: number) => string): Payment {
  return {
    id: p.id,
    orderId: p.orderId.slice(0, 8),
    customer: p.order?.customerName ?? "Customer",
    agent: "Team",
    method: p.method === "card" ? "card" : "manual_transfer",
    amount: format(p.amountCents),
    status: mapApiStatus(p.status),
    reference: p.reference,
    proofLabel: p.hasProof ? p.proofFilename ?? "proof" : undefined,
    updated: new Date(p.updatedAt).toLocaleString(),
    _apiId: p.id,
    _proofUrl: p.proofUrl
      ? `${API_BASE.replace(/\/api$/, "")}${p.proofUrl.startsWith("/api") ? p.proofUrl : `/api${p.proofUrl}`}`
      : undefined,
    _customerNote: p.customerNote ?? undefined,
    _paymentUrl: p.paymentUrl,
    _rawStatus: p.status,
  } as Payment & {
    _apiId: string
    _proofUrl?: string
    _customerNote?: string
    _paymentUrl?: string
    _rawStatus?: string
  }
}

export function PaymentsTable({
  defaultFilter = "all",
}: {
  defaultFilter?: FilterKey
}) {
  const { isAuthenticated } = useAuth()
  const money = useMoney()
  const [active, setActive] = useState<FilterKey>(defaultFilter)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Payment | null>(null)
  const {
    data: payments = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = usePayments(isAuthenticated)
  const verifyMutation = useVerifyPayment()
  const rejectMutation = useRejectPayment()

  const rowsData = useMemo(
    () => payments.map((p) => mapApiRow(p, money.format)),
    [payments, money],
  )
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load payments"
    : verifyMutation.error || rejectMutation.error
      ? "Action failed"
      : null

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rowsData.filter((p) => {
      const matchesStatus = active === "all" || p.status === (active as PaymentStatus)
      const matchesQuery =
        q === "" ||
        p.orderId.toLowerCase().includes(q) ||
        p.customer.toLowerCase().includes(q) ||
        p.agent.toLowerCase().includes(q) ||
        (p.reference?.toLowerCase().includes(q) ?? false)
      return matchesStatus && matchesQuery
    })
  }, [active, query, rowsData])

  async function onResolved(id: string, action: "confirm" | "reject", note?: string) {
    if (action === "confirm") {
      await verifyMutation.mutateAsync({ id, note })
    } else {
      await rejectMutation.mutateAsync({ id, reason: note })
    }
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs value={active} onValueChange={(v) => setActive(v as FilterKey)}>
              <div className="-mx-1 overflow-x-auto px-1">
                <TabsList className="inline-flex w-max gap-1 bg-transparent p-0">
                  {filters.map((f) => (
                    <TabsTrigger
                      key={f.key}
                      value={f.key}
                      className="rounded-md border border-transparent px-3 data-[state=active]:border-border data-[state=active]:bg-secondary"
                    >
                      {f.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => void refetch()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Refresh
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, customer, reference…"
              aria-label="Search payments"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <p className="text-xs text-muted-foreground">
            Live via TanStack Query + Axios · bank transfer is default
          </p>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading payments…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Banknote}
                title="No payments here"
                description="Create an order, share the bank-transfer pay link, then review claims here."
                actionLabel="Show all"
                onAction={() => setActive("all")}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Proof / ref</TableHead>
                    <TableHead className="hidden text-right xl:table-cell">Updated</TableHead>
                    <TableHead className="w-10 pr-4" aria-label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow
                      key={p.id}
                      className={
                        p.status === "under_review"
                          ? "cursor-pointer hover:bg-primary/5"
                          : undefined
                      }
                      onClick={() => {
                        if (p.status === "under_review") setSelected(p)
                      }}
                    >
                      <TableCell className="pl-4 font-medium tabular-nums">
                        {p.orderId}
                      </TableCell>
                      <TableCell>
                        <div className="leading-tight">
                          <span className="block">{p.customer}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.reference}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          {p.method === "card" ? (
                            <CreditCard className="size-4" />
                          ) : (
                            <Banknote className="size-4" />
                          )}
                          {p.method === "card" ? "Card" : "Transfer"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {p.amount}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="hidden max-w-[10rem] truncate text-sm text-muted-foreground lg:table-cell">
                        {p.proofLabel ? (
                          <span className="inline-flex items-center gap-1.5">
                            <FileImage className="size-3.5 shrink-0" />
                            {p.proofLabel}
                          </span>
                        ) : (
                          p.reference ?? "—"
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right text-sm text-muted-foreground xl:table-cell">
                        {p.updated}
                      </TableCell>
                      <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                        {p.status === "under_review" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-success hover:bg-success/10 hover:text-success"
                              onClick={() => setSelected(p)}
                            >
                              <FileImage className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-success hover:bg-success/10 hover:text-success"
                              onClick={() => void onResolved(p.id, "confirm")}
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => void onResolved(p.id, "reject")}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label={`Actions for ${p.id}`}
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  const url = (p as Payment & { _paymentUrl?: string })
                                    ._paymentUrl
                                  if (url) void navigator.clipboard.writeText(url)
                                }}
                              >
                                Copy pay link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (p.reference)
                                    void navigator.clipboard.writeText(p.reference)
                                }}
                              >
                                Copy reference
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>
            Showing{" "}
            <span className="font-medium tabular-nums text-foreground">{rows.length}</span> of{" "}
            <span className="tabular-nums">{rowsData.length}</span> payments
          </span>
          <p className="hidden text-xs md:block">
            Confirm only after you see the transfer in your bank
          </p>
        </CardFooter>
      </Card>

      <PaymentProofDialog
        payment={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onResolved={(id, action, note) => void onResolved(id, action, note)}
      />
    </>
  )
}
