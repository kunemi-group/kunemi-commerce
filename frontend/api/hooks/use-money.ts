"use client"

import { useCallback, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  formatMoney,
  formatMajor,
  majorToMinor as toMinor,
  minorToMajor as toMajor,
  normalizeCurrency,
} from "../format"

/** Business-scoped money helpers for Workspace UI */
export function useMoney() {
  const { business } = useAuth()
  const currency = normalizeCurrency(business?.currency)

  const format = useCallback(
    (amountMinor: number) => formatMoney(amountMinor, currency),
    [currency],
  )

  const formatMaj = useCallback(
    (amountMajor: number) => formatMajor(amountMajor, currency),
    [currency],
  )

  const majorToMinor = useCallback(
    (amountMajor: number) => toMinor(amountMajor, currency),
    [currency],
  )

  const minorToMajor = useCallback(
    (amountMinor: number) => toMajor(amountMinor, currency),
    [currency],
  )

  return useMemo(
    () => ({
      currency,
      /** Format integer minor units (cents/kobo) */
      format,
      /** Format major units (form inputs / shipping fee fields) */
      formatMajor: formatMaj,
      majorToMinor,
      minorToMajor,
      /** Label for forms e.g. "Unit price (USD)" */
      label: (prefix: string) => `${prefix} (${currency})`,
    }),
    [currency, format, formatMaj, majorToMinor, minorToMajor],
  )
}
