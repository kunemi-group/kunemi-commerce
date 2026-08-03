import { apiClient, toApiError } from "../client"
import type {
  ApiInvoiceDoc,
  ApiQuotation,
  CreateDocumentPayload,
} from "../types"

export async function listQuotations() {
  try {
    const { data } = await apiClient.get<{ quotations: ApiQuotation[] }>(
      "/quotations",
    )
    return data.quotations ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function getQuotation(id: string) {
  try {
    const { data } = await apiClient.get<ApiQuotation>(`/quotations/${id}`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function createQuotation(payload: CreateDocumentPayload) {
  try {
    const { data } = await apiClient.post<ApiQuotation>("/quotations", payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function sendQuotation(id: string) {
  try {
    const { data } = await apiClient.patch<ApiQuotation>(
      `/quotations/${id}/send`,
      {},
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function acceptQuotation(id: string) {
  try {
    const { data } = await apiClient.patch<ApiQuotation>(
      `/quotations/${id}/accept`,
      {},
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function convertQuotationToInvoice(id: string) {
  try {
    const { data } = await apiClient.post<ApiInvoiceDoc>(
      `/quotations/${id}/convert-to-invoice`,
      {},
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function listInvoices() {
  try {
    const { data } = await apiClient.get<{ invoices: ApiInvoiceDoc[] }>(
      "/invoices",
    )
    return data.invoices ?? []
  } catch (e) {
    throw toApiError(e)
  }
}

export async function getInvoice(id: string) {
  try {
    const { data } = await apiClient.get<ApiInvoiceDoc>(`/invoices/${id}`)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function createInvoice(payload: CreateDocumentPayload) {
  try {
    const { data } = await apiClient.post<ApiInvoiceDoc>("/invoices", payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function sendInvoice(id: string) {
  try {
    const { data } = await apiClient.patch<ApiInvoiceDoc>(
      `/invoices/${id}/send`,
      {},
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function markInvoicePaid(
  id: string,
  body?: { amountPaidCents?: number; notes?: string },
) {
  try {
    const { data } = await apiClient.patch<ApiInvoiceDoc>(
      `/invoices/${id}/mark-paid`,
      body ?? {},
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

export async function voidInvoice(id: string) {
  try {
    const { data } = await apiClient.patch<ApiInvoiceDoc>(
      `/invoices/${id}/void`,
      {},
    )
    return data
  } catch (e) {
    throw toApiError(e)
  }
}
