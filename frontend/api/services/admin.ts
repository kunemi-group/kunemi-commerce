import { apiClient } from '../client';

export interface PlatformMetrics {
  overview: {
    totalBusinesses: number;
    activeBusinesses: number;
    suspendedBusinesses: number;
    totalUsers: number;
    totalOrders: number;
    globalGmvCents: number;
    activeCustomDomains: number;
  };
  recentMerchants: Array<{
    id: string;
    name: string;
    email: string | null;
    tier: string;
    status: 'active' | 'suspended' | 'pending';
    storeSlug: string | null;
    createdAt: string;
  }>;
}

export interface AdminMerchant {
  id: string;
  name: string;
  email: string | null;
  whatsappNumber: string | null;
  tier: 'starter' | 'growth' | 'scale';
  status: 'active' | 'suspended' | 'pending';
  storeSlug: string | null;
  customDomain: string | null;
  customDomainStatus: 'pending' | 'verified' | 'failed' | null;
  currency: string;
  staffCount: number;
  orderCount: number;
  createdAt: string;
}

export interface AdminMerchantListResponse {
  data: AdminMerchant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchAdminMetrics(): Promise<PlatformMetrics> {
  return apiClient.get<PlatformMetrics>('/admin/metrics');
}

export async function fetchAdminMerchants(params?: {
  search?: string;
  tier?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminMerchantListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.tier) query.set('tier', params.tier);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const url = `/admin/businesses${query.toString() ? `?${query.toString()}` : ''}`;
  return apiClient.get<AdminMerchantListResponse>(url);
}

export async function updateMerchantStatus(
  id: string,
  status: 'active' | 'suspended' | 'pending',
) {
  return apiClient.patch<{ id: string; status: string }>(`/admin/businesses/${id}/status`, {
    status,
  });
}

export async function updateMerchantTier(
  id: string,
  subscriptionTier: 'starter' | 'growth' | 'scale',
) {
  return apiClient.patch<{ id: string; tier: string }>(`/admin/businesses/${id}/tier`, {
    subscriptionTier,
  });
}

export async function setMerchantCustomDomain(
  id: string,
  customDomain: string | null,
) {
  return apiClient.post<{ id: string; customDomain: string | null }>(
    `/admin/businesses/${id}/custom-domain`,
    { customDomain },
  );
}

export async function seedAdminAccount() {
  return apiClient.post<{ message: string; email: string }>('/admin/seed', {});
}
