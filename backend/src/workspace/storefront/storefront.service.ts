import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeCurrency } from '../../common/currency';
import { Business } from '../../database/entities/business.entity';
import { Product } from '../../database/entities/product.entity';
import { StorageService } from '../../shared/storage/storage.service';
import { OrdersService } from '../orders/orders.service';
import { StoreCheckoutDto } from './dto/store-checkout.dto';

/**
 * Single-business public storefront for Kunemi Workspace.
 * Catalog + guest checkout → seller-owned Workspace orders.
 * Not ShopFlow marketplace.
 */
@Injectable()
export class StorefrontService {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly storage: StorageService,
    private readonly orders: OrdersService,
  ) {}

  async getStore(slug: string) {
    const business = await this.findBySlug(slug);
    return this.toPublicBusiness(business);
  }

  async listProducts(slug: string) {
    const business = await this.findBySlug(slug);
    const products = await this.products.find({
      where: {
        businessId: business.id,
        publishedToStore: true,
      },
      relations: { variants: true },
      order: { createdAt: 'DESC' },
    });
    return {
      store: this.toPublicBusiness(business),
      products: products.map((p) => this.toPublicProduct(p)),
    };
  }

  async getProduct(slug: string, productId: string) {
    const business = await this.findBySlug(slug);
    const product = await this.products.findOne({
      where: {
        id: productId,
        businessId: business.id,
        publishedToStore: true,
      },
      relations: { variants: true },
    });
    if (!product) throw new NotFoundException('Product not found in store');
    return {
      store: this.toPublicBusiness(business),
      product: this.toPublicProduct(product),
    };
  }

  async checkout(slug: string, dto: StoreCheckoutDto) {
    const business = await this.findBySlug(slug);
    if (!dto.items?.length) {
      throw new BadRequestException('Cart is empty');
    }
    return this.orders.createFromStorefront(business.id, dto);
  }

  private async findBySlug(slug: string) {
    const normalized = slug.trim().toLowerCase();
    const business = await this.businesses.findOne({
      where: { storeSlug: normalized },
    });
    if (!business || !business.storeEnabled) {
      throw new NotFoundException('Store not found');
    }
    return business;
  }

  private toPublicBusiness(b: Business) {
    return {
      id: b.id,
      name: b.name,
      slug: b.storeSlug,
      whatsappNumber: b.whatsappNumber,
      email: b.email,
      address: b.address,
      brandColor: b.brandColor || '#4f6bed',
      logoUrl: this.storage.publicUrl(b.logoKey),
      currency: normalizeCurrency(b.currency),
      tax: {
        enabled: b.taxEnabled,
        ratePercent: Number(b.taxRatePercent),
        label: b.taxLabel,
      },
      shipping: {
        defaultFeeCents: b.defaultShippingFeeCents,
      },
      /** Public Workspace storefront path (not ShopFlow) */
      storePath: b.storeSlug ? `/s/${b.storeSlug}` : null,
    };
  }

  private toPublicProduct(p: Product) {
    const gallery = this.parseGallery(p.galleryKeysJson).map((k) =>
      this.storage.publicUrl(k)!,
    );
    const imageUrl = this.storage.publicUrl(p.imageKey) || gallery[0] || null;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl,
      galleryUrls: gallery,
      publishedToStore: p.publishedToStore,
      variants: (p.variants ?? []).map((v) => ({
        id: v.id,
        sku: v.sku,
        attributes: v.attributes,
        priceCents: v.priceCents,
        available: Math.max(0, v.stockOnHand - v.stockReserved),
        taxExempt: v.taxExempt,
        imageUrl: this.storage.publicUrl(v.imageKey),
        inStock: v.stockOnHand - v.stockReserved > 0,
      })),
      fromPriceCents: this.minPrice(p),
    };
  }

  private minPrice(p: Product): number | null {
    const prices = (p.variants ?? []).map((v) => v.priceCents);
    if (!prices.length) return null;
    return Math.min(...prices);
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
