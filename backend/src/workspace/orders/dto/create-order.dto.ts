import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Catalog Product Variant UUID' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ example: 'Custom Bespoke Ankara Dress (Blue)', description: 'Freeform item description' })
  @ValidateIf((o: CreateOrderItemDto) => !o.variantId)
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiProperty({ example: 2, description: 'Item quantity ordered' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 1500000, description: 'Unit price in minor units (e.g. 1500000 = 15000.00)' })
  @ValidateIf((o: CreateOrderItemDto) => !o.variantId)
  @IsInt()
  @Min(0)
  unitPriceCents?: number;

  @ApiPropertyOptional({ example: false, description: 'Mark line item exempt from VAT' })
  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Kemi Adebayo', description: 'Customer Full Name' })
  @IsString()
  @MinLength(1)
  customerName!: string;

  @ApiProperty({ example: '+2348098765432', description: 'Customer Phone Number' })
  @IsString()
  @MinLength(3)
  customerPhone!: string;

  @ApiPropertyOptional({ example: 'kemi.adebayo@example.com', description: 'Customer Email Address' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ example: '15 Victoria Island Expressway, Lagos', description: 'Delivery Address' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 250000, description: 'Shipping Fee in Minor Units (e.g. 250000 = 2500.00)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  shippingFeeCents?: number;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'List of order line items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
