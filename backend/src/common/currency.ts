/**
 * Global money helpers — ISO 4217 currency codes.
 * Amounts are always integer minor units (cents/kobo/etc.).
 */

/** Currencies commonly used by target markets (not exhaustive). */
export const SUPPORTED_CURRENCIES = [
  'NGN',
  'USD',
  'GBP',
  'EUR',
  'GHS',
  'KES',
  'ZAR',
  'XOF',
  'XAF',
  'CAD',
  'AUD',
  'INR',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const ZERO_DECIMAL = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

export function normalizeCurrency(code: string | null | undefined): string {
  const c = (code || 'NGN').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) return 'NGN';
  return c;
}

/** Minor-unit exponent for ISO currency (0 or 2 for most). */
export function currencyFractionDigits(currency: string): number {
  const c = normalizeCurrency(currency);
  if (ZERO_DECIMAL.has(c)) return 0;
  // 3-decimal currencies (e.g. BHD) not used in Phase 1 — treat as 2
  return 2;
}

export function minorToMajor(amountMinor: number, currency: string): number {
  const d = currencyFractionDigits(currency);
  return amountMinor / Math.pow(10, d);
}

export function majorToMinor(amountMajor: number, currency: string): number {
  const d = currencyFractionDigits(currency);
  return Math.round(amountMajor * Math.pow(10, d));
}

/** Format minor units for API/logs (locale optional). */
export function formatMoney(
  amountMinor: number,
  currency: string,
  locale?: string,
): string {
  const c = normalizeCurrency(currency);
  const major = minorToMajor(amountMinor, c);
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency: c,
      maximumFractionDigits: currencyFractionDigits(c),
    }).format(major);
  } catch {
    return `${c} ${major.toFixed(currencyFractionDigits(c))}`;
  }
}

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.includes(
    normalizeCurrency(code) as SupportedCurrency,
  );
}
