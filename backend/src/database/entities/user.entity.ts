import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { dateTimeType } from '../column-types';
import { Business } from './business.entity';

/** Staff use Workspace; buyers use ShopFlow only (no businessId). */
export type UserRole = 'owner' | 'manager' | 'sales' | 'ops' | 'buyer';

@Entity('users')
@Unique(['businessId', 'email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Null for ShopFlow buyers; required for Workspace staff */
  @Column({ name: 'business_id', type: 'uuid', nullable: true })
  businessId!: string | null;

  @ManyToOne(() => Business, (b) => b.users, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'business_id' })
  business!: Business | null;

  /** Globally unique for login (staff + buyers share one identity plane) */
  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'text' })
  fullName!: string;

  @Column({ type: 'text' })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;
}
