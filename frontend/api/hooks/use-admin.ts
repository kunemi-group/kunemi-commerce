import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminMerchants,
  fetchAdminMetrics,
  setMerchantCustomDomain,
  updateMerchantStatus,
  updateMerchantTier,
} from '../services/admin';

export const adminQueryKeys = {
  all: ['admin'] as const,
  metrics: () => [...adminQueryKeys.all, 'metrics'] as const,
  merchants: (params?: Record<string, unknown>) =>
    [...adminQueryKeys.all, 'merchants', params] as const,
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
