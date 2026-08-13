import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../../common/types/auth-user';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { StorageService } from '../../shared/storage/storage.service';
import {
  AddVariantDto,
  CreateProductDto,
  RestockVariantDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto/product.dto';

/**
 * Optional catalog. Empty list is a valid merchant state.
 * Products can be published to ShopFlow via storefront API.
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
    private readonly storage: StorageService,
  ) {}

  async listProducts(user: AuthUser) {
    const products = await this.products.find({
      where: { businessId: user.businessId },
      relations: { variants: true },
      order: { createdAt: 'DESC' },
    });
    return {
      optional: true,
      products: products.map((p) => this.toProductDto(p)),
    };
  }

  async getProduct(id: string, user: AuthUser) {
    const product = await this.findProduct(id, user.businessId);
    return this.toProductDto(product);
  }

  async createProduct(dto: CreateProductDto, user: AuthUser) {
    const product = this.products.create({
      businessId: user.businessId,
      name: dto.name,
      description: dto.description ?? null,
      imageKey: dto.imageKey ?? null,
      galleryKeysJson: null,
      publishedToStore: dto.publishedToStore ?? true,
    });
    await this.products.save(product);

    let variant: ProductVariant | null = null;
    if (dto.variant) {
      variant = this.variants.create({
        productId: product.id,
        businessId: user.businessId,
        sku: dto.variant.sku ?? null,
        attributes: dto.variant.attributes ?? null,
        priceCents: dto.variant.priceCents,
        stockOnHand: dto.variant.stockOnHand ?? 0,
        stockReserved: 0,
        taxExempt: dto.variant.taxExempt ?? false,
        lowStockThreshold: dto.variant.lowStockThreshold ?? 5,
        imageKey: null,
      });
      await this.variants.save(variant);
    }

    const full = await this.findProduct(product.id, user.businessId);
    return this.toProductDto(full);
  }

  async updateProduct(id: string, dto: UpdateProductDto, user: AuthUser) {
    const product = await this.findProduct(id, user.businessId);
    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.description !== undefined) {
      product.description = dto.description?.trim() || null;
    }
    if (dto.imageKey !== undefined) {
      if (dto.imageKey === null && product.imageKey) {
        await this.storage.delete(product.imageKey);
      }
      product.imageKey = dto.imageKey;
    }
    if (dto.galleryKeys !== undefined) {
      product.galleryKeysJson =
        dto.galleryKeys === null
          ? null
          : JSON.stringify(dto.galleryKeys.filter(Boolean));
    }
    if (dto.publishedToStore !== undefined) {
      product.publishedToStore = dto.publishedToStore;
    }
    await this.products.save(product);
    return this.toProductDto(product);
  }

  async addVariant(productId: string, dto: AddVariantDto, user: AuthUser) {
    await this.findProduct(productId, user.businessId);
    const variant = this.variants.create({
      productId,
      businessId: user.businessId,
      sku: dto.sku ?? null,
      attributes: dto.attributes ?? null,
      priceCents: dto.priceCents,
      stockOnHand: dto.stockOnHand ?? 0,
      stockReserved: 0,
      taxExempt: dto.taxExempt ?? false,
      lowStockThreshold: dto.lowStockThreshold ?? 5,
      imageKey: dto.imageKey ?? null,
    });
    await this.variants.save(variant);
    return this.toVariantDto(variant);
  }

  async updateVariant(id: string, dto: UpdateVariantDto, user: AuthUser) {
    const variant = await this.findVariant(id, user.businessId);
    if (dto.sku !== undefined) variant.sku = dto.sku?.trim() || null;
    if (dto.priceCents !== undefined) variant.priceCents = dto.priceCents;
    if (dto.taxExempt !== undefined) variant.taxExempt = dto.taxExempt;
    if (dto.lowStockThreshold !== undefined) {
      variant.lowStockThreshold = dto.lowStockThreshold;
    }
    if (dto.attributes !== undefined) variant.attributes = dto.attributes;
    if (dto.imageKey !== undefined) {
      if (dto.imageKey === null && variant.imageKey) {
        await this.storage.delete(variant.imageKey);
      }
      variant.imageKey = dto.imageKey;
    }
    await this.variants.save(variant);
    return this.toVariantDto(variant);
  }

  async restockVariant(id: string, dto: RestockVariantDto, user: AuthUser) {
    if (dto.delta === 0) {
      throw new BadRequestException('delta must be non-zero');
    }
    const variant = await this.findVariant(id, user.businessId);
    const next = variant.stockOnHand + dto.delta;
    if (next < variant.stockReserved) {
      throw new BadRequestException(
        `Cannot set stock below reserved amount (${variant.stockReserved})`,
      );
    }
    if (next < 0) {
      throw new BadRequestException('stockOnHand cannot be negative');
    }
    variant.stockOnHand = next;
    await this.variants.save(variant);
    return this.toVariantDto(variant);
  }

  /** Soft delete not modeled — hard delete product + cascade variants */
  async deleteProduct(id: string, user: AuthUser) {
    const product = await this.findProduct(id, user.businessId);
    const reserved = (product.variants ?? []).some((v) => v.stockReserved > 0);
    if (reserved) {
      throw new BadRequestException(
        'Cannot delete product while variants have reserved stock',
      );
    }
    await this.products.remove(product);
    return { ok: true, id };
  }

  private async findProduct(id: string, businessId: string) {
    const product = await this.products.findOne({
      where: { id, businessId },
      relations: { variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async findVariant(id: string, businessId: string) {
    const variant = await this.variants.findOne({
      where: { id, businessId },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  private toProductDto(p: Product) {
    const galleryKeys = this.parseGallery(p.galleryKeysJson);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      imageKey: p.imageKey,
      imageUrl: this.storage.publicUrl(p.imageKey),
      galleryKeys,
      galleryUrls: galleryKeys
        .map((k) => this.storage.publicUrl(k))
        .filter(Boolean),
      publishedToStore: p.publishedToStore,
      variants: (p.variants ?? []).map((v) => this.toVariantDto(v)),
    };
  }

  private toVariantDto(v: ProductVariant) {
    return {
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      attributes: v.attributes,
      priceCents: v.priceCents,
      stockOnHand: v.stockOnHand,
      stockReserved: v.stockReserved,
      available: v.stockOnHand - v.stockReserved,
      taxExempt: v.taxExempt,
      lowStockThreshold: v.lowStockThreshold,
      imageKey: v.imageKey,
      imageUrl: this.storage.publicUrl(v.imageKey),
    };
  }

  private parseGallery(json: string | null): string[] {
    if (!json) return [];
    try {
      const arr = JSON.parse(json) as string[];
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
}
