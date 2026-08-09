import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProvisionTenantPayload {
  tenantId: string;
  slug: string;
  name?: string;
  customDomain?: string | null;
}

@Injectable()
export class TenantProvisionerService {
  private readonly logger = new Logger(TenantProvisionerService.name);
  private readonly edgeAdminUrl: string;
  private readonly edgeAdminKey: string;

  constructor(private readonly config: ConfigService) {
    this.edgeAdminUrl = this.config.get<string>(
      'CLOUDFLARE_EDGE_ADMIN_URL',
      'http://localhost:8787/api/admin/tenants',
    );
    this.edgeAdminKey =
      this.config.get<string>('CLOUDFLARE_EDGE_ADMIN_KEY') ??
      this.config.get<string>('PLATFORM_SECRET', '');
  }

  /**
   * Automatically provisions tenant subdomain/domain mapping in Cloudflare KV via Edge Admin API
   */
  async registerTenant(payload: ProvisionTenantPayload): Promise<boolean> {
    if (!payload.tenantId || !payload.slug) return false;
    if (!this.edgeAdminKey) {
      this.logger.warn('Cloudflare tenant provisioning is disabled: no edge admin key');
      return false;
    }

    try {
      const response = await fetch(this.edgeAdminUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.edgeAdminKey}`,
        },
        body: JSON.stringify({
          tenantId: payload.tenantId,
          slug: payload.slug.toLowerCase().trim(),
          name: payload.name || payload.slug,
          customDomain: payload.customDomain ? payload.customDomain.toLowerCase().trim() : null,
          status: 'active',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`Failed to provision tenant ${payload.slug} in Cloudflare KV: ${text}`);
        return false;
      }

      this.logger.log(`Successfully provisioned tenant [${payload.tenantId}] (${payload.slug}) in Cloudflare KV`);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      // In local dev without Cloudflare worker running, log warning gracefully
      this.logger.warn(`Could not connect to Cloudflare Edge API at ${this.edgeAdminUrl}: ${message}`);
      return false;
    }
  }

  /**
   * Deletes tenant mapping from Cloudflare KV
   */
  async unregisterTenant(tenantId: string): Promise<boolean> {
    if (!this.edgeAdminKey) return false;
    try {
      const response = await fetch(`${this.edgeAdminUrl}/${tenantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.edgeAdminKey}`,
        },
      });

      return response.ok;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Could not unregister tenant ${tenantId}: ${message}`);
      return false;
    }
  }
}
