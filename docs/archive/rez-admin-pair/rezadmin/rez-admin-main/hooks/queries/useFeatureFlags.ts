import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/apiClient';
import { queryKeys } from './queryKeys';
import { queryConfig } from '@/config/reactQuery';

export function useFeatureFlags() {
  return useQuery({
    queryKey: queryKeys.featureFlags.list(),
    queryFn: () => apiClient.get<any>('admin/feature-flags'),
    select: (res) => res.data,
    ...queryConfig.featureFlags,
  });
}

export function useFeatureFlag(key: string) {
  return useQuery({
    queryKey: queryKeys.featureFlags.detail(key),
    queryFn: () => apiClient.get<any>(`admin/feature-flags/${key}`),
    select: (res) => res.data,
    enabled: !!key,
    ...queryConfig.featureFlags,
  });
}
