import type { Invoice, Quotation, QuoteLine } from "@/lib/data"
import { formatMoney, minorToMajor, relativeTime } from "./format"
import type { ApiInvoice, ApiQuotation } from "./types"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function mapLines(
  items: Array<{
    description: string
    quantity: number
    unitPriceCents: number
    taxExempt: boolean
  }>,
  currency: string,
): QuoteLine[] {
  return items.map((i) => ({
    name: i.description,
    qty: i.quantity,
    unitPrice: formatMoney(i.unitPriceCents, currency),
    taxExempt: i.taxExempt,
  }))
}

/** Map API quotation → PDF / share UI shape (lib/data Quotation). */
export function toUiQuotation(q: ApiQuotation, currency = "NGN"): Quotation {
  return {
    id: q.reference,
    customer: q.customerName,
    email: q.customerEmail ?? undefined,
    phone: q.customerPhone ?? undefined,
    address: q.deliveryAddress ?? undefined,
    total: formatMoney(q.totalCents, currency),
    status: q.status,
    validUntil: formatDate(q.validUntil),
    channel: (q.channel as Quotation["channel"]) || "whatsapp",
    paymentMethods: q.paymentMethods?.length ? q.paymentMethods : ["transfer"],
    lines: mapLines(q.items ?? [], currency),
    shippingFee: minorToMajor(q.shippingFeeCents, currency),
    currency,
    created: relativeTime(q.createdAt),
    owner: q.ownerName ?? "—",
    notes: q.notes ?? undefined,
    issueDate: formatDate(q.createdAt),
  }
}

/** Map API invoice → PDF / share UI shape. */
export function toUiInvoice(inv: ApiInvoice, currency = "NGN"): Invoice {
  return {
    id: inv.reference,
    customer: inv.customerName,
    email: inv.customerEmail ?? undefined,
    phone: inv.customerPhone ?? undefined,
    address: inv.deliveryAddress ?? undefined,
    total: formatMoney(inv.totalCents, currency),
    status: inv.status,
    dueDate: formatDate(inv.dueAt),
    channel: (inv.channel as Invoice["channel"]) || "whatsapp",
    paymentMethods: inv.paymentMethods?.length
      ? inv.paymentMethods
      : ["transfer"],
    orderId: inv.orderId ?? undefined,
    quoteId: inv.quotationId ?? undefined,
    created: relativeTime(inv.createdAt),
    owner: inv.ownerName ?? "—",
    lines: mapLines(inv.items ?? [], currency),
    shippingFee: minorToMajor(inv.shippingFeeCents, currency),
    currency,
    notes: inv.notes ?? undefined,
    issueDate: formatDate(inv.createdAt),
    amountPaid:
      inv.amountPaidCents > 0
        ? formatMoney(inv.amountPaidCents, currency)
        : undefined,
  }
}
