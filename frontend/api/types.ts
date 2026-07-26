/** Shared Nest API response types for Kunemi Workspace */

export type ApiOrderStatus =
  | "pending"
  | "payment_review"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired"

export type ApiOrder = {
  id: string
  status: ApiOrderStatus
  customerName: string
  customerPhone: string
  customerEmail: string | null
  deliveryAddress: string | null
  subtotalCents: number
  taxCents: number
  shippingFeeCents: number
  totalCents: number
  reservedUntil: string | null
  createdAt: string
  items?: Array<{
    id: string
    variantId: string | null
    description: string
    quantity: number
    unitPriceCents: number
    taxExempt: boolean
  }>
  payment?: {
    id: string
    method: string
    status: string
    reference: string
    paymentToken: string
    paymentUrl: string
    amountCents: number
    claimedAt?: string | null
    hasProof?: boolean
  } | null
  delivery?: {
    id: string
    status: string
    fulfillmentMode: string
    provider: string | null
    trackingToken: string
    trackingPath: string
    externalTrackingUrl: string | null
  } | null
  statusHistory?: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    reason: string | null
    createdAt: string
  }>
  paymentLink?: string
}

export type ApiProduct = {
  id: string
  name: string
  description: string | null
  variants: Array<{
    id: string
    productId?: string
    sku: string | null
    attributes: Record<string, string> | null
    priceCents: number
    stockOnHand: number
    stockReserved: number
    available: number
    taxExempt: boolean
    lowStockThreshold: number
  }>
}

export type ApiDelivery = {
  id: string
  orderId: string
  fulfillmentMode: "manual" | "api_integrated"
  provider: string | null
  trackingToken: string
  trackingPath: string
  status: string
  externalTrackingUrl: string | null
  externalCourierName: string | null
  createdAt: string
  updatedAt: string
  order?: {
    id: string
    status: string
    customerName: string
    customerPhone: string
    deliveryAddress: string | null
  }
  events?: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    note: string | null
    createdAt: string
  }>
}

export type ApiTeamMember = {
  id: string
  email: string
  fullName: string
  role: string
  createdAt: string
}

export type ApiPayment = {
  id: string
  orderId: string
  method: string
  status: string
  amountCents: number
  reference: string
  paymentToken: string
  paymentUrl: string
  claimedAt: string | null
  customerNote: string | null
  hasProof: boolean
  proofFilename: string | null
  proofUrl: string | null
  rejectReason: string | null
  createdAt: string
  updatedAt: string
  order?: {
    id: string
    status: string
    customerName: string
    customerPhone: string
    customerEmail: string | null
    totalCents: number
    reservedUntil: string | null
  }
}

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: string
  businessId: string
}

export type BusinessProfile = {
  id: string
  name: string
  whatsappNumber: string | null
  email: string | null
  address: string | null
  tier: string
  tax: {
    enabled: boolean
    ratePercent: number
    label: string
  }
  shipping: {
    defaultFeeCents: number
  }
  bank: {
    bankName: string | null
    accountName: string | null
    accountNumber: string | null
  }
  brandColor: string
  onboarding?: {
    complete: boolean
    missing: string[]
    required: string[]
  }
  inventoryOptional?: boolean
}

export type AuthMeResponse = {
  user: AuthUser
  business: BusinessProfile
}

export type TokenResponse = {
  accessToken: string
  user: AuthUser
}

export type PublicPayResponse = {
  token: string
  method: string
  paymentStatus: string
  orderStatus: string
  reference: string
  amountCents: number
  currency: string
  paymentDueAt: string | null
  secondsRemaining: number | null
  expired: boolean
  canClaim: boolean
  underReview: boolean
  paid: boolean
  rejectReason: string | null
  business: {
    name: string
    whatsapp: string | null
    bankName: string | null
    bankAccountName: string | null
    bankAccountNumber: string | null
  }
  order: {
    id: string
    customerName: string
    customerPhone: string
    deliveryAddress: string | null
    subtotalCents: number
    taxCents: number
    shippingFeeCents: number
    totalCents: number
    items: Array<{
      description: string
      quantity: number
      unitPriceCents: number
    }>
  }
  instructions: string[]
}

export type PublicTrackResponse = {
  token: string
  status: string
  fulfillmentMode: string
  provider: string | null
  externalTrackingUrl: string | null
  externalCourierName: string | null
  businessName: string
  businessWhatsapp: string | null
  orderId: string
  customerName: string | null
  deliveryAddress: string | null
  items: Array<{ name: string; qty: number; unitPriceCents: number }>
  timeline: Array<{
    label: string
    at: string | null
    note: string | null
    done: boolean
  }>
  eta: string
}

export type CreateOrderPayload = {
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryAddress?: string
  shippingFeeCents?: number
  items: Array<{
    variantId?: string
    description?: string
    quantity: number
    unitPriceCents?: number
    taxExempt?: boolean
  }>
}
