import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/apiClient';
import { queryKeys } from './queryKeys';
import { queryConfig } from '@/config/reactQuery';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => apiClient.get<any>('admin/dashboard/stats'),
    select: (res) => res.data,
    ...queryConfig.dashboard,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity(),
    queryFn: () => apiClient.get<any>('admin/dashboard/recent-activity'),
    select: (res) => res.data,
    ...queryConfig.dashboard,
  });
}
