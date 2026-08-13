import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Delivery } from '../../../database/entities/delivery.entity';
import { DeliveryStatusEvent } from '../../../database/entities/delivery-status-event.entity';
import { Order } from '../../../database/entities/order.entity';
import { OrderStatusHistory } from '../../../database/entities/order-status-history.entity';
import { DeliveriesService } from './deliveries.service';

describe('DeliveriesService', () => {
  const dataSource = { transaction: jest.fn() };
  const deliveries = { find: jest.fn(), findOne: jest.fn() };
  const orders = {};
  const user = {
    sub: 'owner-1',
    businessId: 'business-1',
    role: 'owner' as const,
    email: 'owner@example.com',
  };
  let service: DeliveriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DeliveriesService(dataSource as never, deliveries as never, orders as never);
  });

  it('lists deliveries only for the authenticated business', async () => {
    deliveries.find.mockResolvedValue([]);

    await expect(service.list(user)).resolves.toEqual({ deliveries: [] });
    expect(deliveries.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { businessId: 'business-1' } }),
    );
  });

  it('rejects delivery lookup across business boundaries', async () => {
    deliveries.findOne.mockResolvedValue(null);

    await expect(service.getOne('delivery-from-business-2', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(deliveries.findOne).toHaveBeenCalledWith({
      where: { id: 'delivery-from-business-2', businessId: 'business-1' },
      relations: { order: true, events: true },
    });
  });

  it('requires a paid or shipped order before creating delivery', async () => {
    const orderRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'order-1', status: 'pending' }),
    };
    const manager = { getRepository: jest.fn().mockReturnValue(orderRepo) };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    await expect(
      service.create({ orderId: 'order-1', fulfillmentMode: 'manual' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'order-1', businessId: 'business-1' },
    });
  });

  it('requires a provider for API-integrated fulfillment', async () => {
    const orderRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'order-1', status: 'paid' }),
    };
    const deliveryRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const manager = {
      getRepository: jest.fn().mockReturnValueOnce(orderRepo).mockReturnValueOnce(deliveryRepo),
    };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    await expect(
      service.create({ orderId: 'order-1', fulfillmentMode: 'api_integrated' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid delivery status transitions', async () => {
    const deliveryRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'delivery-1',
        businessId: 'business-1',
        orderId: 'order-1',
        status: 'delivered',
      }),
    };
    const manager = { getRepository: jest.fn().mockReturnValue(deliveryRepo) };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    await expect(
      service.updateStatus('delivery-1', { status: 'picked_up' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('marks the related order delivered on a valid delivered transition', async () => {
    const delivery = {
      id: 'delivery-1',
      businessId: 'business-1',
      orderId: 'order-1',
      fulfillmentMode: 'manual',
      provider: null,
      providerReference: null,
      externalTrackingUrl: null,
      externalCourierName: null,
      trackingToken: 'trk-1',
      status: 'out_for_delivery',
    };
    const order = { id: 'order-1', businessId: 'business-1', status: 'shipped' };
    const deliveryRepo = {
      findOne: jest.fn().mockResolvedValueOnce(delivery).mockResolvedValueOnce({ ...delivery, status: 'delivered', order, events: [] }),
      save: jest.fn(),
    };
    const eventRepo = { create: jest.fn((input) => input), save: jest.fn() };
    const orderRepo = { findOne: jest.fn().mockResolvedValue(order), save: jest.fn() };
    const historyRepo = { create: jest.fn((input) => input), save: jest.fn() };
    const manager = {
      getRepository: jest
        .fn()
        .mockReturnValueOnce(deliveryRepo)
        .mockReturnValueOnce(eventRepo)
        .mockReturnValueOnce(orderRepo)
        .mockReturnValueOnce(historyRepo),
    };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    const result = await service.updateStatus('delivery-1', { status: 'delivered' }, user);

    expect(delivery.status).toBe('delivered');
    expect(order.status).toBe('delivered');
    expect(historyRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ fromStatus: 'shipped', toStatus: 'delivered' }),
    );
    expect(result.status).toBe('delivered');
  });
});
