import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { dateTimeType } from '../column-types';
import { Business } from './business.entity';
import { Order } from './order.entity';
import { DeliveryStatusEvent } from './delivery-status-event.entity';

export type FulfillmentMode = 'manual' | 'api_integrated';
export type DeliveryStatus =
  | 'awaiting_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'fulfillment_mode', type: 'text' })
  fulfillmentMode!: FulfillmentMode;

  @Column({ type: 'text', nullable: true })
  provider!: string | null;

  @Column({ name: 'provider_reference', type: 'text', nullable: true })
  providerReference!: string | null;

  @Column({ name: 'external_tracking_url', type: 'text', nullable: true })
  externalTrackingUrl!: string | null;

  @Column({ name: 'external_courier_name', type: 'text', nullable: true })
  externalCourierName!: string | null;

  @Column({ name: 'tracking_token', type: 'text', unique: true })
  trackingToken!: string;

  @Column({ type: 'text', default: 'awaiting_pickup' })
  status!: DeliveryStatus;

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: dateTimeType() })
  updatedAt!: Date;

  @OneToMany(() => DeliveryStatusEvent, (e) => e.delivery, { cascade: true })
  events!: DeliveryStatusEvent[];
}
