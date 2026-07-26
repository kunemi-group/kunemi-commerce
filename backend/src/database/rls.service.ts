import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

/**
 * Enables Postgres RLS policies after TypeORM synchronize.
 * Tenant isolation uses GUC app.current_business_id set per request.
 */
@Injectable()
export class RlsService implements OnModuleInit {
  private readonly logger = new Logger(RlsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const dbType = this.config.get<string>('DATABASE_TYPE', 'postgres');
    if (dbType === 'sqlite' || dbType === 'better-sqlite3') {
      this.logger.log('RLS skipped (SQLite)');
      return;
    }
    if (!this.dataSource.isInitialized) return;

    try {
      await this.applyPolicies();
      this.logger.log('Postgres RLS policies applied');
    } catch (err) {
      this.logger.warn(`RLS setup warning: ${(err as Error).message}`);
    }
  }

  private async applyPolicies() {
    // Tables with direct business_id
    const directTables = [
      'businesses',
      'users',
      'products',
      'product_variants',
      'orders',
      'deliveries',
      'payments',
    ];

    // ENABLE only (not FORCE) so the table owner (app role) can seed/migrate.
    // Interceptor still sets app.current_business_id for defense-in-depth when using a non-owner role.
    for (const table of directTables) {
      await this.dataSource.query(
        `ALTER TABLE IF EXISTS ${table} ENABLE ROW LEVEL SECURITY`,
      );
    }

    for (const table of [
      'order_items',
      'order_status_history',
      'delivery_status_events',
    ]) {
      await this.dataSource.query(
        `ALTER TABLE IF EXISTS ${table} ENABLE ROW LEVEL SECURITY`,
      );
    }

    // Drop + recreate policies (idempotent for dev)
    const drop = async (name: string, table: string) => {
      await this.dataSource.query(
        `DROP POLICY IF EXISTS ${name} ON ${table}`,
      );
    };

    await drop('tenant_businesses', 'businesses');
    await this.dataSource.query(`
      CREATE POLICY tenant_businesses ON businesses
        USING (id::text = current_setting('app.current_business_id', true))
        WITH CHECK (id::text = current_setting('app.current_business_id', true))
    `);

    const directBiz = [
      'users',
      'products',
      'product_variants',
      'orders',
      'deliveries',
      'payments',
    ];
    for (const table of directBiz) {
      const policy = `tenant_${table}`;
      await drop(policy, table);
      await this.dataSource.query(`
        CREATE POLICY ${policy} ON ${table}
          USING (business_id::text = current_setting('app.current_business_id', true))
          WITH CHECK (business_id::text = current_setting('app.current_business_id', true))
      `);
    }

    // Public pay page: read payment + order + business by token without tenant GUC
    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION public.get_payment_by_token(p_token text)
      RETURNS SETOF payments
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT * FROM payments WHERE payment_token = p_token LIMIT 1;
      $$;
    `);

    await drop('tenant_order_items', 'order_items');
    await this.dataSource.query(`
      CREATE POLICY tenant_order_items ON order_items
        USING (
          EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
              AND o.business_id::text = current_setting('app.current_business_id', true)
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
              AND o.business_id::text = current_setting('app.current_business_id', true)
          )
        )
    `);

    await drop('tenant_order_status_history', 'order_status_history');
    await this.dataSource.query(`
      CREATE POLICY tenant_order_status_history ON order_status_history
        USING (
          EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_status_history.order_id
              AND o.business_id::text = current_setting('app.current_business_id', true)
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_status_history.order_id
              AND o.business_id::text = current_setting('app.current_business_id', true)
          )
        )
    `);

    await drop('tenant_delivery_status_events', 'delivery_status_events');
    await this.dataSource.query(`
      CREATE POLICY tenant_delivery_status_events ON delivery_status_events
        USING (
          EXISTS (
            SELECT 1 FROM deliveries d
            WHERE d.id = delivery_status_events.delivery_id
              AND d.business_id::text = current_setting('app.current_business_id', true)
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM deliveries d
            WHERE d.id = delivery_status_events.delivery_id
              AND d.business_id::text = current_setting('app.current_business_id', true)
          )
        )
    `);

    // Public tracking needs to read deliveries without tenant GUC.
    // Policy: allow SELECT when no tenant is set (empty) for tracking_token lookups only
    // is unsafe alone. Instead tracking service uses a privileged query path.
    // Grant bypass for tracking via SECURITY DEFINER function.
    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION public.get_delivery_by_tracking_token(p_token text)
      RETURNS SETOF deliveries
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT * FROM deliveries WHERE tracking_token = p_token LIMIT 1;
      $$;
    `);

    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION public.get_delivery_events(p_delivery_id uuid)
      RETURNS SETOF delivery_status_events
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT * FROM delivery_status_events
        WHERE delivery_id = p_delivery_id
        ORDER BY created_at ASC;
      $$;
    `);

    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION public.get_order_public(p_order_id uuid)
      RETURNS SETOF orders
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT * FROM orders WHERE id = p_order_id LIMIT 1;
      $$;
    `);

    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION public.get_order_items_public(p_order_id uuid)
      RETURNS SETOF order_items
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT * FROM order_items WHERE order_id = p_order_id;
      $$;
    `);

    await this.dataSource.query(`
      CREATE OR REPLACE FUNCTION public.get_business_public(p_id uuid)
      RETURNS SETOF businesses
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT * FROM businesses WHERE id = p_id LIMIT 1;
      $$;
    `);
  }
}
