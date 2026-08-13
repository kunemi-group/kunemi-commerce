import type { Business } from '../../../database/entities/business.entity';
import type { Order } from '../../../database/entities/order.entity';
import type { Payment } from '../../../database/entities/payment.entity';

/**
 * Pluggable payment stack.
 * - bank_transfer: default (business bank details + claim/proof + verify)
 * - stripe / paystack: later adapters implementing the same contract
 */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export type PaymentMethodId = 'bank_transfer' | 'stripe' | 'paystack' | string;

export type CreatePaymentContext = {
  business: Business;
  order: Order;
  amountCents: number;
  currency: string;
  frontendBase: string;
};

export type CustomerPaymentView = {
  method: PaymentMethodId;
  providerLabel: string;
  /** True if customer must "I paid" + staff verify */
  requiresManualClaim: boolean;
  /** Card/hosted checkout URL when using Stripe/Paystack */
  checkoutUrl: string | null;
  /** Bank transfer fields (null for card providers) */
  bank: {
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
  } | null;
  instructions: string[];
};

export interface PaymentProvider {
  readonly id: PaymentMethodId;
  readonly label: string;

  /** Whether this provider is available for a business right now */
  isAvailable(business: Business): boolean;

  /**
   * After payment row is created, provider may attach external intent ids.
   * Bank transfer returns null (local reference only).
   */
  afterCreate?(
    payment: Payment,
    ctx: CreatePaymentContext,
  ): Promise<Partial<Payment> | void>;

  /** Public pay-page payload fragment */
  buildCustomerView(
    payment: Payment,
    business: Business,
    order: Order,
  ): CustomerPaymentView;
}
