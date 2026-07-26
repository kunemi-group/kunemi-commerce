import { business } from "@/lib/data"

/** Digits only for wa.me links */
export function whatsappDigits(phone: string = business.whatsapp): string {
  return phone.replace(/\D/g, "")
}

export function whatsappDeepLink(phone: string, text: string): string {
  const digits = whatsappDigits(phone)
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function paymentLinkMessage(opts: {
  customer: string
  orderId: string
  total: string
  paymentLink: string
  holdMinutes?: number
}): string {
  const hold = opts.holdMinutes ?? business.reservationMinutes
  return (
    `Hi ${opts.customer} 👋\n` +
    `Your order ${opts.orderId} from ${business.name} is ready — total ${opts.total}.\n` +
    `Pay here: ${opts.paymentLink}\n` +
    `Stock is held for ${hold} minutes. Reply if you need help!`
  )
}

export function trackingMessage(opts: {
  customer: string
  orderId: string
  trackingUrl: string
  eta?: string
}): string {
  return (
    `Hi ${opts.customer} 👋\n` +
    `Order ${opts.orderId} is on the way!\n` +
    `Track it here: ${opts.trackingUrl}` +
    (opts.eta ? `\nETA: ${opts.eta}` : "")
  )
}

export function transferInstructionsMessage(opts: {
  customer: string
  orderId: string
  total: string
  accountName?: string
  accountNumber?: string
  bank?: string
}): string {
  const bank = business.payments.bank
  return (
    `Hi ${opts.customer} 👋\n` +
    `For order ${opts.orderId} (${opts.total}), please transfer to:\n` +
    `${opts.bank ?? bank.bankName} · ${opts.accountName ?? bank.accountName}\n` +
    `${opts.accountNumber ?? bank.accountNumber}\n` +
    `Send a screenshot of the receipt after transfer. Thank you!`
  )
}

export function documentShareMessage(opts: {
  customer: string
  docType: "quotation" | "invoice"
  docId: string
  total: string
  link: string
  includeTransferDetails?: boolean
  includeCardLink?: boolean
  paymentLink?: string
}): string {
  const bank = business.payments.bank
  let body =
    `Hi ${opts.customer} 👋\n` +
    `Here is your ${opts.docType} ${opts.docId} from ${business.name} — total ${opts.total}.\n` +
    `View: ${opts.link}\n`

  if (opts.includeCardLink && opts.paymentLink) {
    body += `Pay by card: ${opts.paymentLink}\n`
  }
  if (opts.includeTransferDetails ?? business.payments.preferTransferToAvoidFees) {
    body +=
      `Or transfer to ${bank.bankName} · ${bank.accountName} · ${bank.accountNumber}\n` +
      `Then upload your proof of payment / reply with a screenshot.\n`
  }
  body += "Thank you!"
  return body
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
