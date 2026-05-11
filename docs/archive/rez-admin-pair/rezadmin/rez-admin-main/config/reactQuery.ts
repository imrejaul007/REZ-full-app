import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 1,
    retryDelay: 1000,
  },
};

export const queryClient = new QueryClient({ defaultOptions });

export const queryConfig = {
  dashboard: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  merchants: {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },
  orders: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  fraud: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  featureFlags: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  campaigns: {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },
};
