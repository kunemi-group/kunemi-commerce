import { business } from "@/lib/data"

export type BrandingState = {
  brandColor: string
  logoDataUrl: string | null
  taxEnabled: boolean
  taxRatePercent: number
  taxLabel: string
  defaultShippingFeeNaira: number
}

export const defaultBranding: BrandingState = {
  brandColor: business.branding.brandColor,
  logoDataUrl: business.branding.logoDataUrl,
  taxEnabled: business.tax.enabled,
  taxRatePercent: business.tax.ratePercent,
  taxLabel: business.tax.label,
  defaultShippingFeeNaira: business.shipping.defaultFeeNaira,
}

export const BRANDING_STORAGE_KEY = "kunemi-workspace-branding"

/** Soft background from brand hex (for pills / surfaces) */
export function brandSoft(hex: string, alpha = 0.12): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "").trim()
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned.padEnd(6, "0").slice(0, 6)
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return { r: 79, g: 107, b: 237 }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function brandInitials(name: string = business.name): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "SF"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function loadBranding(): BrandingState {
  if (typeof window === "undefined") return defaultBranding
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY)
    if (!raw) return defaultBranding
    const parsed = JSON.parse(raw) as Partial<BrandingState>
    return { ...defaultBranding, ...parsed }
  } catch {
    return defaultBranding
  }
}

export function saveBranding(next: BrandingState) {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // quota / private mode
  }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
