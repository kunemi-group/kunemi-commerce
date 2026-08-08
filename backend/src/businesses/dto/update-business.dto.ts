import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'Lagos Threads Ltd', description: 'Business Store Name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: '+2348012345678', description: 'WhatsApp Contact Number' })
  @IsOptional()
  @IsString()
  whatsappNumber?: string | null;

  @ApiPropertyOptional({ example: 'sales@lagosthreads.co', description: 'Business Email' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: '12 Admiralty Way, Lekki Phase 1, Lagos', description: 'Business Address' })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ example: true, description: 'Enable VAT / Tax calculation' })
  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @ApiPropertyOptional({ example: 7.5, description: 'Tax Rate Percentage' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRatePercent?: number;

  @ApiPropertyOptional({ example: 'VAT', description: 'Tax Display Label' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  taxLabel?: string;

  @ApiPropertyOptional({ example: 250000, description: 'Default Shipping Fee in Minor Units (e.g. 250000 = 2500.00)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultShippingFeeCents?: number;

  @ApiPropertyOptional({ example: 'GTBank', description: 'Bank Name for Payments' })
  @IsOptional()
  @IsString()
  bankName?: string | null;

  @ApiPropertyOptional({ example: 'Lagos Threads Co', description: 'Bank Account Name' })
  @IsOptional()
  @IsString()
  bankAccountName?: string | null;

  @ApiPropertyOptional({ example: '0123456789', description: 'Bank Account Number' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string | null;

  @ApiPropertyOptional({ example: '#4f6bed', description: 'Hex Color Code' })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'brandColor must be a hex color like #4f6bed',
  })
  brandColor?: string;

  @ApiPropertyOptional({ example: 'lagosthreads', description: 'Public Storefront Slug' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'storeSlug must be lowercase alphanumeric with hyphens',
  })
  storeSlug?: string | null;

  @ApiPropertyOptional({ example: true, description: 'Enable public storefront' })
  @IsOptional()
  @IsBoolean()
  storeEnabled?: boolean;

  @ApiPropertyOptional({ example: 'uploads/logo-123.jpg', description: 'Logo Storage Key' })
  @IsOptional()
  @IsString()
  logoKey?: string | null;

  @ApiPropertyOptional({ example: 'NGN', description: 'ISO 4217 Currency Code' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ example: 'bank_transfer', enum: ['bank_transfer', 'stripe', 'paystack'] })
  @IsOptional()
  @IsString()
  @IsIn(['bank_transfer', 'stripe', 'paystack'])
  defaultPaymentMethod?: string;

  @ApiPropertyOptional({ example: ['bank_transfer'], description: 'List of enabled payment methods' })
  @IsOptional()
  enabledPaymentMethods?: string[];
}
