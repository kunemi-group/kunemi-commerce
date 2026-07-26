import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId!: string;

  @ManyToOne(() => Invoice, (inv) => inv.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

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
