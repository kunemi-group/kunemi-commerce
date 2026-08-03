import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTimeType } from '../column-types';
import { ChatThread } from './chat-thread.entity';
import { User } from './user.entity';

export type ChatSenderSide = 'buyer' | 'staff';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'thread_id', type: 'uuid' })
  threadId!: string;

  @ManyToOne(() => ChatThread, (t) => t.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread!: ChatThread;

  @Column({ name: 'sender_user_id', type: 'uuid' })
  senderUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_user_id' })
  sender!: User;

  /** buyer = ShopFlow user; staff = Workspace team member */
  @Column({ name: 'sender_side', type: 'text' })
  senderSide!: ChatSenderSide;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'media_key', type: 'text', nullable: true })
  mediaKey!: string | null;

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;
}
