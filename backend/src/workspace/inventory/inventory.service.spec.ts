import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  const products = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const variants = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const storage = {
    publicUrl: jest.fn((key: string | null) => (key ? `https://cdn.example/${key}` : null)),
    delete: jest.fn(),
  };
  const user = {
    sub: 'owner-1',
    businessId: 'business-1',
    role: 'owner' as const,
    email: 'owner@example.com',
  };

  let service: InventoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryService(products as never, variants as never, storage as never);
  });

  it('lists products scoped to the authenticated business', async () => {
    products.find.mockResolvedValue([]);

    await expect(service.listProducts(user)).resolves.toEqual({ optional: true, products: [] });
    expect(products.find).toHaveBeenCalledWith({
      where: { businessId: 'business-1' },
      relations: { variants: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('rejects product lookup across business boundaries', async () => {
    products.findOne.mockResolvedValue(null);

    await expect(service.getProduct('product-from-business-2', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(products.findOne).toHaveBeenCalledWith({
      where: { id: 'product-from-business-2', businessId: 'business-1' },
      relations: { variants: true },
    });
  });

  it('creates a product and initial variant under the user business', async () => {
    const product = {
      id: 'product-1',
      businessId: 'business-1',
      name: 'T-Shirt',
      description: null,
      imageKey: null,
      galleryKeysJson: null,
      publishedToStore: true,
      variants: [],
    };
    const variant = {
      id: 'variant-1',
      productId: 'product-1',
      businessId: 'business-1',
      sku: 'TS-BLK-M',
      attributes: null,
      priceCents: 2_000,
      stockOnHand: 5,
      stockReserved: 0,
      taxExempt: false,
      lowStockThreshold: 5,
      imageKey: null,
    };
    products.create.mockReturnValue(product);
    products.save.mockResolvedValue(product);
    variants.create.mockReturnValue(variant);
    variants.save.mockResolvedValue(variant);
    products.findOne.mockResolvedValue({ ...product, variants: [variant] });

    const result = await service.createProduct(
      {
        name: 'T-Shirt',
        variant: { sku: 'TS-BLK-M', priceCents: 2_000, stockOnHand: 5 },
      },
      user,
    );

    expect(products.create).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'business-1', name: 'T-Shirt' }),
    );
    expect(variants.create).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'product-1', businessId: 'business-1' }),
    );
    expect(result.variants[0]).toEqual(expect.objectContaining({ available: 5 }));
  });

  it('prevents restocking below reserved stock and rejects zero deltas', async () => {
    const variant = {
      id: 'variant-1',
      businessId: 'business-1',
      stockOnHand: 5,
      stockReserved: 4,
      priceCents: 1_000,
      sku: null,
      attributes: null,
      taxExempt: false,
      lowStockThreshold: 5,
      imageKey: null,
    };
    variants.findOne.mockResolvedValue(variant);

    await expect(service.restockVariant('variant-1', { delta: 0 }, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.restockVariant('variant-1', { delta: -2 }, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(variants.save).not.toHaveBeenCalled();
  });

  it('updates a product image and removes the old storage object when cleared', async () => {
    const product = {
      id: 'product-1',
      businessId: 'business-1',
      name: 'T-Shirt',
      description: 'Old description',
      imageKey: 'products/old.jpg',
      galleryKeysJson: null,
      publishedToStore: true,
      variants: [],
    };
    products.findOne.mockResolvedValue(product);
    products.save.mockResolvedValue(product);

    await service.updateProduct('product-1', { imageKey: null }, user);

    expect(storage.delete).toHaveBeenCalledWith('products/old.jpg');
    expect(product.imageKey).toBeNull();
    expect(products.save).toHaveBeenCalledWith(product);
  });

  it('prevents deleting a product with reserved stock', async () => {
    products.findOne.mockResolvedValue({
      id: 'product-1',
      businessId: 'business-1',
      variants: [{ stockReserved: 1 }],
    });

    await expect(service.deleteProduct('product-1', user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(products.remove).not.toHaveBeenCalled();
  });

  it('does not add a variant to a product from another business', async () => {
    products.findOne.mockResolvedValue(null);

    await expect(
      service.addVariant('product-from-business-2', { priceCents: 1_000 }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(variants.create).not.toHaveBeenCalled();
  });
});
