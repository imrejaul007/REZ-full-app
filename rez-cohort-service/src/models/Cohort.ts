import { v4 as uuidv4 } from 'uuid';
import {
  Cohort,
  CohortDefinition,
  CohortCriteria,
  User,
  RetentionCohort,
  RetentionPeriod,
  EngagementMetric,
  RevenueCohort,
  RevenuePeriod,
  Transaction,
  ActivityEvent,
  CohortSummary,
  ChartDataPoint,
  RetentionChartData,
  RevenueChartData,
  EngagementChartData,
  CohortAnalysisRequest,
  CohortComparison,
} from '../types';

export class CohortModel {
  private cohorts: Map<string, Cohort> = new Map();
  private cohortDefinitions: Map<string, CohortDefinition> = new Map();
  private users: Map<string, User> = new Map();
  private activities: Map<string, ActivityEvent[]> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();

  // Create a cohort from users who signed up in a specific month
  createCohortBySignupMonth(name: string, signupMonth: string): Cohort {
    const cohortKey = signupMonth;
    const userIds = this.getUsersBySignupMonth(signupMonth).map(u => u.id);

    const cohort: Cohort = {
      id: uuidv4(),
      name,
      cohortKey,
      userIds,
      size: userIds.length,
      createdAt: new Date(),
    };

    this.cohorts.set(cohort.id, cohort);
    return cohort;
  }

  // Create a cohort from custom criteria
  createCohortFromCriteria(definition: Partial<CohortDefinition>): Cohort {
    const id = uuidv4();
    const criteria = definition.criteria || {};

    const userIds = this.filterUsersByCriteria(criteria).map(u => u.id);
    const cohortKey = this.generateCohortKey(criteria);

    const cohort: Cohort = {
      id,
      name: definition.name || `Cohort ${id.substring(0, 8)}`,
      cohortKey,
      userIds,
      size: userIds.length,
      createdAt: new Date(),
      metadata: definition as Record<string, unknown>,
    };

    this.cohorts.set(cohort.id, cohort);

    // Store the definition
    const fullDefinition: CohortDefinition = {
      id,
      name: cohort.name,
      description: definition.description || '',
      criteria,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cohortDefinitions.set(id, fullDefinition);

    return cohort;
  }

  // Get all cohorts
  getAllCohorts(): Cohort[] {
    return Array.from(this.cohorts.values());
  }

  // Get cohort by ID
  getCohortById(id: string): Cohort | undefined {
    return this.cohorts.get(id);
  }

  // Get cohorts by signup month
  getCohortsBySignupMonth(signupMonth: string): Cohort[] {
    return this.getAllCohorts().filter(c => c.cohortKey === signupMonth);
  }

  // Add a user to the system
  addUser(user: Omit<User, 'id'>): User {
    const id = uuidv4();
    const newUser: User = {
      id,
      ...user,
      signupDate: new Date(user.signupDate),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  // Get user by ID
  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  // Get users by signup month
  getUsersBySignupMonth(signupMonth: string): User[] {
    return Array.from(this.users.values()).filter(user => {
      const userMonth = this.formatDateToMonth(new Date(user.signupDate));
      return userMonth === signupMonth;
    });
  }

  // Record an activity event
  recordActivity(userId: string, eventType: string, properties?: Record<string, unknown>): ActivityEvent {
    const event: ActivityEvent = {
      id: uuidv4(),
      userId,
      eventType,
      timestamp: new Date(),
      properties,
    };

    const userActivities = this.activities.get(userId) || [];
    userActivities.push(event);
    this.activities.set(userId, userActivities);

    return event;
  }

  // Record a transaction
  recordTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const id = uuidv4();
    const newTransaction: Transaction = {
      id,
      ...transaction,
      date: new Date(transaction.date),
    };

    const userTransactions = this.transactions.get(transaction.userId) || [];
    userTransactions.push(newTransaction);
    this.transactions.set(transaction.userId, userTransactions);

    return newTransaction;
  }

  // Get activities for a user
  getUserActivities(userId: string, startDate?: Date, endDate?: Date): ActivityEvent[] {
    let activities = this.activities.get(userId) || [];

    if (startDate) {
      activities = activities.filter(a => new Date(a.timestamp) >= startDate);
    }
    if (endDate) {
      activities = activities.filter(a => new Date(a.timestamp) <= endDate);
    }

    return activities;
  }

  // Get transactions for a user
  getUserTransactions(userId: string): Transaction[] {
    return this.transactions.get(userId) || [];
  }

  // Calculate retention for a cohort over multiple periods
  calculateRetention(cohortId: string, maxPeriods: number = 12, periodType: 'day' | 'week' | 'month' = 'month'): RetentionCohort | null {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return null;

    const periods: RetentionPeriod[] = [];
    const cohortStartDate = this.parseCohortKey(cohort.cohortKey);
    let totalRetention = 0;

    for (let i = 0; i < maxPeriods; i++) {
      const periodStart = this.addPeriods(cohortStartDate, i, periodType);
      const periodEnd = this.addPeriods(cohortStartDate, i + 1, periodType);
      const periodLabel = this.formatPeriodLabel(periodStart, periodType);

      // Count users who were active in this period
      const activeUsersInPeriod = cohort.userIds.filter(userId => {
        const activities = this.getUserActivities(userId, periodStart, periodEnd);
        return activities.length > 0;
      }).length;

      const retainedUsers = activeUsersInPeriod;
      const initialSize = i === 0 ? cohort.size : cohort.size;
      const retentionRate = initialSize > 0 ? (retainedUsers / cohort.size) * 100 : 0;
      const churnRate = 100 - retentionRate;

      periods.push({
        periodIndex: i,
        periodLabel,
        activeUsers: activeUsersInPeriod,
        retainedUsers,
        retentionRate: Math.round(retentionRate * 100) / 100,
        churnRate: Math.round(churnRate * 100) / 100,
      });

      totalRetention += retentionRate;
    }

    const averageRetentionRate = periods.length > 0 ? totalRetention / periods.length : 0;
    const lastPeriod = periods[periods.length - 1];

    return {
      cohortId: cohort.id,
      cohortKey: cohort.cohortKey,
      cohortName: cohort.name,
      initialSize: cohort.size,
      periods,
      overallRetentionRate: lastPeriod?.retentionRate || 0,
      averageRetentionRate: Math.round(averageRetentionRate * 100) / 100,
    };
  }

  // Calculate engagement metrics for a cohort
  calculateEngagementMetrics(cohortId: string, periodIndex: number = 0): EngagementMetric[] {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return [];

    const cohortStartDate = this.parseCohortKey(cohort.cohortKey);
    const periodStart = this.addPeriods(cohortStartDate, periodIndex, 'month');
    const periodEnd = this.addPeriods(cohortStartDate, periodIndex + 1, 'month');

    return cohort.userIds.map(userId => {
      const activities = this.getUserActivities(userId, periodStart, periodEnd);
      const featureUsage: Record<string, number> = {};

      activities.forEach(activity => {
        const eventType = activity.eventType;
        featureUsage[eventType] = (featureUsage[eventType] || 0) + 1;
      });

      const loginCount = activities.filter(a => a.eventType === 'login').length;
      const lastActivity = activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      // Calculate session duration from activity timestamps
      const sessionDuration = this.calculateSessionDuration(activities);

      return {
        userId,
        cohortKey: cohort.cohortKey,
        metrics: {
          loginCount,
          sessionDuration,
          featureUsage,
          actionsPerformed: activities.length,
          lastActiveDate: lastActivity ? new Date(lastActivity.timestamp) : new Date(0),
        },
      };
    });
  }

  // Calculate revenue cohort metrics
  calculateRevenueCohort(cohortId: string, maxPeriods: number = 12): RevenueCohort | null {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return null;

    const cohortStartDate = this.parseCohortKey(cohort.cohortKey);
    const periods: RevenuePeriod[] = [];
    let cumulativeRevenue = 0;
    let totalRevenue = 0;

    for (let i = 0; i < maxPeriods; i++) {
      const periodStart = this.addPeriods(cohortStartDate, i, 'month');
      const periodEnd = this.addPeriods(cohortStartDate, i + 1, 'month');
      const periodLabel = this.formatPeriodLabel(periodStart, 'month');

      let periodRevenue = 0;
      let transactions = 0;

      cohort.userIds.forEach(userId => {
        const userTransactions = this.getUserTransactions(userId).filter(t => {
          const txDate = new Date(t.date);
          return txDate >= periodStart && txDate < periodEnd && t.type !== 'refund';
        });

        periodRevenue += userTransactions.reduce((sum, t) => sum + t.amount, 0);
        transactions += userTransactions.length;
      });

      cumulativeRevenue += periodRevenue;
      totalRevenue += periodRevenue;

      const averageTransactionValue = transactions > 0 ? periodRevenue / transactions : 0;
      const revenuePerUser = cohort.size > 0 ? periodRevenue / cohort.size : 0;

      periods.push({
        periodIndex: i,
        periodLabel,
        revenue: Math.round(periodRevenue * 100) / 100,
        transactions,
        averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
        revenuePerUser: Math.round(revenuePerUser * 100) / 100,
        cumulativeRevenue: Math.round(cumulativeRevenue * 100) / 100,
      });
    }

    return {
      cohortId: cohort.id,
      cohortKey: cohort.cohortKey,
      cohortName: cohort.name,
      initialSize: cohort.size,
      periods,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageRevenuePerUser: cohort.size > 0 ? Math.round((totalRevenue / cohort.size) * 100) / 100 : 0,
      lifetimeValue: Math.round((totalRevenue / cohort.size) * 100) / 100,
    };
  }

  // Generate retention chart data for multiple cohorts
  generateRetentionChartData(cohortIds: string[], maxPeriods: number = 12): RetentionChartData {
    const cohortKeys: string[] = [];
    const periodLabels: string[] = [];
    const data: number[][] = [];
    const percentages: number[][] = [];

    for (let i = 0; i < maxPeriods; i++) {
      periodLabels.push(`Period ${i}`);
    }

    cohortIds.forEach(cohortId => {
      const retention = this.calculateRetention(cohortId, maxPeriods);
      if (retention) {
        cohortKeys.push(retention.cohortKey);
        data.push(retention.periods.map(p => p.retainedUsers));
        percentages.push(retention.periods.map(p => p.retentionRate));
      }
    });

    return {
      cohortKeys,
      periodLabels,
      data,
      percentages,
    };
  }

  // Generate revenue chart data
  generateRevenueChartData(cohortIds: string[], maxPeriods: number = 12): RevenueChartData {
    const cohortKeys: string[] = [];
    const periods: string[] = [];
    const revenue: number[][] = [];
    const cumulativeRevenue: number[][] = [];

    for (let i = 0; i < maxPeriods; i++) {
      periods.push(`Period ${i}`);
    }

    cohortIds.forEach(cohortId => {
      const revenueCohort = this.calculateRevenueCohort(cohortId, maxPeriods);
      if (revenueCohort) {
        cohortKeys.push(revenueCohort.cohortKey);
        revenue.push(revenueCohort.periods.map(p => p.revenue));
        cumulativeRevenue.push(revenueCohort.periods.map(p => p.cumulativeRevenue));
      }
    });

    return {
      cohortKeys,
      periods,
      revenue,
      cumulativeRevenue,
    };
  }

  // Generate engagement chart data
  generateEngagementChartData(cohortIds: string[], periodIndex: number = 0): EngagementChartData {
    const cohortKeys: string[] = [];
    const loginCount: ChartDataPoint[] = [];
    const sessionDuration: ChartDataPoint[] = [];
    const actionsPerformed: ChartDataPoint[] = [];

    cohortIds.forEach((cohortId, index) => {
      const retention = this.calculateRetention(cohortId, periodIndex + 1);
      if (retention) {
        cohortKeys.push(retention.cohortKey);

        const engagementMetrics = this.calculateEngagementMetrics(cohortId, periodIndex);
        const avgLoginCount = this.average(engagementMetrics.map(e => e.metrics.loginCount));
        const avgSessionDuration = this.average(engagementMetrics.map(e => e.metrics.sessionDuration));
        const totalActions = engagementMetrics.reduce((sum, e) => sum + e.metrics.actionsPerformed, 0);

        loginCount.push({ x: index, y: avgLoginCount, label: retention.cohortKey });
        sessionDuration.push({ x: index, y: avgSessionDuration, label: retention.cohortKey });
        actionsPerformed.push({ x: index, y: totalActions, label: retention.cohortKey });
      }
    });

    return {
      cohortKeys,
      metrics: {
        loginCount,
        sessionDuration,
        actionsPerformed,
      },
    };
  }

  // Get cohort summary statistics
  getCohortSummary(): CohortSummary {
    const cohorts = this.getAllCohorts();
    const totalCohorts = cohorts.length;
    const totalUsers = cohorts.reduce((sum, c) => sum + c.size, 0);
    const averageCohortSize = totalCohorts > 0 ? totalUsers / totalCohorts : 0;

    const sortedBySize = [...cohorts].sort((a, b) => b.size - a.size);

    const cohortsByMonth: Record<string, Cohort[]> = {};
    cohorts.forEach(cohort => {
      if (!cohortsByMonth[cohort.cohortKey]) {
        cohortsByMonth[cohort.cohortKey] = [];
      }
      cohortsByMonth[cohort.cohortKey].push(cohort);
    });

    return {
      totalCohorts,
      totalUsers,
      averageCohortSize: Math.round(averageCohortSize * 100) / 100,
      largestCohort: sortedBySize[0] || null,
      smallestCohort: sortedBySize[sortedBySize.length - 1] || null,
      cohortsByMonth,
    };
  }

  // Compare two cohorts
  compareCohorts(cohortIdA: string, cohortIdB: string): CohortComparison | null {
    const cohortA = this.cohorts.get(cohortIdA);
    const cohortB = this.cohorts.get(cohortIdB);
    if (!cohortA || !cohortB) return null;

    const retentionA = this.calculateRetention(cohortIdA, 12);
    const retentionB = this.calculateRetention(cohortIdB, 12);
    const engagementA = this.calculateEngagementMetrics(cohortIdA, 0);
    const engagementB = this.calculateEngagementMetrics(cohortIdB, 0);
    const revenueA = this.calculateRevenueCohort(cohortIdA, 12);
    const revenueB = this.calculateRevenueCohort(cohortIdB, 12);

    const retentionComparison = [];
    const maxPeriods = Math.max(
      retentionA?.periods.length || 0,
      retentionB?.periods.length || 0
    );

    for (let i = 0; i < maxPeriods; i++) {
      const rateA = retentionA?.periods[i]?.retentionRate || 0;
      const rateB = retentionB?.periods[i]?.retentionRate || 0;
      const difference = rateA - rateB;
      const percentageChange = rateB > 0 ? ((rateA - rateB) / rateB) * 100 : 0;

      retentionComparison.push({
        periodIndex: i,
        retentionRateA: rateA,
        retentionRateB: rateB,
        difference: Math.round(difference * 100) / 100,
        percentageChange: Math.round(percentageChange * 100) / 100,
      });
    }

    const avgLoginA = this.average(engagementA.map(e => e.metrics.loginCount));
    const avgLoginB = this.average(engagementB.map(e => e.metrics.loginCount));
    const avgSessionA = this.average(engagementA.map(e => e.metrics.sessionDuration));
    const avgSessionB = this.average(engagementB.map(e => e.metrics.sessionDuration));
    const totalActionsA = engagementA.reduce((sum, e) => sum + e.metrics.actionsPerformed, 0);
    const totalActionsB = engagementB.reduce((sum, e) => sum + e.metrics.actionsPerformed, 0);

    const engagementComparison = [
      { metric: 'avgLoginCount', valueA: avgLoginA, valueB: avgLoginB, difference: avgLoginA - avgLoginB },
      { metric: 'avgSessionDuration', valueA: avgSessionA, valueB: avgSessionB, difference: avgSessionA - avgSessionB },
      { metric: 'totalActions', valueA: totalActionsA, valueB: totalActionsB, difference: totalActionsA - totalActionsB },
    ];

    const revenueComparison = revenueA && revenueB ? {
      totalRevenueA: revenueA.totalRevenue,
      totalRevenueB: revenueB.totalRevenue,
      arpuA: revenueA.averageRevenuePerUser,
      arpuB: revenueB.averageRevenuePerUser,
    } : undefined;

    return {
      cohortA,
      cohortB,
      retentionComparison,
      engagementComparison,
      revenueComparison,
    };
  }

  // Bulk create cohorts by signup month for a date range
  createCohortsByMonthRange(startMonth: string, endMonth: string): Cohort[] {
    const cohorts: Cohort[] = [];
    const start = this.parseCohortKey(startMonth);
    const end = this.parseCohortKey(endMonth);

    const current = new Date(start);
    while (current <= end) {
      const monthKey = this.formatDateToMonth(current);
      const usersInMonth = this.getUsersBySignupMonth(monthKey);

      if (usersInMonth.length > 0) {
        const cohort = this.createCohortBySignupMonth(`Cohort ${monthKey}`, monthKey);
        cohorts.push(cohort);
      }

      current.setMonth(current.getMonth() + 1);
    }

    return cohorts;
  }

  // Delete a cohort
  deleteCohort(id: string): boolean {
    return this.cohorts.delete(id);
  }

  // Update cohort metadata
  updateCohort(id: string, updates: Partial<Cohort>): Cohort | null {
    const cohort = this.cohorts.get(id);
    if (!cohort) return null;

    const updated: Cohort = {
      ...cohort,
      ...updates,
      id: cohort.id, // Prevent ID change
    };

    this.cohorts.set(id, updated);
    return updated;
  }

  // Private helper methods
  private filterUsersByCriteria(criteria: CohortCriteria): User[] {
    let users = Array.from(this.users.values());

    if (criteria.signupDateRange) {
      const { start, end } = criteria.signupDateRange;
      users = users.filter(u => {
        const signupDate = new Date(u.signupDate);
        return signupDate >= new Date(start) && signupDate <= new Date(end);
      });
    }

    if (criteria.signupMonth) {
      users = users.filter(u => {
        const userMonth = this.formatDateToMonth(new Date(u.signupDate));
        return userMonth === criteria.signupMonth;
      });
    }

    if (criteria.userPropertyFilters) {
      criteria.userPropertyFilters.forEach(filter => {
        users = users.filter(u => {
          const value = (u as Record<string, unknown>)[filter.field];
          return this.evaluateFilter(value, filter.operator, filter.value);
        });
      });
    }

    return users;
  }

  private evaluateFilter(value: unknown, operator: string, target: unknown): boolean {
    switch (operator) {
      case 'eq': return value === target;
      case 'ne': return value !== target;
      case 'gt': return (value as number) > (target as number);
      case 'gte': return (value as number) >= (target as number);
      case 'lt': return (value as number) < (target as number);
      case 'lte': return (value as number) <= (target as number);
      case 'contains': return String(value).includes(String(target));
      case 'in': return Array.isArray(target) && target.includes(value);
      default: return false;
    }
  }

  private generateCohortKey(criteria: CohortCriteria): string {
    if (criteria.signupMonth) return criteria.signupMonth;
    if (criteria.signupDateRange) {
      return this.formatDateToMonth(new Date(criteria.signupDateRange.start));
    }
    return `custom_${Date.now()}`;
  }

  private formatDateToMonth(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private parseCohortKey(key: string): Date {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  private addPeriods(date: Date, periods: number, type: 'day' | 'week' | 'month'): Date {
    const result = new Date(date);
    switch (type) {
      case 'day':
        result.setDate(result.getDate() + periods);
        break;
      case 'week':
        result.setDate(result.getDate() + periods * 7);
        break;
      case 'month':
        result.setMonth(result.getMonth() + periods);
        break;
    }
    return result;
  }

  private formatPeriodLabel(date: Date, type: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    switch (type) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        return `Week ${this.getWeekNumber(d)}`;
      case 'month':
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private calculateSessionDuration(activities: ActivityEvent[]): number {
    if (activities.length < 2) return 0;

    const sorted = [...activities].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let totalDuration = 0;
    let sessionStart = new Date(sorted[0].timestamp);
    let lastActivity = sessionStart;

    for (let i = 1; i < sorted.length; i++) {
      const current = new Date(sorted[i].timestamp);
      const diff = current.getTime() - lastActivity.getTime();

      // Consider a new session if > 30 minutes gap
      if (diff > 30 * 60 * 1000) {
        totalDuration += lastActivity.getTime() - sessionStart.getTime();
        sessionStart = current;
      }
      lastActivity = current;
    }

    totalDuration += lastActivity.getTime() - sessionStart.getTime();
    return Math.round(totalDuration / 1000); // Return in seconds
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  // Seed sample data for testing
  seedSampleData(): void {
    const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05'];

    months.forEach(month => {
      const [year, monthNum] = month.split('-').map(Number);
      const userCount = Math.floor(Math.random() * 50) + 20;

      for (let i = 0; i < userCount; i++) {
        const signupDate = new Date(year, monthNum - 1, Math.floor(Math.random() * 28) + 1);
        const user = this.addUser({
          email: `user_${month}_${i}@example.com`,
          signupDate,
        });

        // Add some activity events
        const activityCount = Math.floor(Math.random() * 20) + 5;
        const eventTypes = ['login', 'view', 'click', 'purchase', 'search'];

        for (let j = 0; j < activityCount; j++) {
          const eventDate = new Date(signupDate);
          eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 90));

          if (eventDate <= new Date()) {
            this.recordActivity(
              user.id,
              eventTypes[Math.floor(Math.random() * eventTypes.length)],
              { source: 'web' }
            );
          }
        }

        // Add some transactions for some users
        if (Math.random() > 0.5) {
          const txDate = new Date(signupDate);
          txDate.setDate(txDate.getDate() + Math.floor(Math.random() * 60));

          if (txDate <= new Date()) {
            this.recordTransaction({
              userId: user.id,
              amount: Math.floor(Math.random() * 100) + 10,
              currency: 'USD',
              date: txDate,
              type: 'purchase',
            });
          }
        }
      }

      // Create cohort for this month
      this.createCohortBySignupMonth(`Cohort ${month}`, month);
    });
  }
}

export const cohortModel = new CohortModel();
