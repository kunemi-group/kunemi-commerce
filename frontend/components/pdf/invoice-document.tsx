import { Document, Page, Text, View } from "@react-pdf/renderer"
import { business, type Invoice } from "@/lib/data"
import { computeDocTotals } from "@/lib/pdf/totals"
import { createPdfStyles } from "./styles"
import {
  PdfBrandHeader,
  PdfFooter,
  PdfLineTable,
  PdfMeta,
  PdfParties,
  PdfPaymentBox,
  PdfTotals,
} from "./shared-parts"
import type { BrandingState } from "@/lib/branding"

export function InvoiceDocument({
  invoice,
  branding,
}: {
  invoice: Invoice
  branding: Pick<
    BrandingState,
    "brandColor" | "logoDataUrl" | "taxEnabled" | "taxRatePercent" | "taxLabel"
  >
}) {
  const styles = createPdfStyles(branding.brandColor)
  const currency = invoice.currency || business.currency || "NGN"
  const totals = computeDocTotals({
    lines: invoice.lines,
    statedTotal: invoice.total,
    shippingFee: invoice.shippingFee,
    taxEnabled: branding.taxEnabled,
    taxRatePercent: branding.taxRatePercent,
    taxLabel: branding.taxLabel,
    amountPaid: invoice.amountPaid,
    currency,
  })
  const isPaid = invoice.status === "paid"
  const showTransfer = invoice.paymentMethods.includes("transfer")
  const showCard = invoice.paymentMethods.includes("card")

  const meta = [
    { label: "Issue date", value: invoice.issueDate ?? invoice.created },
    { label: "Due date", value: invoice.dueDate },
    ...(invoice.orderId ? [{ label: "Order", value: invoice.orderId }] : []),
    ...(invoice.quoteId ? [{ label: "Quote ref", value: invoice.quoteId }] : []),
    { label: "Prepared by", value: invoice.owner },
    { label: "Currency", value: currency },
    {
      label: "Tax",
      value: branding.taxEnabled
        ? `${branding.taxLabel} ${branding.taxRatePercent}%`
        : "None",
    },
  ]

  return (
    <Document
      title={`${invoice.id} · Invoice · ${business.name}`}
      author={business.name}
      subject={`Invoice for ${invoice.customer}`}
    >
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader
          styles={styles}
          brandColor={branding.brandColor}
          logoDataUrl={branding.logoDataUrl}
          title="INVOICE"
          docId={invoice.id}
          status={invoice.status}
        />

        <PdfParties
          styles={styles}
          billLabel="Bill to"
          customer={invoice.customer}
          email={invoice.email}
          phone={invoice.phone}
          address={invoice.address}
        />

        <PdfMeta styles={styles} items={meta} />

        <PdfLineTable styles={styles} lines={invoice.lines} currency={currency} />

        <PdfTotals styles={styles} totals={totals} mode={isPaid ? "paid" : "due"} />

        {isPaid ? (
          <View style={styles.paymentBox} wrap={false}>
            <Text style={styles.paymentLine}>
              <Text style={styles.paymentStrong}>Payment received. </Text>
              Thank you — no further action required.
            </Text>
          </View>
        ) : (
          <PdfPaymentBox
            styles={styles}
            title="Payment instructions"
            showTransfer={showTransfer}
            showCard={showCard}
            reference={invoice.id}
          />
        )}

        {invoice.notes ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{invoice.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.thankYou}>
          Questions? WhatsApp {business.whatsapp} or email {business.email}.
        </Text>

        <PdfFooter styles={styles} docId={invoice.id} />
      </Page>
    </Document>
  )
}
