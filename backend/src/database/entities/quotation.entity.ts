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
import { QuotationItem } from './quotation-item.entity';

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'expired'
  | 'converted';

@Entity('quotations')
export class Quotation {
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

  /** Human-readable ref e.g. QT-A1B2C3 */
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
  status!: QuotationStatus;

  @Column({ name: 'valid_until', type: dateTimeType(), nullable: true })
  validUntil!: Date | null;

  @Column({ type: 'text', default: 'whatsapp' })
  channel!: string;

  /** JSON array: "transfer" | "card" */
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

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'converted_invoice_id', type: 'uuid', nullable: true })
  convertedInvoiceId!: string | null;

  @OneToMany(() => QuotationItem, (i) => i.quotation, { cascade: true })
  items!: QuotationItem[];

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: dateTimeType() })
  updatedAt!: Date;
}
