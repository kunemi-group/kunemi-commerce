import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Quotation } from './quotation.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('quotation_items')
export class QuotationItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'quotation_id', type: 'uuid' })
  quotationId!: string;

  @ManyToOne(() => Quotation, (q) => q.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quotation_id' })
  quotation!: Quotation;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId!: string | null;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant!: ProductVariant | null;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'unit_price_cents', type: 'int' })
  unitPriceCents!: number;

  @Column({ name: 'tax_exempt', type: 'boolean', default: false })
  taxExempt!: boolean;
}
