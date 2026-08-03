import { Injectable } from '@nestjs/common';
import type { Business } from '../../database/entities/business.entity';
import { BankTransferProvider } from './bank-transfer.provider';
import { PaystackProvider } from './paystack.provider';
import type { PaymentMethodId, PaymentProvider } from './payment-provider.interface';
import { StripeProvider } from './stripe.provider';

@Injectable()
export class PaymentProviderRegistry {
  private readonly byId: Map<string, PaymentProvider>;

  constructor(
    bank: BankTransferProvider,
    stripe: StripeProvider,
    paystack: PaystackProvider,
  ) {
    this.byId = new Map<string, PaymentProvider>([
      [bank.id, bank],
      [stripe.id, stripe],
      [paystack.id, paystack],
    ]);
  }

  get(id: PaymentMethodId): PaymentProvider | undefined {
    return this.byId.get(id);
  }

  /** Resolve provider for a business (default → first enabled available). */
  resolveForBusiness(business: Business): PaymentProvider {
    const preferred = business.defaultPaymentMethod || 'bank_transfer';
    const preferredProvider = this.byId.get(preferred);
    if (preferredProvider?.isAvailable(business)) {
      return preferredProvider;
    }

    const enabled = this.parseEnabled(business);
    for (const id of enabled) {
      const p = this.byId.get(id);
      if (p?.isAvailable(business)) return p;
    }

    // Always fall back to bank transfer
    return this.byId.get('bank_transfer')!;
  }

  listAvailable(business: Business) {
    return [...this.byId.values()]
      .filter((p) => p.isAvailable(business))
      .map((p) => ({
        id: p.id,
        label: p.label,
        isDefault: p.id === (business.defaultPaymentMethod || 'bank_transfer'),
      }));
  }

  private parseEnabled(business: Business): string[] {
    try {
      const arr = JSON.parse(
        business.enabledPaymentMethodsJson || '["bank_transfer"]',
      ) as string[];
      return Array.isArray(arr) && arr.length ? arr : ['bank_transfer'];
    } catch {
      return ['bank_transfer'];
    }
  }
}
