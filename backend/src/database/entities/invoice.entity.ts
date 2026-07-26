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
import { User } from './user.entity';
import { InvoiceItem } from './invoice-item.entity';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'void';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'agent_id', type: 'uuid', nullable: true })
  agentId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'agent_id' })
  agent!: User | null;

  @Column({ name: 'reference', type: 'text' })
  reference!: string;

  @Column({ name: 'customer_name', type: 'text' })
  customerName!: string;

  @Column({ name: 'customer_phone', type: 'text', nullable: true })
  customerPhone!: string | null;

  @Column({ name: 'customer_email', type: 'text', nullable: true })
  customerEmail!: string | null;

  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress!: string | null;

  @Column({ type: 'text', default: 'draft' })
  status!: InvoiceStatus;

  @Column({ name: 'due_at', type: dateTimeType(), nullable: true })
  dueAt!: Date | null;

  @Column({ type: 'text', default: 'whatsapp' })
  channel!: string;

  @Column({ name: 'payment_methods', type: 'text', default: '["transfer"]' })
  paymentMethodsJson!: string;

  @Column({ name: 'shipping_fee_cents', type: 'int', default: 0 })
  shippingFeeCents!: number;

  @Column({ name: 'tax_cents', type: 'int', default: 0 })
  taxCents!: number;

  @Column({ name: 'subtotal_cents', type: 'int', default: 0 })
  subtotalCents!: number;

  @Column({ name: 'total_cents', type: 'int', default: 0 })
  totalCents!: number;

  @Column({ name: 'amount_paid_cents', type: 'int', default: 0 })
  amountPaidCents!: number;

  @Column({ name: 'quotation_id', type: 'uuid', nullable: true })
  quotationId!: string | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => InvoiceItem, (i) => i.invoice, { cascade: true })
  items!: InvoiceItem[];

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: dateTimeType() })
  updatedAt!: Date;
}
