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
import { ChatMessage } from './chat-message.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';

@Entity('chat_threads')
export class ChatThread {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ name: 'buyer_user_id', type: 'uuid' })
  buyerUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_user_id' })
  buyer!: User;

  /** Optional product context (from ShopFlow product page) */
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product!: Product | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId!: string | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order!: Order | null;

  @Column({ name: 'subject', type: 'text', nullable: true })
  subject!: string | null;

  @Column({ name: 'last_message_at', type: dateTimeType(), nullable: true })
  lastMessageAt!: Date | null;

  @Column({ name: 'last_message_preview', type: 'text', nullable: true })
  lastMessagePreview!: string | null;

  @Column({ name: 'buyer_unread_count', type: 'int', default: 0 })
  buyerUnreadCount!: number;

  @Column({ name: 'staff_unread_count', type: 'int', default: 0 })
  staffUnreadCount!: number;

  @OneToMany(() => ChatMessage, (m) => m.thread)
  messages!: ChatMessage[];

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: dateTimeType() })
  updatedAt!: Date;
}
