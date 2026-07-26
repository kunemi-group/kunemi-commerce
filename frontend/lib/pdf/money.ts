/** Parse display money like ₦18,500 or — into number of naira */
export function parseMoney(value: string): number {
  if (!value || value === "—" || value === "-") return 0
  const n = Number(value.replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

export function formatMoney(naira: number): string {
  return `₦${Math.round(naira).toLocaleString("en-NG")}`
}

export function lineTotal(qty: number, unitPrice: string): number {
  return qty * parseMoney(unitPrice)
}
