import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { OrderStatusHistory } from '../../database/entities/order-status-history.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const dataSource = { transaction: jest.fn() };
  const config = { get: jest.fn() };
  const orders = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const businesses = { findOne: jest.fn() };
  const variants = {};
  const payments = {};
  const deliveries = {};
  const paymentsService = {
    createForOrder: jest.fn(),
    paymentUrl: jest.fn((token: string) => `https://pay.example/${token}`),
    markExpiredForOrders: jest.fn(),
    verify: jest.fn(),
  };
  const mailService = { sendOrderConfirmation: jest.fn() };

  const user = {
    sub: 'agent-1',
    businessId: 'business-1',
    role: 'owner' as const,
    email: 'owner@example.com',
  };

  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue('sqlite');
    service = new OrdersService(
      dataSource as never,
      config as never,
      orders as never,
      businesses as never,
      variants as never,
      payments as never,
      deliveries as never,
      paymentsService as never,
      mailService as never,
    );
  });

  it('creates a freeform order within the authenticated business', async () => {
    businesses.findOne.mockResolvedValue({
      id: 'business-1',
      taxEnabled: false,
      taxRatePercent: 0,
      defaultShippingFeeCents: 100,
      bankName: 'Example Bank',
      bankAccountName: 'Example Store',
      bankAccountNumber: '123',
      currency: 'NGN',
    });

    const order = {
      id: 'order-1',
      businessId: 'business-1',
      status: 'pending',
      customerName: 'Ada',
      customerPhone: '+2348000000000',
      customerEmail: 'ada@example.com',
      deliveryAddress: null,
      reservedUntil: new Date(Date.now() + 1_000),
      subtotalCents: 2_000,
      taxCents: 0,
      shippingFeeCents: 100,
      totalCents: 2_100,
    };
    const itemRepo = {
      create: jest.fn((input) =>
        Array.isArray(input)
          ? input.map((item) => ({ ...item, id: 'item-1' }))
          : input,
      ),
      save: jest.fn(),
    };
    const orderRepo = {
      create: jest.fn(() => order),
      save: jest.fn(),
    };
    const variantRepo = { findOne: jest.fn(), save: jest.fn() };
    const historyRepo = { create: jest.fn((input) => input), save: jest.fn() };
    const manager = {
      getRepository: jest
        .fn()
        .mockReturnValueOnce(variantRepo)
        .mockReturnValueOnce(orderRepo)
        .mockReturnValueOnce(itemRepo)
        .mockReturnValueOnce(historyRepo),
    };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );
    paymentsService.createForOrder.mockResolvedValue({
      id: 'payment-1',
      method: 'bank_transfer',
      status: 'pending',
      reference: 'REF-1',
      paymentToken: 'token-1',
      amountCents: 2_100,
    });

    const result = await service.create(
      {
        customerName: 'Ada',
        customerPhone: '+2348000000000',
        customerEmail: 'ada@example.com',
        items: [
          {
            description: 'Consulting',
            quantity: 2,
            unitPriceCents: 1_000,
          },
        ],
      },
      user,
    );

    expect(businesses.findOne).toHaveBeenCalledWith({
      where: { id: 'business-1' },
    });
    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'business-1', agentId: 'agent-1' }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'order-1',
        totalCents: 2_100,
        paymentWindowMinutes: 30,
      }),
    );
    expect(result.payment.paymentUrl).toBe('https://pay.example/token-1');
  });

  it('rejects a catalog variant that belongs to another business', async () => {
    businesses.findOne.mockResolvedValue({
      id: 'business-1',
      taxEnabled: false,
      taxRatePercent: 0,
      defaultShippingFeeCents: 0,
    });
    const variantRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const manager = { getRepository: jest.fn().mockReturnValue(variantRepo) };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(
      service.create(
        {
          customerName: 'Ada',
          customerPhone: '+2348000000000',
          items: [{ variantId: 'variant-from-business-2', quantity: 1 }],
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(variantRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'variant-from-business-2', businessId: 'business-1' },
    });
  });

  it('does not allow cancellation of an order from another business', async () => {
    const orderRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const manager = { getRepository: jest.fn().mockReturnValue(orderRepo) };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(
      service.cancel('order-from-business-2', user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'order-from-business-2', businessId: 'business-1' },
    });
  });

  it('expires stale holds and releases only tenant-owned stock', async () => {
    const staleOrder = {
      id: 'order-1',
      businessId: 'business-1',
      status: 'pending',
    };
    orders.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([staleOrder]),
    });
    const locked = {
      id: 'order-1',
      businessId: 'business-1',
      status: 'pending',
      reservedUntil: new Date(Date.now() - 1_000),
    };
    const orderRepo = {
      findOne: jest.fn().mockResolvedValue(locked),
      save: jest.fn(),
    };
    const itemRepo = {
      find: jest
        .fn()
        .mockResolvedValue([{ variantId: 'variant-1', quantity: 2 }]),
    };
    const variant = {
      id: 'variant-1',
      businessId: 'business-1',
      stockReserved: 3,
    };
    const variantRepo = {
      findOne: jest.fn().mockResolvedValue(variant),
      save: jest.fn(),
    };
    const historyRepo = { create: jest.fn((input) => input), save: jest.fn() };
    const manager = {
      getRepository: jest
        .fn()
        .mockReturnValueOnce(orderRepo)
        .mockReturnValueOnce(itemRepo)
        .mockReturnValueOnce(variantRepo)
        .mockReturnValueOnce(historyRepo),
    };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    await expect(service.expireStaleHolds()).resolves.toEqual({ expired: 1 });
    expect(variantRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'variant-1', businessId: 'business-1' },
    });
    expect(variant.stockReserved).toBe(1);
    expect(locked.status).toBe('expired');
    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: {
        id: 'order-1',
        businessId: 'business-1',
        status: 'pending',
      },
    });
    expect(paymentsService.markExpiredForOrders).toHaveBeenCalledWith([
      { id: 'order-1', businessId: 'business-1' },
    ]);
  });
});
