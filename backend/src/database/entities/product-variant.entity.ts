import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTimeType } from '../column-types';
import { Business } from './business.entity';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ type: 'text', nullable: true })
  sku!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  attributes!: Record<string, string> | null;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents!: number;

  @Column({ name: 'stock_on_hand', type: 'int', default: 0 })
  stockOnHand!: number;

  @Column({ name: 'stock_reserved', type: 'int', default: 0 })
  stockReserved!: number;

  @Column({ name: 'low_stock_threshold', type: 'int', default: 5 })
  lowStockThreshold!: number;

  @Column({ name: 'tax_exempt', type: 'boolean', default: false })
  taxExempt!: boolean;

  /** Optional variant-level image (falls back to product image) */
  @Column({ name: 'image_key', type: 'text', nullable: true })
  imageKey!: string | null;

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;
}
