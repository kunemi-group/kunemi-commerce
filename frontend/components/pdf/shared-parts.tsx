import { Image, Text, View } from "@react-pdf/renderer"
import { business, type QuoteLine } from "@/lib/data"
import { brandInitials } from "@/lib/branding"
import { formatMoney, lineTotal } from "@/lib/pdf/money"
import type { PdfStyles } from "./styles"
import type { DocTotals } from "@/lib/pdf/totals"

/** Rows per "page chunk" that re-print the table header for multi-page docs */
export const PDF_TABLE_CHUNK = 18

export function PdfBrandHeader({
  styles,
  brandColor,
  logoDataUrl,
  title,
  docId,
  status,
}: {
  styles: PdfStyles
  brandColor: string
  logoDataUrl: string | null
  title: string
  docId: string
  status: string
}) {
  return (
    <>
      <View style={styles.headerRow} wrap={false}>
        <View style={styles.brandBlock}>
          {logoDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image src={logoDataUrl} style={styles.logoImage} />
          ) : (
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>{brandInitials()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.brandName}>{business.name}</Text>
            <Text style={styles.brandMeta}>{business.address}</Text>
            <Text style={styles.brandMeta}>
              {business.email} · {business.whatsapp}
            </Text>
          </View>
        </View>
        <View style={styles.docTitleBlock}>
          <Text style={styles.docTitle}>{title}</Text>
          <Text style={styles.docId}>{docId}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.accentBar} />
    </>
  )
}

export function PdfParties({
  styles,
  billLabel,
  customer,
  email,
  phone,
  address,
}: {
  styles: PdfStyles
  billLabel: string
  customer: string
  email?: string
  phone?: string
  address?: string
}) {
  return (
    <View style={styles.partiesRow} wrap={false}>
      <View style={styles.partyCard}>
        <Text style={styles.partyLabel}>From</Text>
        <Text style={styles.partyName}>{business.name}</Text>
        <Text style={styles.partyLine}>{business.address}</Text>
        <Text style={styles.partyLine}>{business.email}</Text>
        <Text style={styles.partyLine}>{business.whatsapp}</Text>
      </View>
      <View style={styles.partyCard}>
        <Text style={styles.partyLabel}>{billLabel}</Text>
        <Text style={styles.partyName}>{customer}</Text>
        {address ? <Text style={styles.partyLine}>{address}</Text> : null}
        {email ? <Text style={styles.partyLine}>{email}</Text> : null}
        {phone ? <Text style={styles.partyLine}>{phone}</Text> : null}
      </View>
    </View>
  )
}

export function PdfMeta({
  styles,
  items,
}: {
  styles: PdfStyles
  items: { label: string; value: string }[]
}) {
  return (
    <View style={styles.metaRow} wrap={false}>
      {items.map((item) => (
        <View key={item.label} style={styles.metaChip}>
          <Text style={styles.metaLabel}>{item.label}</Text>
          <Text style={styles.metaValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  )
}

function TableHeader({ styles }: { styles: PdfStyles }) {
  return (
    <View style={styles.tableHeader} wrap={false}>
      <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
      <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
      <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit price</Text>
      <Text style={[styles.tableHeaderCell, styles.colTotal]}>Amount</Text>
    </View>
  )
}

/**
 * Multi-page safe line table: header re-prints every PDF_TABLE_CHUNK rows
 * so long quotes/invoices stay readable across pages.
 */
export function PdfLineTable({
  styles,
  lines,
}: {
  styles: PdfStyles
  lines: QuoteLine[]
}) {
  const chunks: QuoteLine[][] = []
  for (let i = 0; i < lines.length; i += PDF_TABLE_CHUNK) {
    chunks.push(lines.slice(i, i + PDF_TABLE_CHUNK))
  }
  if (chunks.length === 0) chunks.push([])

  return (
    <View style={styles.table}>
      {chunks.map((chunk, chunkIndex) => (
        <View key={`chunk-${chunkIndex}`} wrap={false}>
          <TableHeader styles={styles} />
          {chunk.map((line, i) => {
            const globalIndex = chunkIndex * PDF_TABLE_CHUNK + i
            const amount = lineTotal(line.qty, line.unitPrice)
            return (
              <View
                key={`${line.name}-${globalIndex}`}
                style={
                  globalIndex % 2 === 1
                    ? [styles.tableRow, styles.tableRowAlt]
                    : styles.tableRow
                }
              >
                <Text style={[styles.cell, styles.colItem]}>
                  {line.name}
                  {line.taxExempt ? "  · Tax-free" : ""}
                </Text>
                <Text style={[styles.cell, styles.colQty]}>{line.qty}</Text>
                <Text style={[styles.cellMuted, styles.colPrice]}>{line.unitPrice}</Text>
                <Text style={[styles.cell, styles.colTotal]}>
                  {amount ? formatMoney(amount) : "—"}
                </Text>
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

export function PdfTotals({
  styles,
  totals,
  mode = "total",
}: {
  styles: PdfStyles
  totals: DocTotals
  /** total = quote; due = open invoice; paid = settled invoice */
  mode?: "total" | "due" | "paid"
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
    <View style={styles.totalsBlock} wrap={false}>
      <View style={styles.totalsRow}>
        <Text style={styles.totalsLabel}>Merchandise</Text>
        <Text style={styles.totalsValue}>{totals.subtotalLabel}</Text>
      </View>
      {totals.hasExemptLines ? (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Tax-free items</Text>
          <Text style={styles.totalsValue}>{totals.exemptLabel}</Text>
        </View>
      ) : null}
      {totals.hasExemptLines ? (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Taxable items</Text>
          <Text style={styles.totalsValue}>{totals.taxableLabel}</Text>
        </View>
      ) : null}
      {totals.hasShipping ? (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Shipping</Text>
          <Text style={styles.totalsValue}>{totals.shippingLabel}</Text>
        </View>
      ) : null}
      <View style={styles.totalsRow}>
        <Text style={styles.totalsLabel}>{totals.taxName}</Text>
        <Text style={styles.totalsValue}>{totals.taxAmountLabel}</Text>
      </View>
      {totals.paid > 0 ? (
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Amount paid</Text>
          <Text style={styles.totalsValue}>{totals.paidLabel}</Text>
        </View>
      ) : null}
      <View style={styles.grandRow}>
        <Text style={styles.grandLabel}>{grandLabel}</Text>
        <Text style={styles.grandValue}>{grandValue}</Text>
      </View>
    </View>
  )
}

export function PdfPaymentBox({
  styles,
  title,
  showTransfer,
  showCard,
  reference,
  children,
}: {
  styles: PdfStyles
  title: string
  showTransfer: boolean
  showCard: boolean
  reference: string
  children?: React.ReactNode
}) {
  const bank = business.payments.bank
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.paymentBox}>
        {children}
        {showTransfer ? (
          <>
            <Text style={styles.paymentLine}>
              <Text style={styles.paymentStrong}>Bank transfer: </Text>
              {bank.bankName}
            </Text>
            <Text style={styles.paymentLine}>Account name: {bank.accountName}</Text>
            <Text style={styles.paymentLine}>
              Account number: {bank.accountNumber}
            </Text>
            <Text style={[styles.paymentLine, { color: "#64748b", marginTop: 3 }]}>
              Reference {reference}. Upload proof of payment after transfer.
            </Text>
          </>
        ) : null}
        {showCard ? (
          <Text style={[styles.paymentLine, { marginTop: showTransfer ? 5 : 0 }]}>
            <Text style={styles.paymentStrong}>Card: </Text>
            Request a secure payment link from {business.name}.
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export function PdfFooter({ styles, docId }: { styles: PdfStyles; docId: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {business.name} · {docId} · Generated with Kunemi Workspace
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}
