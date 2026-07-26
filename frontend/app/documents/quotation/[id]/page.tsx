"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuotationPreview } from "@/components/pdf/document-preview"
import { DownloadPdfButton } from "@/components/pdf/download-pdf-button"
import { getApiErrorMessage, toUiQuotation, useQuotation } from "@/api"

export default function QuotationDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const decoded = decodeURIComponent(id)
  const { data, isLoading, error } = useQuotation(decoded)

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading quotation…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="text-lg font-semibold">Quotation not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ? getApiErrorMessage(error) : `No data for ${decoded}.`}
        </p>
        <Button className="mt-4" variant="outline" render={<Link href="/quotations" />}>
          Back to quotations
        </Button>
      </div>
    )
  }

  const quote = toUiQuotation(data)

  return (
    <div className="min-h-svh bg-zinc-950 print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            render={<Link href="/quotations" />}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">PDF template preview</p>
            <p className="text-xs text-muted-foreground">
              {quote.id} · A4 quotation layout
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 bg-card"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            Print
          </Button>
          <DownloadPdfButton kind="quotation" data={quote} />
        </div>
      </div>

      <div className="px-4 py-8 print:p-0">
        <QuotationPreview quote={quote} />
      </div>
    </div>
  )
}
