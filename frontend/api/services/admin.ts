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

export interface PlatformAdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

export async function fetchAdminMetrics(): Promise<PlatformMetrics> {
  const { data } = await apiClient.get<PlatformMetrics>('/admin/metrics');
  return data;
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
  const { data } = await apiClient.get<AdminMerchantListResponse>(url);
  return data;
}

export async function updateMerchantStatus(
  id: string,
  status: 'active' | 'suspended' | 'pending',
) {
  const { data } = await apiClient.patch<{ id: string; status: string }>(`/admin/businesses/${id}/status`, {
    status,
  });
  return data;
}

export async function updateMerchantTier(
  id: string,
  subscriptionTier: 'starter' | 'growth' | 'scale',
) {
  const { data } = await apiClient.patch<{ id: string; tier: string }>(`/admin/businesses/${id}/tier`, {
    subscriptionTier,
  });
  return data;
}

export async function setMerchantCustomDomain(
  id: string,
  customDomain: string | null,
) {
  const { data } = await apiClient.post<{ id: string; customDomain: string | null }>(
    `/admin/businesses/${id}/custom-domain`,
    { customDomain },
  );
  return data;
}

export async function fetchAdminUsers(): Promise<{ admins: PlatformAdminUser[] }> {
  const { data } = await apiClient.get<{ admins: PlatformAdminUser[] }>('/admin/users');
  return data;
}

export async function createAdminUserRequest(input: {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'super_admin';
}): Promise<PlatformAdminUser> {
  const { data } = await apiClient.post<PlatformAdminUser>('/admin/users', input);
  return data;
}

export async function deleteAdminUserRequest(id: string): Promise<{ message: string; id: string }> {
  const { data } = await apiClient.delete<{ message: string; id: string }>(`/admin/users/${id}`);
  return data;
}
