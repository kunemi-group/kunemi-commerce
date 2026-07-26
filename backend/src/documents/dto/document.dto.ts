import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class DocumentLineDto {
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;
}

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  shippingFeeCents?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['whatsapp', 'email', 'both'])
  channel?: string;

  @IsOptional()
  @IsArray()
  @IsIn(['transfer', 'card'], { each: true })
  paymentMethods?: Array<'transfer' | 'card'>;

  /** ISO date string for valid-until (quotes) or due date (invoices) */
  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  dueAt?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  items!: DocumentLineDto[];
}

export class UpdateDocumentStatusDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaidCents?: number;
}
