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

export class CreateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockOnHand?: number;

  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageKey?: string;

  @IsOptional()
  @IsBoolean()
  publishedToStore?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVariantDto)
  variant?: CreateVariantDto;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  imageKey?: string | null;

  @IsOptional()
  galleryKeys?: string[] | null;

  @IsOptional()
  @IsBoolean()
  publishedToStore?: boolean;
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string> | null;

  @IsOptional()
  @IsString()
  imageKey?: string | null;
}

/** Add stock (or subtract if negative) without clobbering reserved units. */
export class RestockVariantDto {
  @IsInt()
  delta!: number;
}

export class AddVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockOnHand?: number;

  @IsOptional()
  @IsBoolean()
  taxExempt?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @IsOptional()
  @IsString()
  imageKey?: string;
}

