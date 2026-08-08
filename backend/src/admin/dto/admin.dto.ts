export class UpdateBusinessStatusDto {
  status!: 'active' | 'suspended' | 'pending';
  reason?: string;
}

export class UpdateBusinessTierDto {
  subscriptionTier!: 'starter' | 'growth' | 'scale';
}

export class SetCustomDomainDto {
  customDomain!: string | null;
}

export class AdminBusinessQueryDto {
  search?: string;
  tier?: 'starter' | 'growth' | 'scale';
  status?: 'active' | 'suspended' | 'pending';
  page?: number;
  limit?: number;
}
