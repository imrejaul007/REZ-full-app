// Type definitions for Cohort Analysis Service

export interface User {
  id: string;
  signupDate: Date;
  email: string;
  metadata?: Record<string, unknown>;
}

export interface CohortDefinition {
  id: string;
  name: string;
  description: string;
  criteria: CohortCriteria;
  createdAt: Date;
  updatedAt: Date;
}

export interface CohortCriteria {
  signupDateRange?: {
    start: Date;
    end: Date;
  };
  signupMonth?: string; // Format: 'YYYY-MM'
  customFilters?: Record<string, unknown>;
  userPropertyFilters?: UserPropertyFilter[];
}

export interface UserPropertyFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface Cohort {
  id: string;
  name: string;
  cohortKey: string; // Format: 'YYYY-MM'
  userIds: string[];
  size: number;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface RetentionPeriod {
  periodIndex: number; // 0 = period of signup, 1 = next period, etc.
  periodLabel: string;
  activeUsers: number;
  retainedUsers: number;
  retentionRate: number;
  churnRate: number;
}

export interface RetentionCohort {
  cohortId: string;
  cohortKey: string;
  cohortName: string;
  initialSize: number;
  periods: RetentionPeriod[];
  overallRetentionRate: number;
  averageRetentionRate: number;
}

export interface EngagementMetric {
  userId: string;
  cohortKey: string;
  metrics: {
    loginCount: number;
    sessionDuration: number; // in seconds
    featureUsage: Record<string, number>;
    actionsPerformed: number;
    lastActiveDate: Date;
  };
}

export interface CohortEngagementSummary {
  cohortKey: string;
  cohortName: string;
  periodIndex: number;
  averageLoginCount: number;
  averageSessionDuration: number;
  totalFeatureUsage: Record<string, number>;
  totalActions: number;
  activeUsers: number;
  engagementScore: number;
}

export interface RevenueCohort {
  cohortId: string;
  cohortKey: string;
  cohortName: string;
  initialSize: number;
  periods: RevenuePeriod[];
  totalRevenue: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

export interface RevenuePeriod {
  periodIndex: number;
  periodLabel: string;
  revenue: number;
  transactions: number;
  averageTransactionValue: number;
  revenuePerUser: number;
  cumulativeRevenue: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  date: Date;
  type: 'purchase' | 'subscription' | 'refund';
  metadata?: Record<string, unknown>;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  eventType: string;
  timestamp: Date;
  properties?: Record<string, unknown>;
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface RetentionChartData {
  cohortKeys: string[];
  periodLabels: string[];
  data: number[][];
  percentages: number[][];
}

export interface RevenueChartData {
  cohortKeys: string[];
  periods: string[];
  revenue: number[][];
  cumulativeRevenue: number[][];
}

export interface EngagementChartData {
  cohortKeys: string[];
  metrics: {
    loginCount: ChartDataPoint[];
    sessionDuration: ChartDataPoint[];
    actionsPerformed: ChartDataPoint[];
  };
}

export interface CohortSummary {
  totalCohorts: number;
  totalUsers: number;
  averageCohortSize: number;
  largestCohort: Cohort | null;
  smallestCohort: Cohort | null;
  cohortsByMonth: Record<string, Cohort[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CohortAnalysisRequest {
  cohortDefinition?: Partial<CohortDefinition>;
  startDate?: Date;
  endDate?: Date;
  periodType: 'day' | 'week' | 'month';
  maxPeriods?: number;
}

export interface CohortComparison {
  cohortA: Cohort;
  cohortB: Cohort;
  retentionComparison: {
    periodIndex: number;
    retentionRateA: number;
    retentionRateB: number;
    difference: number;
    percentageChange: number;
  }[];
  engagementComparison: {
    metric: string;
    valueA: number;
    valueB: number;
    difference: number;
  }[];
  revenueComparison?: {
    totalRevenueA: number;
    totalRevenueB: number;
    arpuA: number;
    arpuB: number;
  };
}
