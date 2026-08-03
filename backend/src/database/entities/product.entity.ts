import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTimeType } from '../column-types';
import { Business } from './business.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => Business, (b) => b.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Storage key (R2 or local) for primary product image */
  @Column({ name: 'image_key', type: 'text', nullable: true })
  imageKey!: string | null;

  /** JSON string array of storage keys for gallery */
  @Column({ name: 'gallery_keys_json', type: 'text', nullable: true })
  galleryKeysJson!: string | null;

  /** When true, product appears on ShopFlow storefront for this business */
  @Column({ name: 'published_to_store', type: 'boolean', default: true })
  publishedToStore!: boolean;

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;

  @OneToMany(() => ProductVariant, (v) => v.product)
  variants!: ProductVariant[];
}
