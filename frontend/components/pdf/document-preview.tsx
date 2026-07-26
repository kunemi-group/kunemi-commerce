"use client"

import { business, type Invoice, type Quotation, type QuoteLine } from "@/lib/data"
import { brandInitials, brandSoft } from "@/lib/branding"
import { useBranding } from "@/lib/branding-context"
import { formatMoney, lineTotal } from "@/lib/pdf/money"
import { computeDocTotals } from "@/lib/pdf/totals"
import { cn } from "@/lib/utils"

export function QuotationPreview({ quote }: { quote: Quotation }) {
  const branding = useBranding()
  const totals = computeDocTotals({
    lines: quote.lines,
    statedTotal: quote.total,
    shippingFee: quote.shippingFee,
    taxEnabled: branding.taxEnabled,
    taxRatePercent: branding.taxRatePercent,
    taxLabel: branding.taxLabel,
  })

  return (
    <DocumentShell branding={branding}>
      <DocHeader
        title="QUOTATION"
        id={quote.id}
        status={quote.status}
        brandColor={branding.brandColor}
        logoDataUrl={branding.logoDataUrl}
      />
      <Parties
        billLabel="Quote for"
        customer={quote.customer}
        email={quote.email}
        phone={quote.phone}
        address={quote.address}
      />
      <Meta
        items={[
          { label: "Issue date", value: quote.issueDate ?? quote.created },
          { label: "Valid until", value: quote.validUntil },
          { label: "Prepared by", value: quote.owner },
          { label: "Currency", value: business.currency },
          {
            label: "Tax",
            value: branding.taxEnabled
              ? `${branding.taxLabel} ${branding.taxRatePercent}%`
              : "None",
          },
        ]}
      />
      <LineTable lines={quote.lines} brandColor={branding.brandColor} />
      <TotalsBlock
        totals={totals}
        mode="total"
        brandColor={branding.brandColor}
      />
      <PaymentBlock
        title="How to accept & pay"
        showTransfer={quote.paymentMethods.includes("transfer")}
        showCard={quote.paymentMethods.includes("card")}
        reference={quote.id}
      />
      {quote.notes ? <Notes text={quote.notes} /> : null}
      <p className="mt-8 text-xs italic text-slate-500">
        Thank you for considering {business.name}. This quotation is not a tax invoice.
      </p>
      <Footer id={quote.id} />
    </DocumentShell>
  )
}

export function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const branding = useBranding()
  const totals = computeDocTotals({
    lines: invoice.lines,
    statedTotal: invoice.total,
    shippingFee: invoice.shippingFee,
    taxEnabled: branding.taxEnabled,
    taxRatePercent: branding.taxRatePercent,
    taxLabel: branding.taxLabel,
    amountPaid: invoice.amountPaid,
  })
  const isPaid = invoice.status === "paid"

  return (
    <DocumentShell branding={branding}>
      <DocHeader
        title="INVOICE"
        id={invoice.id}
        status={invoice.status}
        brandColor={branding.brandColor}
        logoDataUrl={branding.logoDataUrl}
      />
      <Parties
        billLabel="Bill to"
        customer={invoice.customer}
        email={invoice.email}
        phone={invoice.phone}
        address={invoice.address}
      />
      <Meta
        items={[
          { label: "Issue date", value: invoice.issueDate ?? invoice.created },
          { label: "Due date", value: invoice.dueDate },
          ...(invoice.orderId ? [{ label: "Order", value: invoice.orderId }] : []),
          ...(invoice.quoteId ? [{ label: "Quote ref", value: invoice.quoteId }] : []),
          { label: "Prepared by", value: invoice.owner },
          {
            label: "Tax",
            value: branding.taxEnabled
              ? `${branding.taxLabel} ${branding.taxRatePercent}%`
              : "None",
          },
        ]}
      />
      <LineTable lines={invoice.lines} brandColor={branding.brandColor} />
      <TotalsBlock
        totals={totals}
        mode={isPaid ? "paid" : "due"}
        brandColor={branding.brandColor}
      />
      {isPaid ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Payment received. Thank you — no further action required.
        </div>
      ) : (
        <PaymentBlock
          title="Payment instructions"
          showTransfer={invoice.paymentMethods.includes("transfer")}
          showCard={invoice.paymentMethods.includes("card")}
          reference={invoice.id}
        />
      )}
      {invoice.notes ? <Notes text={invoice.notes} /> : null}
      <p className="mt-8 text-xs italic text-slate-500">
        Questions? WhatsApp {business.whatsapp} or email {business.email}.
      </p>
      <Footer id={invoice.id} />
    </DocumentShell>
  )
}

function DocumentShell({
  children,
  branding,
}: {
  children: React.ReactNode
  branding: { brandColor: string }
}) {
  return (
    <article className="mx-auto w-full max-w-[210mm] rounded-xl bg-white text-slate-900 shadow-2xl ring-1 ring-black/10 print:shadow-none print:ring-0">
      <div
        className="h-1.5 rounded-t-xl"
        style={{ backgroundColor: branding.brandColor }}
      />
      <div className="p-8 sm:p-10">{children}</div>
    </article>
  )
}

function DocHeader({
  title,
  id,
  status,
  brandColor,
  logoDataUrl,
}: {
  title: string
  id: string
  status: string
  brandColor: string
  logoDataUrl: string | null
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoDataUrl}
            alt={`${business.name} logo`}
            className="size-11 rounded-lg object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div
            className="flex size-11 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: brandColor }}
          >
            {brandInitials()}
          </div>
        )}
        <div>
          <p className="font-semibold tracking-tight">{business.name}</p>
          <p className="text-xs text-slate-500">{business.address}</p>
          <p className="text-xs text-slate-500">
            {business.email} · {business.whatsapp}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className="text-2xl font-bold tracking-wide"
          style={{ color: brandColor }}
        >
          {title}
        </p>
        <p className="mt-1 font-semibold tabular-nums">{id}</p>
        <span
          className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: brandSoft(brandColor, 0.14),
            color: brandColor,
          }}
        >
          {status}
        </span>
      </div>
    </header>
  )
}

function Parties({
  billLabel,
  customer,
  email,
  phone,
  address,
}: {
  billLabel: string
  customer: string
  email?: string
  phone?: string
  address?: string
}) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          From
        </p>
        <p className="mt-1 font-semibold">{business.name}</p>
        <p className="mt-1 text-xs text-slate-500">{business.address}</p>
        <p className="text-xs text-slate-500">{business.email}</p>
        <p className="text-xs text-slate-500">{business.whatsapp}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {billLabel}
        </p>
        <p className="mt-1 font-semibold">{customer}</p>
        {address ? <p className="mt-1 text-xs text-slate-500">{address}</p> : null}
        {email ? <p className="text-xs text-slate-500">{email}</p> : null}
        {phone ? <p className="text-xs text-slate-500">{phone}</p> : null}
      </div>
    </div>
  )
}

function Meta({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[7rem] rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <p className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="text-sm font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function LineTable({
  lines,
  brandColor,
}: {
  lines: QuoteLine[]
  brandColor: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-left text-[10px] uppercase tracking-wide text-white">
            <th className="px-3 py-2.5 font-semibold">Item</th>
            <th className="px-3 py-2.5 text-right font-semibold">Qty</th>
            <th className="px-3 py-2.5 text-right font-semibold">Unit price</th>
            <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => {
            const amount = lineTotal(line.qty, line.unitPrice)
            return (
              <tr
                key={`${line.name}-${i}`}
                className={cn(
                  "border-t border-slate-200",
                  i % 2 === 1 && "bg-slate-50",
                )}
              >
                <td className="px-3 py-2.5">
                  {line.name}
                  {line.taxExempt ? (
                    <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      Tax-free
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{line.qty}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">
                  {line.unitPrice}
                </td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                  {amount ? formatMoney(amount) : "—"}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: brandSoft(brandColor, 0.08) }}>
            <td
              colSpan={4}
              className="px-3 py-2 text-[10px] text-slate-500"
            >
              {lines.length} line item{lines.length === 1 ? "" : "s"} · long lists
              paginate in the PDF download
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function TotalsBlock({
  totals,
  mode,
  brandColor,
}: {
  totals: ReturnType<typeof computeDocTotals>
  mode: "total" | "due" | "paid"
  brandColor: string
}) {
  const grandLabel =
    mode === "paid" ? "Paid in full" : mode === "due" ? "Amount due" : "Total"
  const grandValue =
    mode === "paid"
      ? totals.totalLabel
      : mode === "due"
        ? totals.balanceLabel
        : totals.totalLabel

  return (
    <div className="ml-auto mt-6 w-full max-w-[260px] space-y-2 text-sm">
      <div className="flex justify-between text-slate-500">
        <span>Merchandise</span>
        <span className="font-medium text-slate-900 tabular-nums">
          {totals.subtotalLabel}
        </span>
      </div>
      {totals.hasExemptLines ? (
        <div className="flex justify-between text-slate-500">
          <span>Tax-free items</span>
          <span className="font-medium text-slate-900 tabular-nums">
            {totals.exemptLabel}
          </span>
        </div>
      ) : null}
      {totals.hasExemptLines ? (
        <div className="flex justify-between text-slate-500">
          <span>Taxable items</span>
          <span className="font-medium text-slate-900 tabular-nums">
            {totals.taxableLabel}
          </span>
        </div>
      ) : null}
      {totals.hasShipping ? (
        <div className="flex justify-between text-slate-500">
          <span>Shipping</span>
          <span className="font-medium text-slate-900 tabular-nums">
            {totals.shippingLabel}
          </span>
        </div>
      ) : null}
      <div className="flex justify-between text-slate-500">
        <span>{totals.taxName}</span>
        <span className="font-medium text-slate-900 tabular-nums">
          {totals.taxAmountLabel}
        </span>
      </div>
      {totals.paid > 0 ? (
        <div className="flex justify-between text-slate-500">
          <span>Amount paid</span>
          <span className="font-medium text-slate-900 tabular-nums">
            {totals.paidLabel}
          </span>
        </div>
      ) : null}
      <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-semibold">
        <span>{grandLabel}</span>
        <span className="tabular-nums" style={{ color: brandColor }}>
          {grandValue}
        </span>
      </div>
    </div>
  )
}

function PaymentBlock({
  title,
  showTransfer,
  showCard,
  reference,
}: {
  title: string
  showTransfer: boolean
  showCard: boolean
  reference: string
}) {
  const bank = business.payments.bank
  return (
    <section className="mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        {showTransfer ? (
          <div className="space-y-1">
            <p>
              <span className="font-semibold">Bank transfer:</span> {bank.bankName}
            </p>
            <p>
              Account name: <span className="font-medium">{bank.accountName}</span>
            </p>
            <p>
              Account number:{" "}
              <span className="font-medium tabular-nums">{bank.accountNumber}</span>
            </p>
            <p className="text-xs text-slate-500">
              Use reference {reference}. Upload proof of payment after transfer.
            </p>
          </div>
        ) : null}
        {showCard ? (
          <p className={showTransfer ? "mt-3" : undefined}>
            <span className="font-semibold">Card:</span> Request a secure payment link
            from {business.name}.
          </p>
        ) : null}
      </div>
    </section>
  )
}

function Notes({ text }: { text: string }) {
  return (
    <section className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Notes
      </h3>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </section>
  )
}

function Footer({ id }: { id: string }) {
  return (
    <footer className="mt-10 border-t border-slate-200 pt-4 text-[10px] text-slate-400">
      {business.name} · {id} · Generated with Kunemi Workspace
    </footer>
  )
}
