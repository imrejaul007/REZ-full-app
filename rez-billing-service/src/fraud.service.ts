import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { FraudAlert, IFraudAlert, FraudAlertSeverity, FraudAlertStatus, Transaction, BillingRecord, BillingModel } from './models';
import { redis } from './config/redis';
import { logger } from './config/logger';
import { notificationService } from './notification.service';

export interface FraudCheckResult {
  isFraudulent: boolean;
  reason?: string;
  severity?: FraudAlertSeverity;
  riskScore?: number;
}

export interface CreateAlertInput {
  merchantId: string;
  type: string;
  severity: FraudAlertSeverity;
  description: string;
  evidence: Record<string, unknown>;
  affectedTransactions: string[];
}

export interface FraudRule {
  name: string;
  check: (merchantId: string, event?: unknown) => Promise<FraudCheckResult>;
  severity: FraudAlertSeverity;
}

class FraudService {
  private rules: FraudRule[] = [];
  private readonly RATE_WINDOW = 300; // 5 minutes
  private readonly RATE_LIMIT_CLICKS = 100;
  private readonly RATE_LIMIT_IMPRESSIONS = 1000;
  private readonly MAX_CPC_AMOUNT = 10;
  private readonly MAX_CPM_AMOUNT = 1;
  private readonly MAX_CPA_AMOUNT = 100;

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize fraud detection rules
   */
  private initializeRules(): void {
    // Rule: Rate limiting check
    this.rules.push({
      name: 'rate_limit',
      severity: FraudAlertSeverity.MEDIUM,
      check: async (merchantId: string, event?: unknown) => {
        const billingEvent = event as { billingModel?: BillingModel; eventType?: string } | undefined;
        if (!billingEvent) return { isFraudulent: false };

        const rateKey = `fraud:rate:${merchantId}:${billingEvent.eventType}`;
        const currentRate = await redis.incr(rateKey);
        await redis.expire(rateKey, this.RATE_WINDOW);

        let limit = this.RATE_LIMIT_CLICKS;
        if (billingEvent.billingModel === BillingModel.CPM) {
          limit = this.RATE_LIMIT_IMPRESSIONS;
        }

        if (currentRate > limit) {
          return {
            isFraudulent: true,
            reason: `Rate limit exceeded: ${currentRate} events in ${this.RATE_WINDOW}s`,
            severity: FraudAlertSeverity.MEDIUM,
            riskScore: Math.min(100, currentRate / limit * 50)
          };
        }

        return { isFraudulent: false };
      }
    });

    // Rule: Unusual amount check
    this.rules.push({
      name: 'unusual_amount',
      severity: FraudAlertSeverity.HIGH,
      check: async (_merchantId: string, event?: unknown) => {
        const billingEvent = event as { billingModel?: BillingModel; amount?: number } | undefined;
        if (!billingEvent) return { isFraudulent: false };

        let maxAmount = this.MAX_CPC_AMOUNT;
        if (billingEvent.billingModel === BillingModel.CPM) {
          maxAmount = this.MAX_CPM_AMOUNT;
        } else if (billingEvent.billingModel === BillingModel.CPA) {
          maxAmount = this.MAX_CPA_AMOUNT;
        }

        if (billingEvent.amount && billingEvent.amount > maxAmount) {
          return {
            isFraudulent: true,
            reason: `Unusual amount: ${billingEvent.amount} exceeds max ${maxAmount} for ${billingEvent.billingModel}`,
            severity: FraudAlertSeverity.HIGH,
            riskScore: 80
          };
        }

        return { isFraudulent: false };
      }
    });

    // Rule: Negative amount check
    this.rules.push({
      name: 'negative_amount',
      severity: FraudAlertSeverity.CRITICAL,
      check: async (_merchantId: string, event?: unknown) => {
        const billingEvent = event as { amount?: number } | undefined;
        if (!billingEvent) return { isFraudulent: false };

        if (billingEvent.amount !== undefined && billingEvent.amount < 0) {
          return {
            isFraudulent: true,
            reason: `Negative amount detected: ${billingEvent.amount}`,
            severity: FraudAlertSeverity.CRITICAL,
            riskScore: 100
          };
        }

        return { isFraudulent: false };
      }
    });

    // Rule: Zero amount check
    this.rules.push({
      name: 'zero_amount',
      severity: FraudAlertSeverity.LOW,
      check: async (_merchantId: string, event?: unknown) => {
        const billingEvent = event as { amount?: number } | undefined;
        if (!billingEvent) return { isFraudulent: false };

        if (billingEvent.amount === 0) {
          return {
            isFraudulent: true,
            reason: 'Zero amount event detected',
            severity: FraudAlertSeverity.LOW,
            riskScore: 20
          };
        }

        return { isFraudulent: false };
      }
    });
  }

  /**
   * Check a billing event for fraud
   */
  async checkEvent(event: {
    campaignId: string;
    merchantId: string;
    billingModel: BillingModel;
    amount: number;
    eventType: string;
  }): Promise<FraudCheckResult> {
    const results: FraudCheckResult[] = [];
    let highestRiskScore = 0;
    let worstResult: FraudCheckResult = { isFraudulent: false };

    for (const rule of this.rules) {
      try {
        const result = await rule.check(event.merchantId, event);
        if (result.isFraudulent) {
          results.push(result);
          if ((result.riskScore || 0) > highestRiskScore) {
            highestRiskScore = result.riskScore || 0;
            worstResult = result;
          }
        }
      } catch (error) {
        logger.error(`Error in fraud rule ${rule.name}:`, error);
      }
    }

    // Store risk score in Redis for analytics
    const scoreKey = `fraud:score:${event.merchantId}`;
    await redis.zadd(scoreKey, highestRiskScore, `${event.campaignId}:${Date.now()}`);
    await redis.expire(scoreKey, 86400); // 24 hours

    return worstResult;
  }

  /**
   * Check for patterns across multiple events
   */
  async checkPattern(merchantId: string): Promise<FraudCheckResult> {
    // Get recent risk scores
    const scoreKey = `fraud:score:${merchantId}`;
    const scores = await redis.zrange(scoreKey, 0, -1, 'WITHSCORES');

    if (scores.length === 0) {
      return { isFraudulent: false };
    }

    // Calculate average risk score
    let totalScore = 0;
    let count = 0;
    for (let i = 1; i < scores.length; i += 2) {
      totalScore += parseInt(scores[i], 10);
      count++;
    }

    const avgScore = count > 0 ? totalScore / count : 0;

    // Check for spike in activity
    const recentCount = await redis.zcount(scoreKey, Date.now() - 60000, Date.now());
    if (recentCount > 50 && avgScore > 30) {
      return {
        isFraudulent: true,
        reason: `Pattern anomaly: ${recentCount} events in last minute with avg risk ${avgScore.toFixed(1)}`,
        severity: FraudAlertSeverity.HIGH,
        riskScore: avgScore + 20
      };
    }

    return { isFraudulent: false };
  }

  /**
   * Analyze transaction history for fraud patterns
   */
  async analyzeTransactionHistory(merchantId: string, lookbackHours: number = 24): Promise<FraudCheckResult> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - lookbackHours);

    // Get recent transactions
    const transactions = await Transaction.find({
      merchantId,
      createdAt: { $gte: cutoff }
    });

    if (transactions.length === 0) {
      return { isFraudulent: false };
    }

    // Check for unusual patterns
    const amounts = transactions.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - avgAmount, 2), 0) / amounts.length
    );

    // Check for extreme variance
    if (stdDev > avgAmount * 3) {
      return {
        isFraudulent: true,
        reason: `High variance in transaction amounts: stdDev=${stdDev.toFixed(2)}, avg=${avgAmount.toFixed(2)}`,
        severity: FraudAlertSeverity.MEDIUM,
        riskScore: 60
      };
    }

    // Check for burst of small transactions
    const smallTransactions = transactions.filter(t => t.amount < 0.01);
    if (smallTransactions.length > 100) {
      return {
        isFraudulent: true,
        reason: `Burst of micro-transactions: ${smallTransactions.length} transactions < $0.01`,
        severity: FraudAlertSeverity.MEDIUM,
        riskScore: 50
      };
    }

    return { isFraudulent: false };
  }

  /**
   * Create a fraud alert
   */
  async createAlert(input: CreateAlertInput): Promise<IFraudAlert> {
    const alertId = uuidv4();

    const alert = new FraudAlert({
      alertId,
      ...input,
      status: FraudAlertStatus.OPEN
    });

    await alert.save();

    logger.warn(`Fraud alert created: ${alertId}`, {
      merchantId: input.merchantId,
      type: input.type,
      severity: input.severity
    });

    // Send notification for high/critical alerts
    if (input.severity === FraudAlertSeverity.HIGH || input.severity === FraudAlertSeverity.CRITICAL) {
      await notificationService.sendFraudAlert(alert);
    }

    return alert;
  }

  /**
   * Get fraud alert by ID
   */
  async getAlert(alertId: string): Promise<IFraudAlert | null> {
    return FraudAlert.findOne({ alertId });
  }

  /**
   * Get alerts for a merchant
   */
  async getMerchantAlerts(
    merchantId: string,
    options: {
      page?: number;
      limit?: number;
      severity?: FraudAlertSeverity;
      status?: FraudAlertStatus;
    }
  ): Promise<{ alerts: IFraudAlert[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { merchantId };
    if (options.severity) query.severity = options.severity;
    if (options.status) query.status = options.status;

    const [alerts, total] = await Promise.all([
      FraudAlert.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      FraudAlert.countDocuments(query)
    ]);

    return {
      alerts,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: FraudAlertStatus,
    resolution?: string
  ): Promise<IFraudAlert | null> {
    const update: Record<string, unknown> = { status };
    if (resolution) update.resolution = resolution;
    if (status === FraudAlertStatus.RESOLVED || status === FraudAlertStatus.FALSE_POSITIVE) {
      update.resolvedAt = new Date();
    }

    const alert = await FraudAlert.findOneAndUpdate(
      { alertId },
      { $set: update },
      { new: true }
    );

    if (alert) {
      logger.info(`Fraud alert ${alertId} updated to status ${status}`);
    }

    return alert;
  }

  /**
   * Get fraud statistics for a merchant
   */
  async getFraudStats(merchantId: string, startDate: Date, endDate: Date): Promise<{
    totalAlerts: number;
    bySeverity: Record<FraudAlertSeverity, number>;
    byStatus: Record<FraudAlertStatus, number>;
    avgRiskScore: number;
  }> {
    const alerts = await FraudAlert.find({
      merchantId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const bySeverity: Record<FraudAlertSeverity, number> = {
      [FraudAlertSeverity.LOW]: 0,
      [FraudAlertSeverity.MEDIUM]: 0,
      [FraudAlertSeverity.HIGH]: 0,
      [FraudAlertSeverity.CRITICAL]: 0
    };

    const byStatus: Record<FraudAlertStatus, number> = {
      [FraudAlertStatus.OPEN]: 0,
      [FraudAlertStatus.INVESTIGATING]: 0,
      [FraudAlertStatus.RESOLVED]: 0,
      [FraudAlertStatus.FALSE_POSITIVE]: 0
    };

    let totalRiskScore = 0;

    for (const alert of alerts) {
      bySeverity[alert.severity]++;
      byStatus[alert.status]++;
      totalRiskScore += this.severityToScore(alert.severity);
    }

    return {
      totalAlerts: alerts.length,
      bySeverity,
      byStatus,
      avgRiskScore: alerts.length > 0 ? totalRiskScore / alerts.length : 0
    };
  }

  /**
   * Convert severity to numeric score
   */
  private severityToScore(severity: FraudAlertSeverity): number {
    switch (severity) {
      case FraudAlertSeverity.LOW: return 25;
      case FraudAlertSeverity.MEDIUM: return 50;
      case FraudAlertSeverity.HIGH: return 75;
      case FraudAlertSeverity.CRITICAL: return 100;
    }
  }

  /**
   * Mark alert as false positive (with reason)
   */
  async markAsFalsePositive(alertId: string, reason: string): Promise<IFraudAlert | null> {
    return this.updateAlertStatus(alertId, FraudAlertStatus.FALSE_POSITIVE, reason);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolution: string): Promise<IFraudAlert | null> {
    return this.updateAlertStatus(alertId, FraudAlertStatus.RESOLVED, resolution);
  }

  /**
   * Get all open high/critical alerts (for dashboard)
   */
  async getCriticalOpenAlerts(): Promise<IFraudAlert[]> {
    return FraudAlert.find({
      severity: { $in: [FraudAlertSeverity.HIGH, FraudAlertSeverity.CRITICAL] },
      status: { $in: [FraudAlertStatus.OPEN, FraudAlertStatus.INVESTIGATING] }
    }).sort({ severity: -1, createdAt: -1 });
  }

  /**
   * Auto-resolve old false positive patterns
   */
  async autoResolveOldAlerts(daysOld: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await FraudAlert.updateMany(
      {
        status: FraudAlertStatus.OPEN,
        createdAt: { $lt: cutoff },
        severity: FraudAlertSeverity.LOW
      },
      {
        $set: {
          status: FraudAlertStatus.RESOLVED,
          resolution: 'Auto-resolved: Old low-severity alert',
          resolvedAt: new Date()
        }
      }
    );

    return result.modifiedCount;
  }
}

export const fraudService = new FraudService();
