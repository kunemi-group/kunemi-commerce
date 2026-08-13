/**
 * Provision Tenant KV CLI Script
 * 
 * Usage:
 *   npx tsx scripts/provision-tenant-kv.ts --tenant-id bus_123 --slug lagosthreads --name "Lagos Threads" --domain shop.lagosthreads.co
 */

import parseArgs from 'minimist';

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    string: ['tenant-id', 'slug', 'name', 'domain', 'admin-url', 'admin-key'],
    alias: {
      t: 'tenant-id',
      s: 'slug',
      n: 'name',
      d: 'domain',
      u: 'admin-url',
      k: 'admin-key',
    },
  });

  const tenantId = args['tenant-id'];
  const slug = args['slug'];
  const name = args['name'] || slug;
  const customDomain = args['domain'] || null;

  const adminUrl = args['admin-url'] || process.env.CLOUDFLARE_EDGE_ADMIN_URL || 'http://localhost:8787/api/admin/tenants';
  const adminKey = args['admin-key'] || process.env.CLOUDFLARE_EDGE_ADMIN_KEY || process.env.PLATFORM_SECRET;

  if (!tenantId || !slug) {
    console.error('Error: --tenant-id and --slug are required');
    console.log('Usage: npx tsx scripts/provision-tenant-kv.ts --tenant-id <id> --slug <slug> [--domain <customdomain>]');
    process.exit(1);
  }

  if (!adminKey) {
    console.error('Error: provide --admin-key or set CLOUDFLARE_EDGE_ADMIN_KEY/PLATFORM_SECRET');
    process.exit(1);
  }

  console.log(`Provisioning Tenant [${tenantId}] (${slug}) at ${adminUrl}...`);

  try {
    const response = await fetch(adminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify({
        tenantId,
        slug,
        name,
        customDomain,
        status: 'active',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Provisioning Failed (${response.status}): ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('Successfully provisioned tenant mapping:');
    console.dir(data, { depth: null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Connection Error: ${msg}`);
    process.exit(1);
  }
}

main();
