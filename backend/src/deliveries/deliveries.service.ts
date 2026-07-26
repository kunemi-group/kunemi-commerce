import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import type { AuthUser } from '../common/types/auth-user';
import { Delivery, DeliveryStatus } from '../database/entities/delivery.entity';
import { DeliveryStatusEvent } from '../database/entities/delivery-status-event.entity';
import { Order } from '../database/entities/order.entity';
import { OrderStatusHistory } from '../database/entities/order-status-history.entity';
import { CreateDeliveryDto, UpdateDeliveryStatusDto } from './dto/delivery.dto';

const MANUAL_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  awaiting_pickup: ['picked_up', 'cancelled', 'failed'],
  picked_up: ['out_for_delivery', 'failed', 'cancelled'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: ['awaiting_pickup'],
  cancelled: [],
};

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Delivery)
    private readonly deliveries: Repository<Delivery>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
  ) {}

  async list(user: AuthUser) {
    const rows = await this.deliveries.find({
      where: { businessId: user.businessId },
      relations: { order: true, events: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return {
      deliveries: rows.map((d) => this.toDto(d)),
    };
  }

  async getOne(id: string, user: AuthUser) {
    const d = await this.deliveries.findOne({
      where: { id, businessId: user.businessId },
      relations: { order: true, events: true },
    });
    if (!d) throw new NotFoundException('Delivery not found');
    return this.toDto(d);
  }

  async create(dto: CreateDeliveryDto, user: AuthUser) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const deliveryRepo = manager.getRepository(Delivery);
      const eventRepo = manager.getRepository(DeliveryStatusEvent);
      const historyRepo = manager.getRepository(OrderStatusHistory);

      const order = await orderRepo.findOne({
        where: { id: dto.orderId, businessId: user.businessId },
      });
      if (!order) throw new NotFoundException('Order not found');

      if (!['paid', 'shipped'].includes(order.status)) {
        throw new BadRequestException(
          `Order must be paid (bank transfer verified) before shipping (current: ${order.status})`,
        );
      }

      const existing = await deliveryRepo.findOne({
        where: { orderId: order.id, businessId: user.businessId },
      });
      if (existing) {
        throw new BadRequestException('Delivery already exists for this order');
      }

      if (dto.fulfillmentMode === 'api_integrated' && !dto.provider) {
        throw new BadRequestException(
          'provider is required for api_integrated fulfillment',
        );
      }

      const trackingToken = `trk_${randomBytes(8).toString('hex')}`;
      const providerReference =
        dto.fulfillmentMode === 'api_integrated'
          ? `API-${randomBytes(4).toString('hex').toUpperCase()}`
          : null;

      const delivery = deliveryRepo.create({
        businessId: user.businessId,
        orderId: order.id,
        fulfillmentMode: dto.fulfillmentMode,
        provider: dto.provider ?? null,
        providerReference,
        externalTrackingUrl: dto.externalTrackingUrl ?? null,
        externalCourierName: dto.externalCourierName ?? null,
        trackingToken,
        status: 'awaiting_pickup',
      });
      await deliveryRepo.save(delivery);

      await eventRepo.save(
        eventRepo.create({
          deliveryId: delivery.id,
          fromStatus: null,
          toStatus: 'awaiting_pickup',
          changedBy: user.sub,
          note: 'Delivery created',
        }),
      );

      if (order.status === 'paid') {
        const from = order.status;
        order.status = 'shipped';
        await orderRepo.save(order);
        await historyRepo.save(
          historyRepo.create({
            orderId: order.id,
            fromStatus: from,
            toStatus: 'shipped',
            changedBy: user.sub,
            reason: 'Delivery assigned',
          }),
        );
      }

      const full = await deliveryRepo.findOne({
        where: { id: delivery.id },
        relations: { order: true, events: true },
      });
      return this.toDto(full!);
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateDeliveryStatusDto,
    user: AuthUser,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const deliveryRepo = manager.getRepository(Delivery);
      const eventRepo = manager.getRepository(DeliveryStatusEvent);
      const orderRepo = manager.getRepository(Order);
      const historyRepo = manager.getRepository(OrderStatusHistory);

      const delivery = await deliveryRepo.findOne({
        where: { id, businessId: user.businessId },
      });
      if (!delivery) throw new NotFoundException('Delivery not found');

      const allowed = MANUAL_TRANSITIONS[delivery.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition delivery from ${delivery.status} to ${dto.status}`,
        );
      }

      if (
        delivery.fulfillmentMode === 'api_integrated' &&
        dto.status !== 'cancelled' &&
        dto.status !== 'failed'
      ) {
        // Still allow manual overrides for demo; real courier webhooks later
      }

      const from = delivery.status;
      delivery.status = dto.status;
      if (dto.externalTrackingUrl !== undefined) {
        delivery.externalTrackingUrl = dto.externalTrackingUrl || null;
      }
      if (dto.externalCourierName !== undefined) {
        delivery.externalCourierName = dto.externalCourierName || null;
      }
      await deliveryRepo.save(delivery);

      await eventRepo.save(
        eventRepo.create({
          deliveryId: delivery.id,
          fromStatus: from,
          toStatus: dto.status,
          changedBy: user.sub,
          note: dto.note ?? null,
        }),
      );

      const order = await orderRepo.findOne({
        where: { id: delivery.orderId, businessId: user.businessId },
      });
      if (order) {
        if (dto.status === 'delivered' && order.status !== 'delivered') {
          const prev = order.status;
          order.status = 'delivered';
          await orderRepo.save(order);
          await historyRepo.save(
            historyRepo.create({
              orderId: order.id,
              fromStatus: prev,
              toStatus: 'delivered',
              changedBy: user.sub,
              reason: 'Delivery marked delivered',
            }),
          );
        }
        if (dto.status === 'cancelled' && order.status === 'shipped') {
          // leave order as shipped; ops can handle separately
        }
      }

      const full = await deliveryRepo.findOne({
        where: { id: delivery.id },
        relations: { order: true, events: true },
      });
      return this.toDto(full!);
    });
  }

  private toDto(d: Delivery) {
    const events = [...(d.events ?? [])].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return {
      id: d.id,
      orderId: d.orderId,
      fulfillmentMode: d.fulfillmentMode,
      provider: d.provider,
      providerReference: d.providerReference,
      externalTrackingUrl: d.externalTrackingUrl,
      externalCourierName: d.externalCourierName,
      trackingToken: d.trackingToken,
      trackingPath: `/track/${d.trackingToken}`,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      order: d.order
        ? {
            id: d.order.id,
            status: d.order.status,
            customerName: d.order.customerName,
            customerPhone: d.order.customerPhone,
            deliveryAddress: d.order.deliveryAddress,
          }
        : undefined,
      events: events.map((e) => ({
        id: e.id,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        note: e.note,
        createdAt: e.createdAt,
      })),
    };
  }
}
