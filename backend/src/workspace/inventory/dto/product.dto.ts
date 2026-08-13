import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiPropertyOptional({ example: 'ANK-BLU-XL', description: 'Variant SKU code' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 1850000, description: 'Price in minor units (e.g. 1850000 = 18500.00)' })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiPropertyOptional({ example: 25, default: 0, description: 'Initial stock count' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockOnHand?: number;

  @ApiPropertyOptional({ example: false, description: 'Tax exempt status' })
  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;

  @ApiPropertyOptional({ example: 5, default: 5, description: 'Low stock warning threshold' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: { color: 'Blue', size: 'XL' }, description: 'Variant attributes' })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Ankara Premium Gown', description: 'Product Title' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: 'Hand-crafted 100% cotton African wax print gown.', description: 'Product Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uploads/ankara-gown-1.jpg', description: 'Product Main Image Key' })
  @IsOptional()
  @IsString()
  imageKey?: string;

  @ApiPropertyOptional({ example: true, description: 'Publish to public ShopFlow storefront' })
  @IsOptional()
  @IsBoolean()
  publishedToStore?: boolean;

  @ApiPropertyOptional({ type: CreateVariantDto, description: 'Initial product variant' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVariantDto)
  variant?: CreateVariantDto;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Ankara Premium Gown (2026 Collection)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated product description text' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'uploads/ankara-gown-updated.jpg' })
  @IsOptional()
  @IsString()
  imageKey?: string | null;

  @ApiPropertyOptional({ example: ['uploads/gallery1.jpg', 'uploads/gallery2.jpg'] })
  @IsOptional()
  galleryKeys?: string[] | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  publishedToStore?: boolean;
}

export class UpdateVariantDto {
  @ApiPropertyOptional({ example: 'ANK-BLU-XXL' })
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional({ example: 1950000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: { color: 'Blue', size: 'XXL' } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string> | null;

  @ApiPropertyOptional({ example: 'uploads/variant-blue.jpg' })
  @IsOptional()
  @IsString()
  imageKey?: string | null;
}

/** Add stock (or subtract if negative) without clobbering reserved units. */
export class RestockVariantDto {
  @ApiProperty({ example: 15, description: 'Quantity to add (or subtract if negative)' })
  @IsInt()
  delta!: number;
}

export class AddVariantDto {
  @ApiPropertyOptional({ example: 'ANK-RED-M' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 1850000 })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockOnHand?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: { color: 'Red', size: 'M' } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @ApiPropertyOptional({ example: 'uploads/variant-red.jpg' })
  @IsOptional()
  @IsString()
  imageKey?: string;
}
