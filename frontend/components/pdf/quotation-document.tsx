import { Document, Page, Text, View } from "@react-pdf/renderer"
import { business, type Quotation } from "@/lib/data"
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

export function QuotationDocument({
  quote,
  branding,
}: {
  quote: Quotation
  branding: Pick<
    BrandingState,
    "brandColor" | "logoDataUrl" | "taxEnabled" | "taxRatePercent" | "taxLabel"
  >
}) {
  const styles = createPdfStyles(branding.brandColor)
  const currency = quote.currency || business.currency || "NGN"
  const totals = computeDocTotals({
    lines: quote.lines,
    statedTotal: quote.total,
    shippingFee: quote.shippingFee,
    taxEnabled: branding.taxEnabled,
    taxRatePercent: branding.taxRatePercent,
    taxLabel: branding.taxLabel,
    currency,
  })
  const showTransfer = quote.paymentMethods.includes("transfer")
  const showCard = quote.paymentMethods.includes("card")

  return (
    <Document
      title={`${quote.id} · Quotation · ${business.name}`}
      author={business.name}
      subject={`Quotation for ${quote.customer}`}
    >
      <Page size="A4" style={styles.page}>
        <PdfBrandHeader
          styles={styles}
          brandColor={branding.brandColor}
          logoDataUrl={branding.logoDataUrl}
          title="QUOTATION"
          docId={quote.id}
          status={quote.status}
        />

        <PdfParties
          styles={styles}
          billLabel="Quote for"
          customer={quote.customer}
          email={quote.email}
          phone={quote.phone}
          address={quote.address}
        />

        <PdfMeta
          styles={styles}
          items={[
            { label: "Issue date", value: quote.issueDate ?? quote.created },
            { label: "Valid until", value: quote.validUntil },
            { label: "Prepared by", value: quote.owner },
            { label: "Currency", value: currency },
            {
              label: "Tax",
              value: branding.taxEnabled
                ? `${branding.taxLabel} ${branding.taxRatePercent}%`
                : "None",
            },
          ]}
        />

        <PdfLineTable styles={styles} lines={quote.lines} currency={currency} />

        <PdfTotals styles={styles} totals={totals} mode="total" />

        <PdfPaymentBox
          styles={styles}
          title="How to accept & pay"
          showTransfer={showTransfer}
          showCard={showCard}
          reference={quote.id}
        />

        {quote.notes ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{quote.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.thankYou}>
          Thank you for considering {business.name}. This quotation is not a tax invoice.
        </Text>

        <PdfFooter styles={styles} docId={quote.id} />
      </Page>
    </Document>
  )
}
