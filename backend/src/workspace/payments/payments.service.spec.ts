import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { OrderStatusHistory } from '../../database/entities/order-status-history.entity';
import { Payment } from '../../database/entities/payment.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const dataSource = { transaction: jest.fn() };
  const config = { get: jest.fn() };
  const payments = { find: jest.fn(), findOne: jest.fn(), update: jest.fn() };
  const orders = {};
  const businesses = {};
  const storage = {
    uploadBase64: jest.fn(),
    getObject: jest.fn(),
    publicUrl: jest.fn((key: string) => `https://cdn.example/${key}`),
    delete: jest.fn(),
  };
  const paymentProviders = {
    get: jest.fn(),
    resolveForBusiness: jest.fn(),
    listAvailable: jest.fn(() => ['bank_transfer']),
  };
  const user = {
    sub: 'owner-1',
    businessId: 'business-1',
    role: 'owner' as const,
    email: 'owner@example.com',
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string, fallback?: string) => {
      if (key === 'DATABASE_TYPE') return 'sqlite';
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return fallback;
    });
    service = new PaymentsService(
      dataSource as never,
      config as never,
      payments as never,
      orders as never,
      businesses as never,
      storage as never,
      paymentProviders as never,
    );
  });

  it('lists only payments belonging to the authenticated business', async () => {
    payments.find.mockResolvedValue([]);

    await expect(service.list(user)).resolves.toEqual(
      expect.objectContaining({ payments: expect.any(Array) }),
    );
    expect(payments.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'business-1' } }),
    );
  });

  it('moves a valid public claim into payment review', async () => {
    const payment = {
      id: 'payment-1',
      businessId: 'business-1',
      orderId: 'order-1',
      paymentToken: 'pay-token',
      status: 'awaiting_transfer',
      rejectReason: null,
    };
    const order = {
      id: 'order-1',
      businessId: 'business-1',
      status: 'pending',
      reservedUntil: new Date(Date.now() + 60_000),
    };
    const paymentRepo = {
      findOne: jest.fn().mockResolvedValue(payment),
      save: jest.fn(),
    };
    const orderRepo = { findOne: jest.fn().mockResolvedValue(order), save: jest.fn() };
    const historyRepo = { create: jest.fn((input) => input), save: jest.fn() };
    const manager = {
      getRepository: jest
        .fn()
        .mockReturnValueOnce(paymentRepo)
        .mockReturnValueOnce(orderRepo)
        .mockReturnValueOnce(historyRepo),
    };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    const result = await service.claimByToken('pay-token', {
      customerNote: 'Paid from mobile banking',
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: true, paymentStatus: 'claimed', orderStatus: 'payment_review' }),
    );
    expect(payment.status).toBe('claimed');
    expect(payment.customerNote).toBe('Paid from mobile banking');
    expect(order.status).toBe('payment_review');
    expect(historyRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ fromStatus: 'pending', toStatus: 'payment_review', changedBy: null }),
    );
  });

  it('rejects claims after the payment window expires', async () => {
    const paymentRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        status: 'awaiting_transfer',
      }),
      save: jest.fn(),
    };
    const orderRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'order-1',
        status: 'pending',
        reservedUntil: new Date(Date.now() - 1_000),
      }),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValueOnce(paymentRepo).mockReturnValueOnce(orderRepo),
    };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    await expect(service.claimByToken('expired-token', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(paymentRepo.save).not.toHaveBeenCalled();
  });

  it('verifies a tenant-owned payment, finalizes stock, and marks the order paid', async () => {
    const payment = {
      id: 'payment-1',
      businessId: 'business-1',
      orderId: 'order-1',
      status: 'claimed',
      paymentToken: 'pay-token',
      method: 'bank_transfer',
      amountCents: 1_000,
      reference: 'REF-1',
      claimedAt: null,
      customerNote: null,
      proofPath: null,
      proofFilename: null,
      verifiedBy: null,
      verifiedAt: null,
      rejectReason: null,
    };
    const order = {
      id: 'order-1',
      businessId: 'business-1',
      status: 'payment_review',
      reservedUntil: new Date(Date.now() + 60_000),
    };
    const variant = {
      id: 'variant-1',
      businessId: 'business-1',
      stockReserved: 2,
      stockOnHand: 5,
    };
    const savedPayment = {
      ...payment,
      status: 'verified',
      verifiedBy: 'owner-1',
      verifiedAt: new Date(),
      order,
    };
    const paymentRepo = {
      findOne: jest.fn().mockResolvedValueOnce(payment).mockResolvedValueOnce(savedPayment),
      save: jest.fn(),
    };
    const orderRepo = { findOne: jest.fn().mockResolvedValue(order), save: jest.fn() };
    const itemRepo = { find: jest.fn().mockResolvedValue([{ variantId: 'variant-1', quantity: 2 }]) };
    const variantRepo = { findOne: jest.fn().mockResolvedValue(variant), save: jest.fn() };
    const historyRepo = { create: jest.fn((input) => input), save: jest.fn() };
    const manager = {
      getRepository: jest
        .fn()
        .mockReturnValueOnce(paymentRepo)
        .mockReturnValueOnce(orderRepo)
        .mockReturnValueOnce(itemRepo)
        .mockReturnValueOnce(variantRepo)
        .mockReturnValueOnce(historyRepo),
    };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    const result = await service.verify('payment-1', user, 'Confirmed in bank statement');

    expect(paymentRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'payment-1', businessId: 'business-1' },
    });
    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'order-1', businessId: 'business-1' },
    });
    expect(variantRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'variant-1', businessId: 'business-1' },
    });
    expect(variant.stockReserved).toBe(0);
    expect(variant.stockOnHand).toBe(3);
    expect(order.status).toBe('paid');
    expect(payment.status).toBe('verified');
    expect(payment.verifiedBy).toBe('owner-1');
    expect(result).toEqual(expect.objectContaining({ id: 'payment-1', status: 'verified' }));
  });

  it('does not verify a payment from another business', async () => {
    const paymentRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const manager = { getRepository: jest.fn().mockReturnValue(paymentRepo) };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    await expect(service.verify('payment-from-business-2', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(paymentRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'payment-from-business-2', businessId: 'business-1' },
    });
  });

  it('protects proof access with the payment business scope', async () => {
    payments.findOne.mockResolvedValue(null);

    await expect(service.getProofFile('payment-from-business-2', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(payments.findOne).toHaveBeenCalledWith({
      where: { id: 'payment-from-business-2', businessId: 'business-1' },
    });
  });
});
