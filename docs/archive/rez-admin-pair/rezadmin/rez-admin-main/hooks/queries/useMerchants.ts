import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/apiClient';
import { queryKeys } from './queryKeys';
import { queryConfig } from '@/config/reactQuery';

export function useMerchants(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.merchants.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return apiClient.get<any>(`admin/merchants${qs ? `?${qs}` : ''}`);
    },
    select: (res) => res.data,
    ...queryConfig.merchants,
  });
}

export function useMerchant(id: string) {
  return useQuery({
    queryKey: queryKeys.merchants.detail(id),
    queryFn: () => apiClient.get<any>(`admin/merchants/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useMerchantWalletStats() {
  return useQuery({
    queryKey: queryKeys.merchants.wallets(),
    queryFn: () => apiClient.get<any>('admin/merchant-wallets/stats'),
    select: (res) => res.data,
    ...queryConfig.merchants,
  });
}

export function usePendingWithdrawals() {
  return useQuery({
    queryKey: queryKeys.merchants.withdrawals(),
    queryFn: () => apiClient.get<any>('admin/merchant-wallets/pending-withdrawals'),
    select: (res) => res.data,
    staleTime: 2 * 60 * 1000,
  });
}
