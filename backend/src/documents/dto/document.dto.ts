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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentLineDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Product Variant UUID' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ example: 'Custom Tailored Agbada Suit', description: 'Item description' })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 4500000, description: 'Unit price in minor units (e.g. 4500000 = 45000.00)' })
  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @ApiPropertyOptional({ example: false, description: 'Tax exempt status' })
  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;
}

export class CreateDocumentDto {
  @ApiProperty({ example: 'Chief Olumide Benson', description: 'Customer Name' })
  @IsString()
  @MinLength(1)
  customerName!: string;

  @ApiPropertyOptional({ example: '+2348031234567', description: 'Customer Phone' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'benson@example.com', description: 'Customer Email' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ example: '5 Banana Island Road, Ikoyi, Lagos', description: 'Delivery Address' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 350000, description: 'Shipping Fee Cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  shippingFeeCents?: number;

  @ApiPropertyOptional({ example: 'Thank you for your business!', description: 'Notes or terms' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'whatsapp', enum: ['whatsapp', 'email', 'both'] })
  @IsOptional()
  @IsIn(['whatsapp', 'email', 'both'])
  channel?: string;

  @ApiPropertyOptional({ example: ['transfer'], description: 'Accepted payment methods' })
  @IsOptional()
  @IsArray()
  @IsIn(['transfer', 'card'], { each: true })
  paymentMethods?: Array<'transfer' | 'card'>;

  @ApiPropertyOptional({ example: '2026-08-30T00:00:00.000Z', description: 'Quotation expiration date' })
  @IsOptional()
  @IsString()
  validUntil?: string;

  @ApiPropertyOptional({ example: '2026-08-25T00:00:00.000Z', description: 'Invoice due date' })
  @IsOptional()
  @IsString()
  dueAt?: string;

  @ApiProperty({ type: [DocumentLineDto], description: 'Line items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  items!: DocumentLineDto[];
}

export class UpdateDocumentStatusDto {
  @ApiPropertyOptional({ example: 'Payment received via bank transfer' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 4867500, description: 'Amount paid in minor units' })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaidCents?: number;
}
