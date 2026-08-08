import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBusinessStatusDto {
  @ApiProperty({ example: 'active', enum: ['active', 'suspended', 'pending'], description: 'Merchant store status' })
  status!: 'active' | 'suspended' | 'pending';

  @ApiPropertyOptional({ example: 'Violation of merchant terms of service', description: 'Reason for status update' })
  reason?: string;
}

export class UpdateBusinessTierDto {
  @ApiProperty({ example: 'growth', enum: ['starter', 'growth', 'scale'], description: 'Subscription tier' })
  subscriptionTier!: 'starter' | 'growth' | 'scale';
}

export class SetCustomDomainDto {
  @ApiProperty({ example: 'shop.lagosthreads.co', description: 'Custom vanity domain or null to unbind', nullable: true })
  customDomain!: string | null;
}

export class AdminBusinessQueryDto {
  @ApiPropertyOptional({ example: 'Lagos Threads', description: 'Search term for name, email, or slug' })
  search?: string;

  @ApiPropertyOptional({ example: 'growth', enum: ['starter', 'growth', 'scale'] })
  tier?: 'starter' | 'growth' | 'scale';

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'suspended', 'pending'] })
  status?: 'active' | 'suspended' | 'pending';

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number;
}
