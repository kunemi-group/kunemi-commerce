import { StyleSheet } from "@react-pdf/renderer"
import { brandSoft } from "@/lib/branding"

export const baseColors = {
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  surface: "#f8fafc",
  success: "#059669",
  white: "#ffffff",
}

export function createPdfStyles(brandColor: string) {
  const primary = brandColor || "#4f6bed"
  const primarySoft = brandSoft(primary, 0.14)

  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      color: baseColors.ink,
      paddingTop: 40,
      paddingBottom: 56,
      paddingHorizontal: 40,
      backgroundColor: baseColors.white,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
    },
    brandBlock: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      maxWidth: "58%",
    },
    logoMark: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: primary,
      alignItems: "center",
      justifyContent: "center",
    },
    logoImage: {
      width: 40,
      height: 40,
      borderRadius: 8,
      objectFit: "cover",
    },
    logoMarkText: {
      color: baseColors.white,
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
    },
    brandName: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: baseColors.ink,
    },
    brandMeta: {
      fontSize: 8,
      color: baseColors.muted,
      marginTop: 2,
      maxWidth: 220,
    },
    docTitleBlock: {
      alignItems: "flex-end",
    },
    docTitle: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      color: primary,
      letterSpacing: 0.5,
    },
    docId: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      marginTop: 4,
    },
    statusPill: {
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: primarySoft,
    },
    statusText: {
      fontSize: 8,
      color: primary,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
    },
    accentBar: {
      height: 3,
      backgroundColor: primary,
      borderRadius: 2,
      marginBottom: 18,
    },
    partiesRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    partyCard: {
      flex: 1,
      backgroundColor: baseColors.surface,
      borderRadius: 6,
      padding: 10,
      borderWidth: 1,
      borderColor: baseColors.line,
    },
    partyLabel: {
      fontSize: 8,
      color: baseColors.muted,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 5,
    },
    partyName: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      marginBottom: 3,
    },
    partyLine: {
      fontSize: 9,
      color: baseColors.muted,
      marginTop: 2,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 14,
    },
    metaChip: {
      backgroundColor: baseColors.surface,
      borderWidth: 1,
      borderColor: baseColors.line,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      minWidth: 90,
    },
    metaLabel: {
      fontSize: 7,
      color: baseColors.muted,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    metaValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
    },
    table: {
      marginTop: 2,
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: baseColors.ink,
      borderRadius: 4,
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      color: baseColors.white,
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: baseColors.line,
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    tableRowAlt: {
      backgroundColor: baseColors.surface,
    },
    colItem: { width: "46%" },
    colQty: { width: "12%", textAlign: "right" },
    colPrice: { width: "21%", textAlign: "right" },
    colTotal: { width: "21%", textAlign: "right" },
    cell: { fontSize: 9 },
    cellMuted: { fontSize: 9, color: baseColors.muted },
    totalsBlock: {
      marginTop: 6,
      marginLeft: "auto",
      width: 210,
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    totalsLabel: {
      fontSize: 9,
      color: baseColors.muted,
    },
    totalsValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
    },
    grandRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 5,
      paddingTop: 7,
      borderTopWidth: 2,
      borderTopColor: baseColors.ink,
    },
    grandLabel: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
    },
    grandValue: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: primary,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      marginBottom: 6,
      marginTop: 6,
    },
    paymentBox: {
      borderWidth: 1,
      borderColor: baseColors.line,
      borderRadius: 6,
      padding: 10,
      backgroundColor: baseColors.surface,
      marginBottom: 12,
    },
    paymentLine: {
      fontSize: 9,
      marginBottom: 3,
    },
    paymentStrong: {
      fontFamily: "Helvetica-Bold",
    },
    notes: {
      fontSize: 9,
      color: baseColors.muted,
      lineHeight: 1.4,
      marginBottom: 12,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: baseColors.line,
      paddingTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerText: {
      fontSize: 7,
      color: baseColors.muted,
    },
    thankYou: {
      marginTop: 8,
      fontSize: 9,
      color: baseColors.muted,
      fontStyle: "italic",
    },
  })
}

export type PdfStyles = ReturnType<typeof createPdfStyles>
