import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Product roles: Owner | Team only.
 * Maps legacy manager / sales / ops → team.
 */
export class WorkspaceOwnerTeamRoles1723710000000 implements MigrationInterface {
  name = 'WorkspaceOwnerTeamRoles1723710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Normalize legacy staff seats to Team
    await queryRunner.query(`
      UPDATE users
      SET role = 'team'
      WHERE role IN ('manager', 'sales', 'ops', 'agent')
    `);

    // Optional check constraint for known roles (Postgres)
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
    `);
    await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('owner', 'team', 'user', 'admin', 'super_admin'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
    `);
    // Best-effort reverse: Team → sales (previous storage code)
    await queryRunner.query(`
      UPDATE users
      SET role = 'sales'
      WHERE role = 'team'
    `);
  }
}
