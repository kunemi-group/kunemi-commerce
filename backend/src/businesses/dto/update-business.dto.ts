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

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRatePercent?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  taxLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  defaultShippingFeeCents?: number;

  @IsOptional()
  @IsString()
  bankName?: string | null;

  @IsOptional()
  @IsString()
  bankAccountName?: string | null;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string | null;

  /** Hex color e.g. #4f6bed */
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'brandColor must be a hex color like #4f6bed',
  })
  brandColor?: string;

  /** ShopFlow store slug (lowercase letters, numbers, hyphens) */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'storeSlug must be lowercase alphanumeric with hyphens',
  })
  storeSlug?: string | null;

  @IsOptional()
  @IsBoolean()
  storeEnabled?: boolean;

  /** Storage key for logo uploaded via POST /uploads purpose=brand */
  @IsOptional()
  @IsString()
  logoKey?: string | null;

  /** ISO 4217 currency code (e.g. NGN, USD, GBP, EUR, KES) */
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  /** bank_transfer | stripe | paystack (default payment method) */
  @IsOptional()
  @IsString()
  @IsIn(['bank_transfer', 'stripe', 'paystack'])
  defaultPaymentMethod?: string;

  @IsOptional()
  enabledPaymentMethods?: string[];
}
