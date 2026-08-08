import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Delivery } from '../database/entities/delivery.entity';
import { DeliveryStatusEvent } from '../database/entities/delivery-status-event.entity';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Business } from '../database/entities/business.entity';

type PgRow = Record<string, unknown>;

/**
 * Public tracking — bypasses tenant RLS via SECURITY DEFINER functions on Postgres,
 * or direct repos on SQLite.
 *
 * Postgres `query()` returns snake_case column names; map them explicitly.
 */
@Injectable()
export class TrackingService {
  private readonly isPostgres: boolean;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(Delivery)
    private readonly deliveries: Repository<Delivery>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
  ) {
    const dbType = this.config.get<string>('DATABASE_TYPE', 'postgres');
    this.isPostgres = dbType !== 'sqlite' && dbType !== 'better-sqlite3';
  }

  async getByToken(token: string) {
    let delivery: {
      id: string;
      orderId: string;
      businessId: string;
      trackingToken: string;
      status: string;
      fulfillmentMode: string;
      provider: string | null;
      externalTrackingUrl: string | null;
      externalCourierName: string | null;
    } | null = null;
    let order: {
      customerName: string | null;
      deliveryAddress: string | null;
    } | null = null;
    let items: Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
    }> = [];
    let events: Array<{
      toStatus: string;
      note: string | null;
      createdAt: Date;
    }> = [];
    let business: {
      name: string;
      whatsappNumber: string | null;
      currency: string;
    } | null = null;

    if (this.isPostgres) {
      const rows = (await this.dataSource.query(
        `SELECT * FROM public.get_delivery_by_tracking_token($1)`,
        [token],
      )) as PgRow[];
      if (!rows?.length) {
        throw new NotFoundException('Tracking link not found');
      }
      delivery = this.mapDeliveryRow(rows[0]);

      const orderRows = (await this.dataSource.query(
        `SELECT * FROM public.get_order_public($1)`,
        [delivery.orderId],
      )) as PgRow[];
      if (orderRows?.[0]) {
        order = this.mapOrderRow(orderRows[0]);
      }

      const itemRows = (await this.dataSource.query(
        `SELECT * FROM public.get_order_items_public($1)`,
        [delivery.orderId],
      )) as PgRow[];
      items = (itemRows ?? []).map((r) => this.mapItemRow(r));

      const eventRows = (await this.dataSource.query(
        `SELECT * FROM public.get_delivery_events($1)`,
        [delivery.id],
      )) as PgRow[];
      events = (eventRows ?? []).map((r) => this.mapEventRow(r));

      const bizRows = (await this.dataSource.query(
        `SELECT * FROM public.get_business_public($1)`,
        [delivery.businessId],
      )) as PgRow[];
      if (bizRows?.[0]) {
        business = this.mapBusinessRow(bizRows[0]);
      }
    } else {
      const row = await this.deliveries.findOne({
        where: { trackingToken: token },
        relations: { order: true, events: true },
      });
      if (!row) {
        throw new NotFoundException('Tracking link not found');
      }
      delivery = {
        id: row.id,
        orderId: row.orderId,
        businessId: row.businessId,
        trackingToken: row.trackingToken,
        status: row.status,
        fulfillmentMode: row.fulfillmentMode,
        provider: row.provider,
        externalTrackingUrl: row.externalTrackingUrl,
        externalCourierName: row.externalCourierName,
      };
      order = row.order
        ? {
            customerName: row.order.customerName,
            deliveryAddress: row.order.deliveryAddress,
          }
        : null;
      events = (row.events ?? []).map((e) => ({
        toStatus: e.toStatus,
        note: e.note,
        createdAt: e.createdAt,
      }));
      if (order) {
        const itemEntities = await this.dataSource.getRepository(OrderItem).find({
          where: { orderId: delivery.orderId },
        });
        items = itemEntities.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        }));
      }
      const biz = await this.businesses.findOne({
        where: { id: delivery.businessId },
      });
      business = biz
        ? { name: biz.name, whatsappNumber: biz.whatsappNumber, currency: biz.currency }
        : null;
    }

    if (!delivery) {
      throw new NotFoundException('Tracking link not found');
    }

    const timeline = [...events]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((e) => ({
        label: this.statusLabel(e.toStatus),
        at: e.createdAt,
        note: e.note,
        done: true,
      }));

    // Pending next step if not terminal
    if (!['delivered', 'failed', 'cancelled'].includes(delivery.status)) {
      timeline.push({
        label: this.nextLabel(delivery.status),
        at: null as unknown as Date,
        note: null,
        done: false,
      });
    }

    return {
      token: delivery.trackingToken,
      status: delivery.status,
      fulfillmentMode: delivery.fulfillmentMode,
      provider: delivery.provider,
      externalTrackingUrl: delivery.externalTrackingUrl,
      externalCourierName: delivery.externalCourierName,
      businessName: business?.name ?? 'Shop',
      businessWhatsapp: business?.whatsappNumber ?? null,
      currency: business?.currency ?? 'NGN',
      orderId: delivery.orderId,
      customerName: order?.customerName ?? null,
      deliveryAddress: order?.deliveryAddress ?? null,
      items: items.map((i) => ({
        name: i.description,
        qty: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
      timeline,
      eta:
        delivery.status === 'delivered'
          ? 'Delivered'
          : delivery.status === 'out_for_delivery'
            ? 'Today'
            : 'Pending',
    };
  }

  private col(row: PgRow, camel: string, snake: string): unknown {
    if (row[camel] !== undefined && row[camel] !== null) return row[camel];
    return row[snake];
  }

  private mapDeliveryRow(row: PgRow) {
    return {
      id: String(this.col(row, 'id', 'id')),
      orderId: String(this.col(row, 'orderId', 'order_id')),
      businessId: String(this.col(row, 'businessId', 'business_id')),
      trackingToken: String(this.col(row, 'trackingToken', 'tracking_token')),
      status: String(this.col(row, 'status', 'status')),
      fulfillmentMode: String(
        this.col(row, 'fulfillmentMode', 'fulfillment_mode'),
      ),
      provider: (this.col(row, 'provider', 'provider') as string | null) ?? null,
      externalTrackingUrl:
        (this.col(
          row,
          'externalTrackingUrl',
          'external_tracking_url',
        ) as string | null) ?? null,
      externalCourierName:
        (this.col(
          row,
          'externalCourierName',
          'external_courier_name',
        ) as string | null) ?? null,
    };
  }

  private mapOrderRow(row: PgRow) {
    return {
      customerName:
        (this.col(row, 'customerName', 'customer_name') as string | null) ??
        null,
      deliveryAddress:
        (this.col(
          row,
          'deliveryAddress',
          'delivery_address',
        ) as string | null) ?? null,
    };
  }

  private mapItemRow(row: PgRow) {
    return {
      description: String(this.col(row, 'description', 'description') ?? ''),
      quantity: Number(this.col(row, 'quantity', 'quantity') ?? 0),
      unitPriceCents: Number(
        this.col(row, 'unitPriceCents', 'unit_price_cents') ?? 0,
      ),
    };
  }

  private mapEventRow(row: PgRow) {
    return {
      toStatus: String(this.col(row, 'toStatus', 'to_status') ?? ''),
      note: (this.col(row, 'note', 'note') as string | null) ?? null,
      createdAt: new Date(
        String(this.col(row, 'createdAt', 'created_at') ?? Date.now()),
      ),
    };
  }

  private mapBusinessRow(row: PgRow) {
    return {
      name: String(this.col(row, 'name', 'name') ?? 'Shop'),
      whatsappNumber:
        (this.col(
          row,
          'whatsappNumber',
          'whatsapp_number',
        ) as string | null) ?? null,
      currency: String(this.col(row, 'currency', 'currency') ?? 'NGN'),
    };
  }

  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      awaiting_pickup: 'Packed & awaiting pickup',
      picked_up: 'Picked up by courier',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
      failed: 'Delivery failed',
      cancelled: 'Cancelled',
    };
    return map[status] ?? status;
  }

  private nextLabel(status: string): string {
    const map: Record<string, string> = {
      awaiting_pickup: 'Pickup',
      picked_up: 'Out for delivery',
      out_for_delivery: 'Delivered',
    };
    return map[status] ?? 'Next update';
  }
}
