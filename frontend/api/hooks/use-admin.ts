import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminUserRequest,
  deleteAdminUserRequest,
  fetchAdminMerchants,
  fetchAdminMetrics,
  fetchAdminUsers,
  setMerchantCustomDomain,
  updateMerchantStatus,
  updateMerchantTier,
} from '../services/admin';

export const adminQueryKeys = {
  all: ['admin'] as const,
  metrics: () => [...adminQueryKeys.all, 'metrics'] as const,
  merchants: (params?: Record<string, unknown>) =>
    [...adminQueryKeys.all, 'merchants', params] as const,
  users: () => [...adminQueryKeys.all, 'users'] as const,
};

export function useAdminMetrics() {
  return useQuery({
    queryKey: adminQueryKeys.metrics(),
    queryFn: fetchAdminMetrics,
    refetchInterval: 30000,
  });
}

export function useAdminMerchants(params?: {
  search?: string;
  tier?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminQueryKeys.merchants(params),
    queryFn: () => fetchAdminMerchants(params),
  });
}

export function useUpdateMerchantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'active' | 'suspended' | 'pending';
    }) => updateMerchantStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useUpdateMerchantTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      tier,
    }: {
      id: string;
      tier: 'starter' | 'growth' | 'scale';
    }) => updateMerchantTier(id, tier),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useSetCustomDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      customDomain,
    }: {
      id: string;
      customDomain: string | null;
    }) => setMerchantCustomDomain(id, customDomain),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users(),
    queryFn: fetchAdminUsers,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      email: string;
      password: string;
      fullName: string;
      role: 'admin' | 'super_admin';
    }) => createAdminUserRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminUserRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}
