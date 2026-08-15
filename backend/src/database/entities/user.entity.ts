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

/**
 * Product roles:
 * - Workspace: 'owner' | 'team' (requires businessId)
 * - Buyer / ShopFlow: 'user' (no businessId)
 * - Platform: 'admin' | 'super_admin' (no businessId)
 */
export type UserRole = 'owner' | 'team' | 'user' | 'admin' | 'super_admin';

@Entity('users')
@Unique(['businessId', 'email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Null for end users; required for Workspace staff */
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

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'email_verification_otp', type: 'text', nullable: true })
  emailVerificationOtp!: string | null;

  @Column({
    name: 'email_verification_expires_at',
    type: dateTimeType(),
    nullable: true,
  })
  emailVerificationExpiresAt!: Date | null;

  @Column({ name: 'refresh_token_hash', type: 'text', nullable: true })
  refreshTokenHash!: string | null;

  @Column({
    name: 'refresh_token_expires_at',
    type: dateTimeType(),
    nullable: true,
  })
  refreshTokenExpiresAt!: Date | null;

  /**
   * True after team invite (temp password) until the user sets their own password.
   * Blocks normal Workspace use until changed.
   */
  @Column({ name: 'must_change_password', type: 'boolean', default: false })
  mustChangePassword!: boolean;

  @Column({ name: 'password_reset_otp', type: 'text', nullable: true })
  passwordResetOtp!: string | null;

  @Column({
    name: 'password_reset_expires_at',
    type: dateTimeType(),
    nullable: true,
  })
  passwordResetExpiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: dateTimeType() })
  createdAt!: Date;
}
