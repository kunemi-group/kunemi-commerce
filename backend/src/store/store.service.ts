import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../database/entities/business.entity';
import { Product } from '../database/entities/product.entity';
import { normalizeCurrency } from '../common/currency';
import { StorageService } from '../storage/storage.service';

/**
 * Public storefront catalog for ShopFlow (and other storefronts).
 * Kunemi Workspace is the system of record; ShopFlow only reads.
 */
@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly storage: StorageService,
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
      brandColor: b.brandColor,
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
      /** ShopFlow should create checkout intent back into Workspace orders later */
      workspaceApiHint: '/api/store/:slug',
    };
  }

  private toPublicProduct(p: Product) {
    const gallery = this.parseGallery(p.galleryKeysJson).map(
      (k) => this.storage.publicUrl(k)!,
    );
    const imageUrl =
      this.storage.publicUrl(p.imageKey) || gallery[0] || null;

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
