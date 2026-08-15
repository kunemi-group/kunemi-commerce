import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoreCheckoutItemDto {
  @ApiProperty({ description: 'Catalog variant UUID from this business store' })
  @IsUUID()
  variantId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

/**
 * Guest checkout for a single-business Workspace storefront.
 * Creates a seller-owned Workspace Order + bank-transfer payment.
 * Not a ShopFlow marketplace checkout.
 */
export class StoreCheckoutDto {
  @ApiProperty({ example: 'Kemi Adebayo' })
  @IsString()
  @MinLength(1)
  customerName!: string;

  @ApiProperty({ example: '+2348098765432' })
  @IsString()
  @MinLength(3)
  customerPhone!: string;

  @ApiPropertyOptional({ example: 'kemi@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ example: '15 Victoria Island, Lagos' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({
    example: 250000,
    description: 'Shipping in minor units; omit to use business default',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  shippingFeeCents?: number;

  @ApiPropertyOptional({
    example: 'chk_abc123xyz',
    description: 'Client idempotency key to prevent double orders on refresh',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  idempotencyKey?: string;

  @ApiProperty({ type: [StoreCheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StoreCheckoutItemDto)
  items!: StoreCheckoutItemDto[];
}
