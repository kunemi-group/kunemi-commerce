import type { Business } from '../database/entities/business.entity';

/** Fields a new merchant must fill before accepting bank-transfer payments. */
export function onboardingStatus(business: Business) {
  const missing: string[] = [];
  if (!business.whatsappNumber?.trim()) missing.push('whatsappNumber');
  if (!business.address?.trim()) missing.push('address');
  if (!business.bankName?.trim()) missing.push('bankName');
  if (!business.bankAccountName?.trim()) missing.push('bankAccountName');
  if (!business.bankAccountNumber?.trim()) missing.push('bankAccountNumber');
  return {
    complete: missing.length === 0,
    missing,
    required: [
      'whatsappNumber',
      'address',
      'bankName',
      'bankAccountName',
      'bankAccountNumber',
    ] as const,
    optionalDone: {
      taxConfigured: true,
      shippingConfigured: business.defaultShippingFeeCents >= 0,
      brandColor: Boolean(business.brandColor),
    },
  };
}
