import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import { queryKeys } from './queryKeys';

export function useStores(options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: queryKeys.stores.list(),
    queryFn: async () => {
      const res = await apiClient.get<any>('/stores');
      return res.data?.data ?? res.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useActiveStores(options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: queryKeys.stores.active(),
    queryFn: async () => {
      const res = await apiClient.get<any>('/stores/active');
      return res.data?.data ?? res.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useStore(id: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: queryKeys.stores.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<any>(`/stores/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
    ...options,
  });
}

export function useStorePerformance(storeId?: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: queryKeys.stores.performance(storeId),
    queryFn: async () => {
      const res = await apiClient.get<any>('/dashboard/store-performance', {
        params: storeId ? { storeId } : undefined,
      });
      return res.data?.data ?? res.data;
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}
