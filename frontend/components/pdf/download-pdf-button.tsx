"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuotationDocument } from "./quotation-document"
import { InvoiceDocument } from "./invoice-document"
import type { Invoice, Quotation } from "@/lib/data"
import { useBranding } from "@/lib/branding-context"

type Props =
  | { kind: "quotation"; data: Quotation; size?: "sm" | "default"; className?: string }
  | { kind: "invoice"; data: Invoice; size?: "sm" | "default"; className?: string }

export function DownloadPdfButton(props: Props) {
  const [busy, setBusy] = useState(false)
  const size = props.size ?? "sm"
  const branding = useBranding()

  async function handleDownload() {
    setBusy(true)
    try {
      const brandSlice = {
        brandColor: branding.brandColor,
        logoDataUrl: branding.logoDataUrl,
        taxEnabled: branding.taxEnabled,
        taxRatePercent: branding.taxRatePercent,
        taxLabel: branding.taxLabel,
      }
      const doc =
        props.kind === "quotation" ? (
          <QuotationDocument quote={props.data} branding={brandSlice} />
        ) : (
          <InvoiceDocument invoice={props.data} branding={brandSlice} />
        )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${props.data.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF generation failed", err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      className={props.className ?? "gap-2 bg-card"}
      onClick={handleDownload}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {busy ? "Generating…" : "Download PDF"}
    </Button>
  )
}
