import type { Env, TenantRecord } from './types';
import { TenantResolver } from './tenant-resolver';

export async function handleAdminRequest(
  request: Request,
  url: URL,
  env: Env,
  resolver: TenantResolver,
): Promise<Response> {
  // Simple bearer token / API key authentication check
  const authHeader = request.headers.get('Authorization') || '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();

  const expectedKey = env.ADMIN_API_KEY || env.PLATFORM_SECRET;
  if (!apiKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pathname = url.pathname;

  // POST /api/admin/tenants — Register / update tenant domain mapping
  if (request.method === 'POST' && pathname === '/api/admin/tenants') {
    try {
      const body = (await request.json()) as Partial<TenantRecord>;

      if (!body.tenantId || !body.slug) {
        return new Response(
          JSON.stringify({ error: 'tenantId and slug are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const now = new Date().toISOString();
      const record: TenantRecord = {
        tenantId: body.tenantId,
        slug: body.slug.toLowerCase().trim(),
        name: body.name || body.slug,
        customDomain: body.customDomain ? body.customDomain.toLowerCase().trim() : null,
        status: body.status || 'active',
        createdAt: body.createdAt || now,
        updatedAt: now,
      };

      await resolver.saveTenantMapping(record);

      return new Response(JSON.stringify({ success: true, tenant: record }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid JSON';
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/admin/tenants/:identifier — Get tenant mapping by tenantId or slug
  if (request.method === 'GET' && pathname.startsWith('/api/admin/tenants/')) {
    const identifier = pathname.replace('/api/admin/tenants/', '').trim();
    const tenant = await resolver.getByTenantId(identifier);

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant mapping not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ tenant }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // DELETE /api/admin/tenants/:tenantId — Delete tenant domain mapping
  if (request.method === 'DELETE' && pathname.startsWith('/api/admin/tenants/')) {
    const tenantId = pathname.replace('/api/admin/tenants/', '').trim();
    const existing = await resolver.getByTenantId(tenantId);

    if (existing) {
      await resolver.removeTenantMapping(
        existing.tenantId,
        existing.slug,
        existing.customDomain || undefined,
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
  });
}
