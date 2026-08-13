import { MigrationInterface, QueryRunner } from 'typeorm';

const directTables = [
  'businesses',
  'users',
  'products',
  'product_variants',
  'orders',
  'deliveries',
  'payments',
  'quotations',
  'invoices',
  'chat_threads',
];

const childTables = [
  'order_items',
  'order_status_history',
  'delivery_status_events',
  'quotation_items',
  'invoice_items',
  'chat_messages',
];

const tenantExpression = (businessColumn: string) =>
  `(current_setting('app.is_platform_admin', true) = 'true' OR current_setting('app.is_public', true) = 'true' OR ${businessColumn}::text = current_setting('app.current_business_id', true))`;

async function applyRls(queryRunner: QueryRunner) {
  for (const table of [...directTables, ...childTables]) {
    await queryRunner.query(`ALTER TABLE IF EXISTS ${table} ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE IF EXISTS ${table} FORCE ROW LEVEL SECURITY`);
  }

  for (const table of directTables) {
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_${table} ON ${table}`);
    const column = table === 'businesses' ? 'id' : 'business_id';
    await queryRunner.query(`
      CREATE POLICY tenant_${table} ON ${table}
      USING (${tenantExpression(column)})
      WITH CHECK (${tenantExpression(column)})
    `);
  }

  const parentPolicies: Array<[string, string, string]> = [
    ['order_items', 'orders', 'order_id'],
    ['order_status_history', 'orders', 'order_id'],
    ['delivery_status_events', 'deliveries', 'delivery_id'],
    ['quotation_items', 'quotations', 'quotation_id'],
    ['invoice_items', 'invoices', 'invoice_id'],
  ];
  for (const [table, parent, foreignKey] of parentPolicies) {
    const alias = parent[0];
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_${table} ON ${table}`);
    await queryRunner.query(`
      CREATE POLICY tenant_${table} ON ${table}
      USING (
        current_setting('app.is_platform_admin', true) = 'true'
        OR current_setting('app.is_public', true) = 'true'
        OR EXISTS (
          SELECT 1 FROM ${parent} ${alias}
          WHERE ${alias}.id = ${table}.${foreignKey}
          AND ${alias}.business_id::text = current_setting('app.current_business_id', true)
        )
      )
      WITH CHECK (
        current_setting('app.is_platform_admin', true) = 'true'
        OR current_setting('app.is_public', true) = 'true'
        OR EXISTS (
          SELECT 1 FROM ${parent} ${alias}
          WHERE ${alias}.id = ${table}.${foreignKey}
          AND ${alias}.business_id::text = current_setting('app.current_business_id', true)
        )
      )
    `);
  }

  await queryRunner.query(`DROP POLICY IF EXISTS tenant_chat_messages ON chat_messages`);
  await queryRunner.query(`
    CREATE POLICY tenant_chat_messages ON chat_messages
    USING (
      current_setting('app.is_platform_admin', true) = 'true'
      OR current_setting('app.is_public', true) = 'true'
      OR EXISTS (
        SELECT 1 FROM chat_threads t
        WHERE t.id = chat_messages.thread_id
        AND (
          t.business_id::text = current_setting('app.current_business_id', true)
          OR t.buyer_user_id::text = current_setting('app.current_user_id', true)
        )
      )
    )
    WITH CHECK (
      current_setting('app.is_platform_admin', true) = 'true'
      OR current_setting('app.is_public', true) = 'true'
      OR EXISTS (
        SELECT 1 FROM chat_threads t
        WHERE t.id = chat_messages.thread_id
        AND (
          t.business_id::text = current_setting('app.current_business_id', true)
          OR t.buyer_user_id::text = current_setting('app.current_user_id', true)
        )
      )
    )
  `);

  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION public.get_delivery_by_tracking_token(p_token text)
    RETURNS SETOF deliveries LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
      SELECT * FROM deliveries WHERE tracking_token = p_token LIMIT 1;
    $$;
  `);
  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION public.get_delivery_events(p_delivery_id uuid)
    RETURNS SETOF delivery_status_events LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
      SELECT * FROM delivery_status_events WHERE delivery_id = p_delivery_id ORDER BY created_at ASC;
    $$;
  `);
  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION public.get_order_public(p_order_id uuid)
    RETURNS SETOF orders LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
      SELECT * FROM orders WHERE id = p_order_id LIMIT 1;
    $$;
  `);
  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION public.get_order_items_public(p_order_id uuid)
    RETURNS SETOF order_items LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
      SELECT * FROM order_items WHERE order_id = p_order_id;
    $$;
  `);
  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION public.get_business_public(p_id uuid)
    RETURNS SETOF businesses LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
      SELECT * FROM businesses WHERE id = p_id LIMIT 1;
    $$;
  `);

  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION public.get_payment_by_token(p_token text)
    RETURNS SETOF payments LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
      SELECT * FROM payments WHERE payment_token = p_token LIMIT 1;
    $$;
  `);

  const runtimeUser = process.env.DATABASE_USER ?? '';
  if (runtimeUser && /^[A-Za-z_][A-Za-z0-9_$]*$/.test(runtimeUser)) {
    const quoted = `"${runtimeUser.replace(/"/g, '""')}"`;
    await queryRunner.query(`GRANT USAGE ON SCHEMA public TO ${quoted}`);
    await queryRunner.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${quoted}`);
    await queryRunner.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${quoted}`);
    for (const signature of [
      'get_delivery_by_tracking_token(text)',
      'get_delivery_events(uuid)',
      'get_order_public(uuid)',
      'get_order_items_public(uuid)',
      'get_business_public(uuid)',
      'get_payment_by_token(text)',
    ]) {
      await queryRunner.query(`REVOKE ALL ON FUNCTION public.${signature} FROM PUBLIC`);
      await queryRunner.query(`GRANT EXECUTE ON FUNCTION public.${signature} TO ${quoted}`);
    }
  }
}

export class BaselineSchemaAndRls1710000000000 implements MigrationInterface {
  name = 'BaselineSchemaAndRls1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type === 'postgres') {
      const builder = (queryRunner.connection.driver as unknown as {
        createSchemaBuilder: () => { log: () => Promise<{ upQueries: Array<{ query: string; parameters?: unknown[] }> }> };
      }).createSchemaBuilder();
      const schema = await builder.log();
      for (const query of schema.upQueries) {
        await queryRunner.query(query.query, query.parameters);
      }
      await applyRls(queryRunner);
    } else {
      await queryRunner.connection.driver.createSchemaBuilder().build();
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type === 'postgres') {
      for (const table of [...directTables, ...childTables].reverse()) {
        await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      }
      for (const fn of [
        'get_delivery_by_tracking_token(text)',
        'get_delivery_events(uuid)',
        'get_order_public(uuid)',
        'get_order_items_public(uuid)',
        'get_business_public(uuid)',
        'get_payment_by_token(text)',
      ]) {
        await queryRunner.query(`DROP FUNCTION IF EXISTS public.${fn}`);
      }
    } else {
      for (const table of [...directTables, ...childTables].reverse()) {
        await queryRunner.dropTable(table, true, true, true);
      }
    }
  }
}
