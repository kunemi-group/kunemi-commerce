import { Injectable } from '@nestjs/common';
import type { Business } from '../../../database/entities/business.entity';
import type { Order } from '../../../database/entities/order.entity';
import type { Payment } from '../../../database/entities/payment.entity';
import type {
  CustomerPaymentView,
  PaymentProvider,
} from './payment-provider.interface';

/**
 * Paystack adapter stub — initialize transaction when keys exist.
 * Not enabled until business enables paystack and PAYSTACK_SECRET_KEY is set.
 */
@Injectable()
export class PaystackProvider implements PaymentProvider {
  readonly id = 'paystack' as const;
  readonly label = 'Card / bank (Paystack)';

  isAvailable(business: Business): boolean {
    const methods = parseMethods(business.enabledPaymentMethodsJson);
    return methods.includes('paystack') && Boolean(process.env.PAYSTACK_SECRET_KEY);
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
      checkoutUrl: null, // TODO: Paystack initialize URL
      bank: null,
      instructions: [
        'Paystack checkout will open a secure payment page (coming soon).',
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
