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
  imageKey?: string | null
  imageUrl?: string | null
  galleryKeys?: string[]
  galleryUrls?: string[]
  publishedToStore?: boolean
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
    imageKey?: string | null
    imageUrl?: string | null
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

export type UserRole = "owner" | "team" | "user" | "admin" | "super_admin"

export type ApiTeamMember = {
  id: string
  email: string
  fullName: string
  role: UserRole | string
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
  /** Present when payment was verified (bank transfer confirm). */
  verifiedAt?: string | null
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
  /** Null for ShopFlow buyers */
  businessId: string | null
  /** True after team invite until password is changed */
  mustChangePassword?: boolean
  isEmailVerified?: boolean
}

export type BusinessProfile = {
  id: string
  name: string
  whatsappNumber: string | null
  email: string | null
  address: string | null
  tier: string
  /** ISO 4217 — per business, not platform-locked to NGN */
  currency?: string
  payments?: {
    defaultMethod: string
    enabledMethods: string[]
  }
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
  store?: {
    slug: string | null
    enabled: boolean
    publicPath: string | null
  }
  logoKey?: string | null
  logoUrl?: string | null
  onboarding?: {
    complete: boolean
    missing: string[]
    required: string[]
  }
  inventoryOptional?: boolean
}

export type QuoteStatus =
  "draft" | "sent" | "accepted" | "expired" | "converted"

export type InvoiceDocStatus =
  "draft" | "sent" | "partial" | "paid" | "overdue" | "void"

export type ApiDocumentLine = {
  id: string
  variantId: string | null
  description: string
  quantity: number
  unitPriceCents: number
  taxExempt: boolean
}

export type ApiQuotation = {
  id: string
  reference: string
  status: QuoteStatus
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  deliveryAddress: string | null
  validUntil: string | null
  channel: string
  paymentMethods: Array<"transfer" | "card">
  shippingFeeCents: number
  taxCents: number
  subtotalCents: number
  totalCents: number
  notes: string | null
  convertedInvoiceId: string | null
  ownerName: string | null
  items: ApiDocumentLine[]
  createdAt: string
  updatedAt: string
}

export type ApiInvoiceDoc = {
  id: string
  reference: string
  status: InvoiceDocStatus
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  deliveryAddress: string | null
  dueAt: string | null
  channel: string
  paymentMethods: Array<"transfer" | "card">
  shippingFeeCents: number
  taxCents: number
  subtotalCents: number
  totalCents: number
  amountPaidCents: number
  quotationId: string | null
  orderId: string | null
  notes: string | null
  ownerName: string | null
  items: ApiDocumentLine[]
  createdAt: string
  updatedAt: string
}

export type CreateDocumentPayload = {
  customerName: string
  customerPhone?: string
  customerEmail?: string
  deliveryAddress?: string
  shippingFeeCents?: number
  notes?: string
  channel?: "whatsapp" | "email" | "both"
  paymentMethods?: Array<"transfer" | "card">
  validUntil?: string
  dueAt?: string
  items: Array<{
    variantId?: string
    description: string
    quantity: number
    unitPriceCents: number
    taxExempt?: boolean
  }>
}

export type UploadResult = {
  key: string
  url: string
  provider: "r2" | "local"
  contentType: string
  size: number
  filename: string
}

/** Public Workspace single-business storefront (not ShopFlow marketplace). */
export type PublicStore = {
  id: string
  name: string
  slug: string | null
  whatsappNumber: string | null
  email: string | null
  address: string | null
  brandColor: string
  logoUrl: string | null
  currency: string
  tax: { enabled: boolean; ratePercent: number; label: string }
  shipping: { defaultFeeCents: number }
  storePath: string | null
}

export type PublicStoreVariant = {
  id: string
  sku: string | null
  attributes: Record<string, string> | null
  priceCents: number
  available: number
  taxExempt: boolean
  imageUrl: string | null
  inStock: boolean
}

export type PublicStoreProduct = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  galleryUrls: string[]
  publishedToStore: boolean
  fromPriceCents: number | null
  variants: PublicStoreVariant[]
}

export type StoreCheckoutPayload = {
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryAddress?: string
  shippingFeeCents?: number
  idempotencyKey?: string
  items: Array<{ variantId: string; quantity: number }>
}

export type StoreCheckoutResult = {
  id: string
  status: string
  source: string
  totalCents: number
  currency: string
  paymentLink: string
  payment: {
    paymentToken: string
    paymentUrl: string
    reference: string
    amountCents: number
  }
  bankTransfer: {
    bankName: string | null
    bankAccountName: string | null
    bankAccountNumber: string | null
    reference: string
  }
  reservedUntil: string | null
}

export type AuthMeResponse = {
  user: AuthUser
  /** Null for ShopFlow buyers */
  business: BusinessProfile | null
}

export type TokenResponse = {
  user: AuthUser
}

export type PublicPayResponse = {
  token: string
  method: string
  providerLabel?: string
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
  checkoutUrl?: string | null
  requiresManualClaim?: boolean
  availablePaymentMethods?: Array<{
    id: string
    label: string
    isDefault: boolean
  }>
  business: {
    name: string
    whatsapp: string | null
    currency?: string
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
  currency?: string
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

/** Alias used by PDF map helpers */
export type ApiInvoice = ApiInvoiceDoc
export type InvoiceStatus = InvoiceDocStatus
export type DocumentLine = ApiDocumentLine
