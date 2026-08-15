import { NotFoundException } from '@nestjs/common';
import { StorefrontService } from './storefront.service';

describe('StorefrontService', () => {
  const businesses = { findOne: jest.fn() };
  const products = { find: jest.fn(), findOne: jest.fn() };
  const storage = {
    publicUrl: jest.fn((k: string | null) => (k ? `/media/${k}` : null)),
  };
  const orders = { createFromStorefront: jest.fn() };

  let service: StorefrontService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorefrontService(
      businesses as never,
      products as never,
      storage as never,
      orders as never,
    );
  });

  it('rejects missing or disabled stores', async () => {
    businesses.findOne.mockResolvedValue(null);
    await expect(service.getStore('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    businesses.findOne.mockResolvedValue({
      storeSlug: 'demo',
      storeEnabled: false,
    });
    await expect(service.getStore('demo')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists only published products for an enabled store', async () => {
    businesses.findOne.mockResolvedValue({
      id: 'b1',
      name: 'Demo',
      storeSlug: 'demo',
      storeEnabled: true,
      brandColor: '#000',
      currency: 'NGN',
      taxEnabled: false,
      taxRatePercent: 0,
      taxLabel: 'VAT',
      defaultShippingFeeCents: 0,
      logoKey: null,
      whatsappNumber: null,
      email: null,
      address: null,
    });
    products.find.mockResolvedValue([
      {
        id: 'p1',
        name: 'Dress',
        description: null,
        imageKey: null,
        galleryKeysJson: null,
        publishedToStore: true,
        variants: [
          {
            id: 'v1',
            sku: 'D',
            attributes: null,
            priceCents: 1000,
            stockOnHand: 5,
            stockReserved: 0,
            taxExempt: false,
            imageKey: null,
          },
        ],
      },
    ]);

    const result = await service.listProducts('demo');
    expect(result.store.slug).toBe('demo');
    expect(result.store.storePath).toBe('/s/demo');
    expect(result.products).toHaveLength(1);
    expect(result.products[0].fromPriceCents).toBe(1000);
    expect(products.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ publishedToStore: true }),
      }),
    );
  });

  it('delegates checkout to Workspace orders (not ShopFlow)', async () => {
    businesses.findOne.mockResolvedValue({
      id: 'b1',
      storeSlug: 'demo',
      storeEnabled: true,
    });
    orders.createFromStorefront.mockResolvedValue({
      id: 'o1',
      source: 'workspace_storefront',
    });

    const out = await service.checkout('demo', {
      customerName: 'A',
      customerPhone: '+234',
      items: [{ variantId: 'v1', quantity: 1 }],
    });

    expect(orders.createFromStorefront).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({ customerName: 'A' }),
    );
    expect(out.source).toBe('workspace_storefront');
  });
});
