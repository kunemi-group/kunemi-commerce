import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class CreatePlatformAdminDto {
  @ApiProperty({ example: 'admin@kunemi.com', description: 'Platform Admin Email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'adminpass123', description: 'Initial Admin Password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Sarah Connor', description: 'Admin Full Name' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: 'admin', enum: ['admin', 'super_admin'], description: 'Platform Admin Role' })
  @IsIn(['admin', 'super_admin'])
  role!: 'admin' | 'super_admin';
}

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
