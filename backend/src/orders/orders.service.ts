import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { computeOrderTotals } from '../common/money';
import type { AuthUser } from '../common/types/auth-user';
import { Business } from '../database/entities/business.entity';
import { Delivery } from '../database/entities/delivery.entity';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { OrderStatusHistory } from '../database/entities/order-status-history.entity';
import { Payment } from '../database/entities/payment.entity';
import { ProductVariant } from '../database/entities/product-variant.entity';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto } from './dto/create-order.dto';

/** Default window for customer bank transfer (also stock hold when catalog lines). */
const PAYMENT_WINDOW_MINUTES = 30;

@Injectable()
export class OrdersService {
  private readonly useRowLocks: boolean;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Delivery)
    private readonly deliveries: Repository<Delivery>,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {
    // SQLite does not support PostgreSQL-style pessimistic row locks
    const dbType = this.config.get<string>('DATABASE_TYPE', 'postgres');
    this.useRowLocks = dbType !== 'sqlite' && dbType !== 'better-sqlite3';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private findOpts(base: Record<string, any>): any {
    if (!this.useRowLocks) return base;
    return { ...base, lock: { mode: 'pessimistic_write' as const } };
  }

  async create(dto: CreateOrderDto, user: AuthUser) {
    const business = await this.businesses.findOne({
      where: { id: user.businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const variantRepo = manager.getRepository(ProductVariant);
      const orderRepo = manager.getRepository(Order);
      const itemRepo = manager.getRepository(OrderItem);
      const historyRepo = manager.getRepository(OrderStatusHistory);

      type BuiltLine = {
        variantId: string | null;
        description: string;
        quantity: number;
        unitPriceCents: number;
        taxExempt: boolean;
        reservesStock: boolean;
      };

      const built: BuiltLine[] = [];

      for (let i = 0; i < dto.items.length; i++) {
        const item = dto.items[i];
        const hasVariant = Boolean(item.variantId);

        if (hasVariant) {
          const variant = await variantRepo.findOne(
            this.findOpts({
              where: {
                id: item.variantId,
                businessId: user.businessId,
              },
            }),
          );
          if (!variant) {
            throw new BadRequestException(
              `Item ${i + 1}: variant not found in this business catalog`,
            );
          }
          const available = variant.stockOnHand - variant.stockReserved;
          if (available < item.quantity) {
            throw new BadRequestException(
              `Item ${i + 1}: insufficient stock (available ${available})`,
            );
          }
          variant.stockReserved += item.quantity;
          await variantRepo.save(variant);

          const desc =
            item.description?.trim() ||
            [variant.sku, variant.attributes ? JSON.stringify(variant.attributes) : null]
              .filter(Boolean)
              .join(' · ') ||
            `SKU ${variant.id.slice(0, 8)}`;

          built.push({
            variantId: variant.id,
            description: desc,
            quantity: item.quantity,
            unitPriceCents: variant.priceCents,
            taxExempt:
              item.taxExempt !== undefined
                ? Boolean(item.taxExempt)
                : variant.taxExempt,
            reservesStock: true,
          });
        } else {
          const description = (item.description ?? '').trim();
          if (!description) {
            throw new BadRequestException(
              `Item ${i + 1}: freeform lines need a description`,
            );
          }
          if (item.unitPriceCents === undefined || item.unitPriceCents < 0) {
            throw new BadRequestException(
              `Item ${i + 1}: unitPriceCents required for freeform lines`,
            );
          }
          built.push({
            variantId: null,
            description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            taxExempt: Boolean(item.taxExempt),
            reservesStock: false,
          });
        }
      }

      const totals = computeOrderTotals({
        lines: built,
        shippingFeeCents: dto.shippingFeeCents ?? business.defaultShippingFeeCents,
        taxEnabled: business.taxEnabled,
        taxRatePercent: Number(business.taxRatePercent),
      });

      const anyHold = built.some((l) => l.reservesStock);
      // Always set payment countdown so customer has a transfer window
      const reservedUntil = new Date(
        Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000,
      );

      const order = orderRepo.create({
        businessId: user.businessId,
        agentId: user.sub,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail?.trim() || null,
        deliveryAddress: dto.deliveryAddress ?? null,
        status: 'pending',
        reservedUntil,
        shippingFeeCents: totals.shippingFeeCents,
        taxCents: totals.taxCents,
        subtotalCents: totals.subtotalCents,
        totalCents: totals.totalCents,
      });
      await orderRepo.save(order);

      const items = built.map((line) =>
        itemRepo.create({
          orderId: order.id,
          variantId: line.variantId,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          taxExempt: line.taxExempt,
        }),
      );
      await itemRepo.save(items);

      const payment = await this.paymentsService.createForOrder(manager, {
        businessId: user.businessId,
        orderId: order.id,
        amountCents: order.totalCents,
      });

      await historyRepo.save(
        historyRepo.create({
          orderId: order.id,
          fromStatus: null,
          toStatus: 'pending',
          changedBy: user.sub,
          reason: anyHold
            ? `Order created · stock reserved · pay via bank transfer within ${PAYMENT_WINDOW_MINUTES}m`
            : `Order created · bank transfer due within ${PAYMENT_WINDOW_MINUTES}m`,
        }),
      );

      return {
        id: order.id,
        status: order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        deliveryAddress: order.deliveryAddress,
        items: items.map((it) => ({
          id: it.id,
          variantId: it.variantId,
          description: it.description,
          quantity: it.quantity,
          unitPriceCents: it.unitPriceCents,
          taxExempt: it.taxExempt,
        })),
        subtotalCents: order.subtotalCents,
        taxCents: order.taxCents,
        shippingFeeCents: order.shippingFeeCents,
        totalCents: order.totalCents,
        reservedUntil: order.reservedUntil?.toISOString() ?? null,
        paymentWindowMinutes: PAYMENT_WINDOW_MINUTES,
        payment: {
          id: payment.id,
          method: payment.method,
          status: payment.status,
          reference: payment.reference,
          paymentToken: payment.paymentToken,
          paymentUrl: this.paymentsService.paymentUrl(payment.paymentToken),
          amountCents: payment.amountCents,
        },
        paymentLink: this.paymentsService.paymentUrl(payment.paymentToken),
        bankTransfer: {
          bankName: business.bankName,
          bankAccountName: business.bankAccountName,
          bankAccountNumber: business.bankAccountNumber,
          reference: payment.reference,
        },
        inventoryOptional: true,
      };
    });
  }

  async list(user: AuthUser) {
    const rows = await this.orders.find({
      where: { businessId: user.businessId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const orderIds = rows.map((o) => o.id);
    const { paymentByOrder, deliveryByOrder } =
      await this.loadPaymentDeliveryMaps(user.businessId, orderIds);

    return {
      orders: rows.map((o) =>
        this.toListItem(
          o,
          paymentByOrder.get(o.id),
          deliveryByOrder.get(o.id),
        ),
      ),
    };
  }

  async getOne(id: string, user: AuthUser) {
    const order = await this.orders.findOne({
      where: { id, businessId: user.businessId },
      relations: { items: true, statusHistory: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    const history = [...(order.statusHistory ?? [])].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const { paymentByOrder, deliveryByOrder } =
      await this.loadPaymentDeliveryMaps(user.businessId, [order.id]);

    return {
      ...this.toListItem(
        order,
        paymentByOrder.get(order.id),
        deliveryByOrder.get(order.id),
      ),
      statusHistory: history.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        reason: h.reason,
        changedBy: h.changedBy,
        createdAt: h.createdAt,
      })),
    };
  }

  private async loadPaymentDeliveryMaps(
    businessId: string,
    orderIds: string[],
  ) {
    const paymentByOrder = new Map<string, Payment>();
    const deliveryByOrder = new Map<string, Delivery>();
    if (!orderIds.length) {
      return { paymentByOrder, deliveryByOrder };
    }

    const [paymentRows, deliveryRows] = await Promise.all([
      this.payments
        .createQueryBuilder('p')
        .where('p.business_id = :businessId', { businessId })
        .andWhere('p.order_id IN (:...orderIds)', { orderIds })
        .getMany(),
      this.deliveries
        .createQueryBuilder('d')
        .where('d.business_id = :businessId', { businessId })
        .andWhere('d.order_id IN (:...orderIds)', { orderIds })
        .getMany(),
    ]);

    for (const p of paymentRows) paymentByOrder.set(p.orderId, p);
    for (const d of deliveryRows) deliveryByOrder.set(d.orderId, d);
    return { paymentByOrder, deliveryByOrder };
  }

  /**
   * Ops shortcut: verify the order's bank-transfer payment without using the payments list.
   * Prefer PATCH /payments/:id/verify after customer claim.
   */
  async markPaid(id: string, user: AuthUser) {
    const payment = await this.payments.findOne({
      where: { orderId: id, businessId: user.businessId },
    });
    if (!payment) {
      throw new NotFoundException(
        'No payment record for this order — create a new order with bank transfer flow',
      );
    }
    const verified = await this.paymentsService.verify(payment.id, user, 'Marked paid via order shortcut');
    return { id, status: 'paid' as const, payment: verified };
  }

  async cancel(id: string, user: AuthUser) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const itemRepo = manager.getRepository(OrderItem);
      const variantRepo = manager.getRepository(ProductVariant);
      const historyRepo = manager.getRepository(OrderStatusHistory);

      const order = await orderRepo.findOne(
        this.findOpts({
          where: { id, businessId: user.businessId },
        }),
      );
      if (!order) throw new NotFoundException('Order not found');
      if (!['pending', 'payment_review', 'paid'].includes(order.status)) {
        throw new BadRequestException(`Cannot cancel order in status ${order.status}`);
      }

      const from = order.status;
      const items = await itemRepo.find({ where: { orderId: order.id } });

      if (from === 'pending' || from === 'payment_review') {
        for (const item of items) {
          if (!item.variantId) continue;
          const variant = await variantRepo.findOne(
            this.findOpts({
              where: { id: item.variantId, businessId: user.businessId },
            }),
          );
          if (variant) {
            variant.stockReserved = Math.max(0, variant.stockReserved - item.quantity);
            await variantRepo.save(variant);
          }
        }
        await manager.getRepository(Payment).update(
          { orderId: order.id },
          { status: 'expired' },
        );
      }

      order.status = 'cancelled';
      order.reservedUntil = null;
      await orderRepo.save(order);

      await historyRepo.save(
        historyRepo.create({
          orderId: order.id,
          fromStatus: from,
          toStatus: 'cancelled',
          changedBy: user.sub,
          reason: 'Cancelled by user',
        }),
      );

      return { id: order.id, status: order.status };
    });
  }

  /** Expire pending holds past reservedUntil — release reserved stock */
  async expireStaleHolds() {
    const now = new Date();
    const stale = await this.orders
      .createQueryBuilder('o')
      .where('o.status = :status', { status: 'pending' })
      .andWhere('o.reserved_until IS NOT NULL')
      .andWhere('o.reserved_until < :now', { now })
      .getMany();

    let expired = 0;
    const expiredIds: string[] = [];
    for (const order of stale) {
      await this.dataSource.transaction(async (manager) => {
        const orderRepo = manager.getRepository(Order);
        const itemRepo = manager.getRepository(OrderItem);
        const variantRepo = manager.getRepository(ProductVariant);
        const historyRepo = manager.getRepository(OrderStatusHistory);

        const locked = await orderRepo.findOne(
          this.findOpts({
            where: { id: order.id, status: 'pending' as const },
          }),
        );
        if (!locked) return;

        const items = await itemRepo.find({ where: { orderId: locked.id } });
        for (const item of items) {
          if (!item.variantId) continue;
          const variant = await variantRepo.findOne(
            this.findOpts({
              where: { id: item.variantId },
            }),
          );
          if (variant) {
            variant.stockReserved = Math.max(0, variant.stockReserved - item.quantity);
            await variantRepo.save(variant);
          }
        }

        locked.status = 'expired';
        locked.reservedUntil = null;
        await orderRepo.save(locked);
        await historyRepo.save(
          historyRepo.create({
            orderId: locked.id,
            fromStatus: 'pending',
            toStatus: 'expired',
            changedBy: null,
            reason: 'Payment window expired · stock released if reserved',
          }),
        );
        expired += 1;
        expiredIds.push(locked.id);
      });
    }
    if (expiredIds.length) {
      await this.paymentsService.markExpiredForOrders(expiredIds);
    }
    return { expired };
  }

  private toListItem(o: Order, payment?: Payment, delivery?: Delivery) {
    return {
      id: o.id,
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      deliveryAddress: o.deliveryAddress,
      subtotalCents: o.subtotalCents,
      taxCents: o.taxCents,
      shippingFeeCents: o.shippingFeeCents,
      totalCents: o.totalCents,
      reservedUntil: o.reservedUntil?.toISOString() ?? null,
      createdAt: o.createdAt,
      items: o.items?.map((it) => ({
        id: it.id,
        variantId: it.variantId,
        description: it.description,
        quantity: it.quantity,
        unitPriceCents: it.unitPriceCents,
        taxExempt: it.taxExempt,
      })),
      payment: payment
        ? {
            id: payment.id,
            method: payment.method,
            status: payment.status,
            reference: payment.reference,
            paymentToken: payment.paymentToken,
            paymentUrl: this.paymentsService.paymentUrl(payment.paymentToken),
            amountCents: payment.amountCents,
            claimedAt: payment.claimedAt?.toISOString() ?? null,
            hasProof: Boolean(payment.proofPath),
          }
        : null,
      delivery: delivery
        ? {
            id: delivery.id,
            status: delivery.status,
            fulfillmentMode: delivery.fulfillmentMode,
            provider: delivery.provider,
            trackingToken: delivery.trackingToken,
            trackingPath: `/track/${delivery.trackingToken}`,
            externalTrackingUrl: delivery.externalTrackingUrl,
          }
        : null,
    };
  }
}

