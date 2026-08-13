import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTimeType } from '../column-types';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'whatsapp_number', type: 'text', nullable: true })
  whatsappNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({
    name: 'subscription_tier',
    type: 'text',
    default: 'starter',
  })
  subscriptionTier!: 'starter' | 'growth' | 'scale';

  @Column({ name: 'tax_enabled', type: 'boolean', default: true })
  taxEnabled!: boolean;

  @Column({
    name: 'tax_rate_percent',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 7.5,
  })
  taxRatePercent!: number;

  @Column({ name: 'tax_label', type: 'text', default: 'VAT' })
  taxLabel!: string;

  @Column({ name: 'default_shipping_fee_cents', type: 'int', default: 250000 })
  defaultShippingFeeCents!: number;

  @Column({ name: 'bank_name', type: 'text', nullable: true })
  bankName!: string | null;

  @Column({ name: 'bank_account_name', type: 'text', nullable: true })
  bankAccountName!: string | null;

  @Column({ name: 'bank_account_number', type: 'text', nullable: true })
  bankAccountNumber!: string | null;

  @Column({ name: 'brand_color', type: 'text', default: '#4f6bed' })
  brandColor!: string;

  /**
   * ISO 4217 currency for this business (global product — not NGN-locked).
   * Amounts stored as integer minor units (e.g. cents/kobo).
   */
  @Column({ type: 'text', default: 'NGN' })
  currency!: string;

  /**
   * Default payment method id. Pluggable stack — bank_transfer now;
   * stripe / paystack later via PaymentProvider registry.
   */
  @Column({ name: 'default_payment_method', type: 'text', default: 'bank_transfer' })
  defaultPaymentMethod!: string;

  /** JSON array of enabled provider ids, e.g. ["bank_transfer","stripe"] */
  @Column({
    name: 'enabled_payment_methods_json',
    type: 'text',
    default: '["bank_transfer"]',
  })
  enabledPaymentMethodsJson!: string;

  /** Public ShopFlow store slug — unique when set */
  @Column({ name: 'store_slug', type: 'text', nullable: true, unique: true })
  storeSlug!: string | null;

  /** When false, public /store/:slug returns 404 */
  @Column({ name: 'store_enabled', type: 'boolean', default: true })
  storeEnabled!: boolean;

  /** Platform status: active, suspended, or pending */
  @Column({ type: 'text', default: 'active' })
  status!: 'active' | 'suspended' | 'pending';

  /** Custom vanity domain (e.g. shop.lagosthreads.co) */
  @Column({ name: 'custom_domain', type: 'text', nullable: true, unique: true })
  customDomain!: string | null;

  @Column({ name: 'custom_domain_status', type: 'text', nullable: true })
  customDomainStatus!: 'pending' | 'verified' | 'failed' | null;

  /** Storage key for logo (R2/local) */
  @Column({ name: 'logo_key', type: 'text', nullable: true })
  logoKey!: string | null;

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;

  @OneToMany(() => User, (u) => u.business)
  users!: User[];

  @OneToMany(() => Product, (p) => p.business)
  products!: Product[];

  @OneToMany(() => Order, (o) => o.business)
  orders!: Order[];
}
