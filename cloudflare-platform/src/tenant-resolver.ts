import type { Env, TenantRecord } from './types';

export class TenantResolver {
  constructor(private readonly env: Env) {}

  /**
   * Resolves tenant record from hostname, subdomain, or explicit X-Tenant-ID header.
   */
  async resolve(request: Request, url: URL): Promise<TenantRecord | null> {
    // 1. Explicit Header Override (for API/Internal requests)
    const headerTenantId = request.headers.get('X-Tenant-ID');
    if (headerTenantId) {
      const record = await this.getByTenantId(headerTenantId);
      if (record) return record;
    }

    const hostname = url.hostname.toLowerCase();

    // 2. Custom Domain Lookup: key `domain:<hostname>`
    const domainRecordJson = await this.env.TENANT_LOOKUP.get(`domain:${hostname}`);
    if (domainRecordJson) {
      try {
        return JSON.parse(domainRecordJson) as TenantRecord;
      } catch {
        // Invalid JSON fallback
      }
    }

    // 3. Subdomain Lookup: e.g. `lagosthreads.shopflow.store` -> `subdomain:lagosthreads`
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      // Exclude common static subdomains
      if (!['app', 'api', 'admin', 'workspace', 'www'].includes(subdomain)) {
        const subRecordJson = await this.env.TENANT_LOOKUP.get(`subdomain:${subdomain}`);
        if (subRecordJson) {
          try {
            return JSON.parse(subRecordJson) as TenantRecord;
          } catch {
            // Invalid JSON fallback
          }
        }
      }
    }

    // 4. Query Parameter Fallback (e.g. ?store=lagosthreads or ?tenantId=bus_xxx)
    const querySlug = url.searchParams.get('store') || url.searchParams.get('tenantSlug');
    if (querySlug) {
      const queryRecordJson = await this.env.TENANT_LOOKUP.get(`subdomain:${querySlug.toLowerCase()}`);
      if (queryRecordJson) {
        try {
          return JSON.parse(queryRecordJson) as TenantRecord;
        } catch {
          // Invalid JSON fallback
        }
      }
    }

    return null;
  }

  async getByTenantId(tenantId: string): Promise<TenantRecord | null> {
    const recordJson = await this.env.TENANT_LOOKUP.get(`tenant:${tenantId}`);
    if (!recordJson) return null;
    try {
      return JSON.parse(recordJson) as TenantRecord;
    } catch {
      return null;
    }
  }

  async saveTenantMapping(record: TenantRecord): Promise<void> {
    const recordJson = JSON.stringify(record);

    // Save primary tenant index
    await this.env.TENANT_LOOKUP.put(`tenant:${record.tenantId}`, recordJson);

    // Save subdomain index
    if (record.slug) {
      await this.env.TENANT_LOOKUP.put(`subdomain:${record.slug.toLowerCase()}`, recordJson);
    }

    // Save custom domain index
    if (record.customDomain) {
      await this.env.TENANT_LOOKUP.put(`domain:${record.customDomain.toLowerCase()}`, recordJson);
    }
  }

  async removeTenantMapping(tenantId: string, slug?: string, customDomain?: string): Promise<void> {
    await this.env.TENANT_LOOKUP.delete(`tenant:${tenantId}`);
    if (slug) {
      await this.env.TENANT_LOOKUP.delete(`subdomain:${slug.toLowerCase()}`);
    }
    if (customDomain) {
      await this.env.TENANT_LOOKUP.delete(`domain:${customDomain.toLowerCase()}`);
    }
  }
}
