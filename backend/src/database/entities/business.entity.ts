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

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;

  @OneToMany(() => User, (u) => u.business)
  users!: User[];

  @OneToMany(() => Product, (p) => p.business)
  products!: Product[];

  @OneToMany(() => Order, (o) => o.business)
  orders!: Order[];
}
