import type { Env, TenantRecord } from './types';

export async function proxyRequest(
  request: Request,
  targetBaseUrl: string,
  tenant: TenantRecord | null,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname + url.search, targetBaseUrl);

  const headers = new Headers(request.headers);

  // Ingest security secret signature
  if (env.PLATFORM_SECRET) {
    headers.set('X-Platform-Secret', env.PLATFORM_SECRET);
  }

  // Inject tenant context into upstream headers
  if (tenant) {
    headers.set('X-Tenant-ID', tenant.tenantId);
    headers.set('X-Tenant-Slug', tenant.slug);
    if (tenant.customDomain) {
      headers.set('X-Tenant-Domain', tenant.customDomain);
    }
  }

  // Pass original host information
  headers.set('X-Forwarded-Host', url.hostname);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    redirect: 'manual',
  };

  try {
    const response = await fetch(targetUrl.toString(), init);
    
    // Create copy of response headers so we can append custom edge metrics
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-Edge-Served-By', 'Kunemi-Cloudflare-Platform');
    if (tenant) {
      responseHeaders.set('X-Edge-Tenant-ID', tenant.tenantId);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy Connection Failed';
    return new Response(
      JSON.stringify({
        error: 'Bad Gateway',
        message: `Cloudflare Platform Gateway Error: ${message}`,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
