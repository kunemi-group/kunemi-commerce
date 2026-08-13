"use client"

import { useMemo, useState } from "react"
import {
  Search,
  MoreHorizontal,
  MessageCircle,
  Mail,
  FileText,
  Receipt,
  FileDown,
  Loader2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
import { EmptyState } from "./empty-state"
import { CopyWhatsApp } from "./copy-whatsapp"
import { DownloadPdfButton } from "@/components/pdf/download-pdf-button"
import type { Invoice, Quotation, QuoteStatus, InvoiceStatus } from "@/lib/data"
import { documentShareMessage } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  getApiErrorMessage,
  toUiInvoice,
  toUiQuotation,
  useAcceptQuotation,
  useConvertQuotation,
  useInvoices,
  useMarkInvoicePaid,
  useMoney,
  useQuotations,
  useSendInvoice,
  useSendQuotation,
  useVoidInvoice,
  type ApiInvoice,
  type ApiQuotation,
} from "@/api"

const quoteStyles: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/15 text-primary",
  accepted: "bg-success/15 text-success",
  expired: "bg-warning/15 text-warning",
  converted: "bg-chart-2/15 text-chart-2",
}

const invoiceStyles: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/15 text-primary",
  partial: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  void: "bg-muted text-muted-foreground",
}

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function QuotationsTable() {
  const { isAuthenticated, business } = useAuth()
  const money = useMoney()
  const {
    data: quotations = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuotations(isAuthenticated)
  const sendMutation = useSendQuotation()
  const acceptMutation = useAcceptQuotation()
  const convertMutation = useConvertQuotation()
  const [filter, setFilter] = useState<"all" | QuoteStatus>("all")
  const [query, setQuery] = useState("")
  const [shareId, setShareId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return quotations.filter((row) => {
      const okStatus = filter === "all" || row.status === filter
      const okQ =
        q === "" ||
        row.reference.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q)
      return okStatus && okQ
    })
  }, [filter, query, quotations])

  const share = shareId ? quotations.find((x) => x.id === shareId) : null
  const error = queryError
    ? getApiErrorMessage(queryError)
    : sendMutation.error
      ? getApiErrorMessage(sendMutation.error)
      : acceptMutation.error
        ? getApiErrorMessage(acceptMutation.error)
        : convertMutation.error
          ? getApiErrorMessage(convertMutation.error)
          : null

  return (
    <>
      <DocTableShell
        filter={filter}
        onFilter={(v) => setFilter(v as typeof filter)}
        filters={[
          { key: "all", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "sent", label: "Sent" },
          { key: "accepted", label: "Accepted" },
          { key: "converted", label: "Converted" },
          { key: "expired", label: "Expired" },
        ]}
        query={query}
        onQuery={setQuery}
        placeholder="Search quote, customer…"
        emptyIcon={FileText}
        emptyTitle="No quotations"
        emptyDescription="Create a quote from chat, send via WhatsApp or email."
        count={rows.length}
        total={quotations.length}
        footerNote="Quotes can convert to invoices · bank transfer default"
        loading={isLoading}
        error={error}
        onRefresh={() => void refetch()}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Quote</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Channel</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Pay options</TableHead>
              <TableHead className="hidden text-right xl:table-cell">Valid</TableHead>
              <TableHead className="w-10 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="pl-4 font-medium tabular-nums">
                  {row.reference}
                </TableCell>
                <TableCell>
                  <div className="leading-tight">
                    <span className="block">{row.customerName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {row.ownerName ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden capitalize text-muted-foreground md:table-cell">
                  {row.channel}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money.format(row.totalCents)}
                </TableCell>
                <TableCell>
                  <Pill className={quoteStyles[row.status]}>{row.status}</Pill>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {row.paymentMethods
                    .map((m) => (m === "card" ? "Card" : "Transfer"))
                    .join(" · ")}
                </TableCell>
                <TableCell className="hidden text-right text-sm text-muted-foreground xl:table-cell">
                  {formatDate(row.validUntil)}
                </TableCell>
                <TableCell className="pr-4">
                  <QuoteRowMenu
                    row={row}
                    onWhatsApp={() => setShareId(row.id)}
                    onEmail={() => setShareId(row.id)}
                    onSend={() => void sendMutation.mutateAsync(row.id)}
                    onAccept={() => void acceptMutation.mutateAsync(row.id)}
                    onConvert={() => void convertMutation.mutateAsync(row.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DocTableShell>

      {share ? (
        <ShareBar
          kind="quotation"
          docId={share.id}
          doc={toUiQuotation(share, money.currency)}
          businessName={business?.name ?? "Business"}
          onClose={() => setShareId(null)}
        />
      ) : null}
    </>
  )
}

export function InvoicesTable() {
  const { isAuthenticated, business } = useAuth()
  const money = useMoney()
  const {
    data: invoices = [],
    isLoading,
    error: queryError,
    refetch,
  } = useInvoices(isAuthenticated)
  const sendMutation = useSendInvoice()
  const paidMutation = useMarkInvoicePaid()
  const voidMutation = useVoidInvoice()
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all")
  const [query, setQuery] = useState("")
  const [shareId, setShareId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((row) => {
      const okStatus = filter === "all" || row.status === filter
      const okQ =
        q === "" ||
        row.reference.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q)
      return okStatus && okQ
    })
  }, [filter, query, invoices])

  const share = shareId ? invoices.find((x) => x.id === shareId) : null
  const error = queryError
    ? getApiErrorMessage(queryError)
    : sendMutation.error
      ? getApiErrorMessage(sendMutation.error)
      : paidMutation.error
        ? getApiErrorMessage(paidMutation.error)
        : voidMutation.error
          ? getApiErrorMessage(voidMutation.error)
          : null

  return (
    <>
      <DocTableShell
        filter={filter}
        onFilter={(v) => setFilter(v as typeof filter)}
        filters={[
          { key: "all", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "sent", label: "Sent" },
          { key: "partial", label: "Partial" },
          { key: "paid", label: "Paid" },
          { key: "overdue", label: "Overdue" },
        ]}
        query={query}
        onQuery={setQuery}
        placeholder="Search invoice, customer…"
        emptyIcon={Receipt}
        emptyTitle="No invoices"
        emptyDescription="Invoice from an accepted quote or create freeform. Send bank details with WhatsApp."
        count={rows.length}
        total={invoices.length}
        footerNote="Bank transfer default · mark paid when transfer verified"
        loading={isLoading}
        error={error}
        onRefresh={() => void refetch()}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Linked quote</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Pay options</TableHead>
              <TableHead className="hidden text-right xl:table-cell">Due</TableHead>
              <TableHead className="w-10 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="pl-4 font-medium tabular-nums">
                  {row.reference}
                </TableCell>
                <TableCell>
                  <div className="leading-tight">
                    <span className="block">{row.customerName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {row.ownerName ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {row.quotationId ? row.quotationId.slice(0, 8) : "—"}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {money.format(row.totalCents)}
                </TableCell>
                <TableCell>
                  <Pill className={invoiceStyles[row.status]}>{row.status}</Pill>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {row.paymentMethods
                    .map((m) => (m === "card" ? "Card" : "Transfer"))
                    .join(" · ")}
                </TableCell>
                <TableCell className="hidden text-right text-sm text-muted-foreground xl:table-cell">
                  {formatDate(row.dueAt)}
                </TableCell>
                <TableCell className="pr-4">
                  <InvoiceRowMenu
                    row={row}
                    onWhatsApp={() => setShareId(row.id)}
                    onEmail={() => setShareId(row.id)}
                    onSend={() => void sendMutation.mutateAsync(row.id)}
                    onPaid={() => void paidMutation.mutateAsync({ id: row.id })}
                    onVoid={() => void voidMutation.mutateAsync(row.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DocTableShell>

      {share ? (
        <ShareBar
          kind="invoice"
          docId={share.id}
          doc={toUiInvoice(share, money.currency)}
          businessName={business?.name ?? "Business"}
          onClose={() => setShareId(null)}
        />
      ) : null}
    </>
  )
}

function QuoteRowMenu({
  row,
  onWhatsApp,
  onEmail,
  onSend,
  onAccept,
  onConvert,
}: {
  row: ApiQuotation
  onWhatsApp: () => void
  onEmail: () => void
  onSend: () => void
  onAccept: () => void
  onConvert: () => void
}) {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" aria-label="Actions" />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/documents/quotation/${row.id}`)}
        >
          <FileDown className="size-4" />
          Preview / PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onWhatsApp}>
          <MessageCircle className="size-4" />
          Send WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEmail}>
          <Mail className="size-4" />
          Send email
        </DropdownMenuItem>
        {row.status === "draft" || row.status === "sent" ? (
          <DropdownMenuItem onClick={onSend}>Mark sent</DropdownMenuItem>
        ) : null}
        {row.status === "draft" || row.status === "sent" ? (
          <DropdownMenuItem onClick={onAccept}>Mark accepted</DropdownMenuItem>
        ) : null}
        {row.status !== "converted" && row.status !== "expired" ? (
          <DropdownMenuItem onClick={onConvert}>Convert to invoice</DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InvoiceRowMenu({
  row,
  onWhatsApp,
  onEmail,
  onSend,
  onPaid,
  onVoid,
}: {
  row: ApiInvoice
  onWhatsApp: () => void
  onEmail: () => void
  onSend: () => void
  onPaid: () => void
  onVoid: () => void
}) {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" aria-label="Actions" />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/documents/invoice/${row.id}`)}
        >
          <FileDown className="size-4" />
          Preview / PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onWhatsApp}>
          <MessageCircle className="size-4" />
          Send WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEmail}>
          <Mail className="size-4" />
          Send email
        </DropdownMenuItem>
        {row.status === "draft" || row.status === "sent" || row.status === "overdue" ? (
          <DropdownMenuItem onClick={onSend}>Mark sent</DropdownMenuItem>
        ) : null}
        {row.status !== "paid" && row.status !== "void" ? (
          <DropdownMenuItem onClick={onPaid}>Mark paid</DropdownMenuItem>
        ) : null}
        {row.status !== "paid" && row.status !== "void" ? (
          <DropdownMenuItem variant="destructive" onClick={onVoid}>
            Void
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ShareBar({
  kind,
  docId,
  doc,
  businessName,
  onClose,
}: {
  kind: "quotation" | "invoice"
  /** API UUID for deep link */
  docId: string
  doc: Quotation | Invoice
  businessName: string
  onClose: () => void
}) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://workspace.kunemi.local"
  const link = `${origin}/documents/${kind === "quotation" ? "quotation" : "invoice"}/${docId}`
  const includeCard = doc.paymentMethods.includes("card")
  const includeTransfer = doc.paymentMethods.includes("transfer")

  const message = documentShareMessage({
    customer: doc.customer,
    docType: kind,
    docId: doc.id,
    total: doc.total,
    link,
    includeCardLink: includeCard,
    includeTransferDetails: includeTransfer,
  })

  return (
    <Card className="border-primary/30 bg-primary/5 animate-fade-in">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            Send {doc.id} via WhatsApp / email
          </p>
          <p className="text-xs text-muted-foreground">
            {includeTransfer
              ? "Bank transfer details in message"
              : "Share document preview link"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {kind === "quotation" ? (
            <DownloadPdfButton kind="quotation" data={doc as Quotation} />
          ) : (
            <DownloadPdfButton kind="invoice" data={doc as Invoice} />
          )}
          <CopyWhatsApp
            phone={doc.phone}
            message={message}
            label="Copy WhatsApp message"
          />
          {doc.email ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-2 bg-card"
              render={
                <a
                  href={`mailto:${doc.email}?subject=${encodeURIComponent(
                    `${businessName} ${kind} ${doc.id}`,
                  )}&body=${encodeURIComponent(message)}`}
                />
              }
            >
              <Mail className="size-4" />
              Email
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DocTableShell({
  filter,
  onFilter,
  filters,
  query,
  onQuery,
  placeholder,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  count,
  total,
  footerNote,
  children,
  loading,
  error,
  onRefresh,
}: {
  filter: string
  onFilter: (v: string) => void
  filters: { key: string; label: string }[]
  query: string
  onQuery: (v: string) => void
  placeholder: string
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  count: number
  total: number
  footerNote: string
  children: React.ReactNode
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={filter} onValueChange={onFilter}>
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
          {onRefresh ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Refresh
            </Button>
          ) : null}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <p className="text-xs text-muted-foreground">Live from API</p>
      </div>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : count === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              actionLabel={total > 0 ? "Clear filters" : undefined}
              onAction={
                total > 0
                  ? () => {
                      onFilter("all")
                      onQuery("")
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-medium tabular-nums text-foreground">{count}</span> of{" "}
          <span className="tabular-nums">{total}</span>
        </span>
        <p className="hidden text-xs md:block">{footerNote}</p>
      </CardFooter>
    </Card>
  )
}
