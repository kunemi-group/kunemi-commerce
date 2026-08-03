import { Injectable } from '@nestjs/common';
import type { Business } from '../../database/entities/business.entity';
import type { Order } from '../../database/entities/order.entity';
import type { Payment } from '../../database/entities/payment.entity';
import type {
  CustomerPaymentView,
  PaymentProvider,
} from './payment-provider.interface';

/**
 * Stripe adapter stub — wire Checkout Session / PaymentIntent when keys exist.
 * Not enabled until business has stripe config and method in enabledPaymentMethods.
 */
@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly id = 'stripe' as const;
  readonly label = 'Card (Stripe)';

  isAvailable(business: Business): boolean {
    const methods = parseMethods(business.enabledPaymentMethodsJson);
    // Placeholder: require explicit enable + future stripeAccountId on business
    return methods.includes('stripe') && Boolean(process.env.STRIPE_SECRET_KEY);
  }

  buildCustomerView(
    payment: Payment,
    _business: Business,
    _order: Order,
  ): CustomerPaymentView {
    return {
      method: this.id,
      providerLabel: this.label,
      requiresManualClaim: false,
      checkoutUrl: null, // TODO: create Stripe Checkout Session URL
      bank: null,
      instructions: [
        'Card payment via Stripe will open a secure checkout (coming soon).',
        `Reference: ${payment.reference}`,
      ],
    };
  }
}

function parseMethods(json: string | null | undefined): string[] {
  try {
    const arr = JSON.parse(json || '[]') as string[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
