export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'recentActivity'] as const,
  },

  merchants: {
    all: ['merchants'] as const,
    list: (filters?: any) => [...queryKeys.merchants.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.merchants.all, 'detail', id] as const,
    wallets: () => [...queryKeys.merchants.all, 'wallets'] as const,
    withdrawals: () => [...queryKeys.merchants.all, 'withdrawals'] as const,
    flags: (id: string) => [...queryKeys.merchants.all, 'flags', id] as const,
  },

  orders: {
    all: ['orders'] as const,
    list: (filters?: any) => [...queryKeys.orders.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
    stats: () => [...queryKeys.orders.all, 'stats'] as const,
  },

  users: {
    all: ['users'] as const,
    list: (filters?: any) => [...queryKeys.users.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    wallet: (id: string) => [...queryKeys.users.all, 'wallet', id] as const,
  },

  fraud: {
    all: ['fraud'] as const,
    reports: (filters?: any) => [...queryKeys.fraud.all, 'reports', filters] as const,
    queue: () => [...queryKeys.fraud.all, 'queue'] as const,
    config: () => [...queryKeys.fraud.all, 'config'] as const,
    alerts: () => [...queryKeys.fraud.all, 'alerts'] as const,
  },

  featureFlags: {
    all: ['featureFlags'] as const,
    list: () => [...queryKeys.featureFlags.all, 'list'] as const,
    detail: (key: string) => [...queryKeys.featureFlags.all, 'detail', key] as const,
  },

  campaigns: {
    all: ['campaigns'] as const,
    list: (filters?: any) => [...queryKeys.campaigns.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.campaigns.all, 'detail', id] as const,
    stats: () => [...queryKeys.campaigns.all, 'stats'] as const,
  },

  coins: {
    all: ['coins'] as const,
    rewards: (filters?: any) => [...queryKeys.coins.all, 'rewards', filters] as const,
    drops: (filters?: any) => [...queryKeys.coins.all, 'drops', filters] as const,
    gifts: () => [...queryKeys.coins.all, 'gifts'] as const,
    economy: () => [...queryKeys.coins.all, 'economy'] as const,
  },

  system: {
    all: ['system'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
    jobs: () => [...queryKeys.system.all, 'jobs'] as const,
  },
};
