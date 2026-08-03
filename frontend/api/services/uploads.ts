import { apiClient, toApiError } from "../client"
import type { UploadResult } from "../types"

export type UploadPurpose =
  | "product"
  | "variant"
  | "brand"
  | "document"
  | "payment_proof"
  | "misc"

export async function uploadBase64(payload: {
  base64: string
  purpose: UploadPurpose
  contentType?: string
  filename?: string
}): Promise<UploadResult> {
  try {
    const { data } = await apiClient.post<UploadResult>("/uploads", payload)
    return data
  } catch (e) {
    throw toApiError(e)
  }
}

/** Read a File as data URL for POST /uploads */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.readAsDataURL(file)
  })
}

export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
): Promise<UploadResult> {
  const base64 = await fileToDataUrl(file)
  return uploadBase64({
    base64,
    purpose,
    contentType: file.type || undefined,
    filename: file.name,
  })
}
