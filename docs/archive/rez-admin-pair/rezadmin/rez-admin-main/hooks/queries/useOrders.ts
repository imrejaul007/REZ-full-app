import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/apiClient';
import { queryKeys } from './queryKeys';
import { queryConfig } from '@/config/reactQuery';

export function useAdminOrders(filters?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.status) params.set('status', filters.status);
      const qs = params.toString();
      return apiClient.get<any>(`admin/orders${qs ? `?${qs}` : ''}`);
    },
    select: (res) => res.data,
    ...queryConfig.orders,
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => apiClient.get<any>(`admin/orders/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: queryKeys.orders.stats(),
    queryFn: () => apiClient.get<any>('admin/orders/stats'),
    select: (res) => res.data,
    ...queryConfig.orders,
  });
}
