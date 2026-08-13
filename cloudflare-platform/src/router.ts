import type { Env } from './types';
import { TenantResolver } from './tenant-resolver';
import { handleAdminRequest } from './admin-api';
import { proxyRequest } from './proxy';

export async function routeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const resolver = new TenantResolver(env);

  // 1. Admin API Route
  if (url.pathname.startsWith('/api/admin/tenants')) {
    return handleAdminRequest(request, url, env, resolver);
  }

  // 2. Resolve Tenant from Hostname, Subdomain, or Header
  const tenant = await resolver.resolve(request, url);

  // 3. API Route Handling -> Forward to NestJS Backend API
  if (url.pathname.startsWith('/api/')) {
    return proxyRequest(request, env.BACKEND_API_URL, tenant, env);
  }

  // 4. Workspace Staff Dashboard Route (app.kunemi.com / workspace.kunemi.com)
  const isWorkspaceHostname =
    url.hostname.startsWith('app.') ||
    url.hostname.startsWith('workspace.') ||
    url.hostname === 'localhost' && url.port === '3000';

  if (isWorkspaceHostname && !tenant) {
    return proxyRequest(request, env.WORKSPACE_UI_URL, tenant, env);
  }

  // 5. Buyer Storefront Route (ShopFlow) -> Forward to ShopFlow UI with tenant context
  return proxyRequest(request, env.SHOPFLOW_UI_URL, tenant, env);
}
