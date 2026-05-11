import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/apiClient';
import { queryKeys } from './queryKeys';

export function useMerchantCampaignRules(filters?: {
  page?: number;
  merchantId?: string;
  isActive?: boolean;
  triggerType?: string;
}) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.merchantId) params.set('merchantId', filters.merchantId);
      if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
      if (filters?.triggerType) params.set('triggerType', filters.triggerType);
      const qs = params.toString();
      return apiClient.get<any>(`admin/merchant-campaign-rules${qs ? `?${qs}` : ''}`);
    },
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMerchantCampaignRuleStats() {
  return useQuery({
    queryKey: queryKeys.campaigns.stats(),
    queryFn: () => apiClient.get<any>('admin/merchant-campaign-rules/stats'),
    select: (res) => res.data,
    staleTime: 10 * 60 * 1000,
  });
}
