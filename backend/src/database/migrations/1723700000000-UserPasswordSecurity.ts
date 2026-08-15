import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Invite force-change + forgot-password OTP fields on users.
 */
export class UserPasswordSecurity1723700000000 implements MigrationInterface {
  name = 'UserPasswordSecurity1723700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_reset_otp text NULL
    `);
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_reset_expires_at timestamptz NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS password_reset_expires_at
    `);
    await queryRunner.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS password_reset_otp
    `);
    await queryRunner.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS must_change_password
    `);
  }
}
