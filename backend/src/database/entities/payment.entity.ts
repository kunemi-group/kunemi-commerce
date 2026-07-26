import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { dateTimeType } from '../column-types';
import { Business } from './business.entity';
import { Order } from './order.entity';
import { User } from './user.entity';

/** Default path is bank transfer; card gateway can be added later. */
export type PaymentMethod = 'bank_transfer' | 'card';

export type PaymentStatus =
  | 'awaiting_transfer'
  | 'claimed'
  | 'verified'
  | 'rejected'
  | 'expired';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'text', default: 'bank_transfer' })
  method!: PaymentMethod;

  @Column({ type: 'text', default: 'awaiting_transfer' })
  status!: PaymentStatus;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents!: number;

  /** Customer should put this in bank transfer narration/reference */
  @Column({ type: 'text' })
  reference!: string;

  /** Public token for /api/pay/:token (customer-facing) */
  @Column({ name: 'payment_token', type: 'text', unique: true })
  paymentToken!: string;

  @Column({ name: 'claimed_at', type: dateTimeType(), nullable: true })
  claimedAt!: Date | null;

  @Column({ name: 'customer_note', type: 'text', nullable: true })
  customerNote!: string | null;

  /** Relative path under uploads/, or null if no evidence */
  @Column({ name: 'proof_path', type: 'text', nullable: true })
  proofPath!: string | null;

  @Column({ name: 'proof_filename', type: 'text', nullable: true })
  proofFilename!: string | null;

  @Column({ name: 'proof_mime_type', type: 'text', nullable: true })
  proofMimeType!: string | null;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedByUser!: User | null;

  @Column({ name: 'verified_at', type: dateTimeType(), nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: dateTimeType() })
  updatedAt!: Date;
}
