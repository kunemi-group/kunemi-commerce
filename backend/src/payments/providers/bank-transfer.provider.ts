import { Injectable } from '@nestjs/common';
import type { Business } from '../../database/entities/business.entity';
import type { Order } from '../../database/entities/order.entity';
import type { Payment } from '../../database/entities/payment.entity';
import { formatMoney } from '../../common/currency';
import type {
  CustomerPaymentView,
  PaymentProvider,
} from './payment-provider.interface';

/** Default payment method — business bank details + customer claim + staff verify */
@Injectable()
export class BankTransferProvider implements PaymentProvider {
  readonly id = 'bank_transfer' as const;
  readonly label = 'Bank transfer';

  isAvailable(business: Business): boolean {
    // Available even if bank incomplete — onboarding should push them to fill details
    return true;
  }

  buildCustomerView(
    payment: Payment,
    business: Business,
    _order: Order,
  ): CustomerPaymentView {
    const currency = business.currency || 'NGN';
    const amountLabel = formatMoney(payment.amountCents, currency);
    return {
      method: this.id,
      providerLabel: this.label,
      requiresManualClaim: true,
      checkoutUrl: null,
      bank: {
        bankName: business.bankName,
        accountName: business.bankAccountName,
        accountNumber: business.bankAccountNumber,
      },
      instructions: [
        `Transfer ${amountLabel} to the account below.`,
        `Use reference ${payment.reference} as the narration / description.`,
        'After paying, tap “I have made payment” (receipt optional).',
        'The business verifies the transfer before the order is confirmed.',
      ],
    };
  }
}
