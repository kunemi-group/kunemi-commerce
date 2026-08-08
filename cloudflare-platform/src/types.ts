export interface Env {
  TENANT_LOOKUP: KVNamespace;
  MEDIA_BUCKET?: R2Bucket;
  TENANT_DISPATCH?: {
    get: (tenantId: string) => Fetcher;
  };
  BACKEND_API_URL: string;
  WORKSPACE_UI_URL: string;
  SHOPFLOW_UI_URL: string;
  PLATFORM_SECRET: string;
  ADMIN_API_KEY?: string;
}

export interface TenantRecord {
  tenantId: string;
  slug: string;
  name?: string;
  customDomain?: string | null;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface RequestContext {
  url: URL;
  hostname: string;
  pathname: string;
  tenant: TenantRecord | null;
  isApi: boolean;
  isAdmin: boolean;
  isWorkspace: boolean;
  isShopFlow: boolean;
}
