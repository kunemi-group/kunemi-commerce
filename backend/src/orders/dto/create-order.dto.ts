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

/**
 * Create order payload.
 * - Freeform: description + unitPriceCents (no variantId) — no stock hold
 * - Catalog: variantId + quantity — stock reserved when available
 */
export class CreateOrderItemDto {
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ValidateIf((o: CreateOrderItemDto) => !o.variantId)
  @IsString()
  @MinLength(1)
  description?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @ValidateIf((o: CreateOrderItemDto) => !o.variantId)
  @IsInt()
  @Min(0)
  unitPriceCents?: number;

  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsString()
  @MinLength(3)
  customerPhone!: string;

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
