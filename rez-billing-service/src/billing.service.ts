import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { BillingRecord, BillingEvent, IBillingRecord, IBillingEvent, BillingModel, BillingStatus } from './models';
import { walletService } from './wallet.service';
import { fraudService } from './fraud.service';
import { redis } from './config/redis';
import { logger } from './config/logger';
import { billingQueue } from './queues/billing.queue';

export interface BillingEventInput {
  campaignId: string;
  merchantId: string;
  billingModel: BillingModel;
  amount: number;
  currency?: string;
  eventType: string;
  clickId?: string;
  impressionId?: string;
  conversionId?: string;
  metadata?: Record<string, unknown>;
}

export interface BillingResult {
  success: boolean;
  billingRecordId?: string;
  transactionId?: string;
  amount?: number;
  error?: string;
}

export interface CampaignBillingSummary {
  campaignId: string;
  merchantId: string;
  billingModel: BillingModel;
  totalAmount: number;
  eventCount: number;
  currency: string;
  period: {
    start: Date;
    end: Date;
  };
  dailyBreakdown: {
    date: string;
    count: number;
    amount: number;
  }[];
}

class BillingService {
  private readonly CACHE_TTL = 60; // 1 minute
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  /**
   * Process a single billing event
   */
  async processEvent(event: BillingEventInput): Promise<BillingResult> {
    try {
      // Validate input
      if (event.amount <= 0) {
        return { success: false, error: 'Amount must be positive' };
      }

      // Check for fraud before processing
      const fraudCheck = await fraudService.checkEvent(event);
      if (fraudCheck.isFraudulent) {
        logger.warn(`Fraudulent billing event detected for merchant ${event.merchantId}`, {
          campaignId: event.campaignId,
          reason: fraudCheck.reason
        });

        // Create a fraud alert
        await fraudService.createAlert({
          merchantId: event.merchantId,
          type: 'suspicious_billing',
          severity: fraudCheck.severity,
          description: fraudCheck.reason || 'Suspicious billing activity detected',
          evidence: { event },
          affectedTransactions: []
        });

        return { success: false, error: 'Event flagged for review' };
      }

      // Add to processing queue for batch processing
      await billingQueue.add('processEvent', event, {
        jobId: uuidv4(),
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      });

      // Also process immediately for low-value events
      if (event.amount < 1) {
        return await this.processEventImmediate(event);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error processing billing event:', error);
      return { success: false, error: 'Internal error processing event' };
    }
  }

  /**
   * Process event immediately (for small amounts)
   */
  private async processEventImmediate(event: BillingEventInput): Promise<BillingResult> {
    const eventId = uuidv4();
    const currency = event.currency || 'USD';

    try {
      // Get or create billing record for the day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let billingRecord = await BillingRecord.findOne({
        merchantId: event.merchantId,
        campaignId: event.campaignId,
        billingModel: event.billingModel,
        startDate: { $lte: today },
        endDate: { $gte: today },
        status: BillingStatus.PENDING
      });

      if (!billingRecord) {
        billingRecord = new BillingRecord({
          merchantId: event.merchantId,
          campaignId: event.campaignId,
          billingModel: event.billingModel,
          totalAmount: 0,
          currency,
          eventCount: 0,
          startDate: today,
          endDate: tomorrow,
          status: BillingStatus.PENDING,
          events: []
        });
      }

      // Add event to record
      const billingEvent: IBillingEvent = {
        eventId,
        campaignId: event.campaignId,
        merchantId: event.merchantId,
        billingModel: event.billingModel,
        amount: event.amount,
        currency,
        eventType: event.eventType,
        timestamp: new Date(),
        metadata: {
          clickId: event.clickId,
          impressionId: event.impressionId,
          conversionId: event.conversionId,
          ...event.metadata
        }
      };

      billingRecord.events.push(billingEvent);
      billingRecord.totalAmount = new Decimal(billingRecord.totalAmount).plus(event.amount).toNumber();
      billingRecord.eventCount += 1;

      await billingRecord.save();

      // Deduct from wallet
      const deduction = await walletService.deduct(
        event.merchantId,
        event.amount,
        eventId,
        `Billing: ${event.billingModel} - ${event.eventType}`,
        { billingRecordId: billingRecord._id.toString(), eventId }
      );

      if (!deduction.success) {
        // Mark record as failed
        billingRecord.status = BillingStatus.FAILED;
        await billingRecord.save();
        return { success: false, error: deduction.error };
      }

      logger.info(`Processed billing event ${eventId}: ${event.billingModel} ${event.amount} ${currency}`);

      return {
        success: true,
        billingRecordId: billingRecord._id.toString(),
        transactionId: deduction.transactionId,
        amount: event.amount
      };
    } catch (error) {
      logger.error(`Error in immediate event processing:`, error);
      return { success: false, error: 'Internal error' };
    }
  }

  /**
   * Batch process multiple billing events
   */
  async processBatch(events: BillingEventInput[]): Promise<BillingResult[]> {
    const results: BillingResult[] = [];

    // Group events by merchant for efficient processing
    const eventsByMerchant = new Map<string, BillingEventInput[]>();
    for (const event of events) {
      const existing = eventsByMerchant.get(event.merchantId) || [];
      existing.push(event);
      eventsByMerchant.set(event.merchantId, existing);
    }

    // Process each merchant's events
    for (const [merchantId, merchantEvents] of eventsByMerchant) {
      const merchantResult = await this.processMerchantBatch(merchantId, merchantEvents);
      results.push(...merchantResult);
    }

    return results;
  }

  /**
   * Process batch of events for a single merchant
   */
  private async processMerchantBatch(merchantId: string, events: BillingEventInput[]): Promise<BillingResult[]> {
    const results: BillingResult[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Group by campaign and billing model
    const grouped = new Map<string, BillingEventInput[]>();
    for (const event of events) {
      const key = `${event.campaignId}:${event.billingModel}`;
      const existing = grouped.get(key) || [];
      existing.push(event);
      grouped.set(key, existing);
    }

    for (const [key, groupEvents] of grouped) {
      const [campaignId, billingModel] = key.split(':');

      try {
        // Get or create billing record
        let billingRecord = await BillingRecord.findOne({
          merchantId,
          campaignId,
          billingModel: billingModel as BillingModel,
          startDate: { $lte: today },
          endDate: { $gte: today },
          status: BillingStatus.PENDING
        });

        if (!billingRecord) {
          billingRecord = new BillingRecord({
            merchantId,
            campaignId,
            billingModel: billingModel as BillingModel,
            totalAmount: 0,
            currency: 'USD',
            eventCount: 0,
            startDate: today,
            endDate: tomorrow,
            status: BillingStatus.PENDING,
            events: []
          });
        }

        const billingEvents: IBillingEvent[] = [];
        let totalAmount = new Decimal(0);

        for (const event of groupEvents) {
          const eventId = uuidv4();
          const billingEvent: IBillingEvent = {
            eventId,
            campaignId: event.campaignId,
            merchantId: event.merchantId,
            billingModel: event.billingModel,
            amount: event.amount,
            currency: event.currency || 'USD',
            eventType: event.eventType,
            timestamp: new Date(),
            metadata: {
              clickId: event.clickId,
              impressionId: event.impressionId,
              conversionId: event.conversionId,
              ...event.metadata
            }
          };

          billingEvents.push(billingEvent);
          totalAmount = totalAmount.plus(event.amount);

          results.push({ success: true, amount: event.amount });
        }

        billingRecord.events.push(...billingEvents);
        billingRecord.totalAmount = new Decimal(billingRecord.totalAmount).plus(totalAmount).toNumber();
        billingRecord.eventCount += billingEvents.length;

        await billingRecord.save();

        // Single deduction for the batch
        const deduction = await walletService.deduct(
          merchantId,
          totalAmount.toNumber(),
          `BATCH:${billingRecord._id}`,
          `Batch billing: ${billingEvents.length} events`,
          { billingRecordId: billingRecord._id.toString(), eventCount: billingEvents.length }
        );

        if (!deduction.success) {
          logger.error(`Batch deduction failed for merchant ${merchantId}:`, deduction.error);
        }
      } catch (error) {
        logger.error(`Error processing batch for ${key}:`, error);
        for (const event of groupEvents) {
          results.push({ success: false, error: 'Batch processing error' });
        }
      }
    }

    return results;
  }

  /**
   * Get billing summary for a campaign
   */
  async getCampaignBillingSummary(
    campaignId: string,
    merchantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CampaignBillingSummary | null> {
    const query: Record<string, unknown> = { campaignId, merchantId };
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) (query.startDate as Record<string, Date>).$gte = startDate;
      if (endDate) (query.startDate as Record<string, Date>).$lte = endDate;
    }

    const records = await BillingRecord.find(query).sort({ startDate: 1 });

    if (records.length === 0) {
      return null;
    }

    // Aggregate data
    let totalAmount = new Decimal(0);
    let eventCount = 0;
    const dailyMap = new Map<string, { count: number; amount: number }>();

    for (const record of records) {
      totalAmount = totalAmount.plus(record.totalAmount);
      eventCount += record.eventCount;

      for (const event of record.events) {
        const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || { count: 0, amount: 0 };
        existing.count += 1;
        existing.amount = new Decimal(existing.amount).plus(event.amount).toNumber();
        dailyMap.set(dateKey, existing);
      }
    }

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      campaignId,
      merchantId,
      billingModel: records[0].billingModel,
      totalAmount: totalAmount.toNumber(),
      eventCount,
      currency: records[0].currency,
      period: {
        start: records[0].startDate,
        end: records[records.length - 1].endDate
      },
      dailyBreakdown
    };
  }

  /**
   * Get billing records for a merchant
   */
  async getMerchantBillingRecords(
    merchantId: string,
    options: { page?: number; limit?: number; campaignId?: string; billingModel?: BillingModel; status?: BillingStatus }
  ): Promise<{ records: IBillingRecord[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { merchantId };
    if (options.campaignId) query.campaignId = options.campaignId;
    if (options.billingModel) query.billingModel = options.billingModel;
    if (options.status) query.status = options.status;

    const [records, total] = await Promise.all([
      BillingRecord.find(query).sort({ startDate: -1 }).skip(skip).limit(limit),
      BillingRecord.countDocuments(query)
    ]);

    return {
      records,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Refund a billing event
   */
  async refundBillingEvent(
    merchantId: string,
    billingRecordId: string,
    eventId: string,
    reason?: string
  ): Promise<BillingResult> {
    try {
      const billingRecord = await BillingRecord.findOne({
        _id: billingRecordId,
        merchantId
      });

      if (!billingRecord) {
        return { success: false, error: 'Billing record not found' };
      }

      const eventIndex = billingRecord.events.findIndex(e => e.eventId === eventId);
      if (eventIndex === -1) {
        return { success: false, error: 'Event not found in billing record' };
      }

      const event = billingRecord.events[eventIndex];

      if (billingRecord.status === BillingStatus.REFUNDED) {
        return { success: false, error: 'Billing record already refunded' };
      }

      // Credit the wallet
      const credit = await walletService.topUp(
        merchantId,
        event.amount,
        `REFUND:${eventId}`,
        `Refund: ${reason || 'No reason provided'}`
      );

      if (!credit.success) {
        return { success: false, error: credit.error };
      }

      // Mark event as refunded (remove from active events)
      billingRecord.events.splice(eventIndex, 1);
      billingRecord.totalAmount = new Decimal(billingRecord.totalAmount).minus(event.amount).toNumber();
      billingRecord.eventCount -= 1;

      if (billingRecord.events.length === 0) {
        billingRecord.status = BillingStatus.REFUNDED;
      }

      await billingRecord.save();

      logger.info(`Refunded billing event ${eventId} for merchant ${merchantId}: ${event.amount}`);

      return {
        success: true,
        billingRecordId,
        transactionId: credit.transactionId,
        amount: event.amount
      };
    } catch (error) {
      logger.error(`Error refunding billing event:`, error);
      return { success: false, error: 'Internal error during refund' };
    }
  }

  /**
   * Finalize billing for a period (close pending records)
   */
  async finalizeBillingPeriod(merchantId: string, endDate: Date): Promise<number> {
    const startOfDay = new Date(endDate);
    startOfDay.setHours(0, 0, 0, 0);

    const result = await BillingRecord.updateMany(
      {
        merchantId,
        endDate: { $lte: endDate },
        status: BillingStatus.PENDING
      },
      {
        $set: { status: BillingStatus.COMPLETED }
      }
    );

    logger.info(`Finalized ${result.modifiedCount} billing records for merchant ${merchantId}`);

    return result.modifiedCount;
  }

  /**
   * Get billing analytics for a merchant
   */
  async getBillingAnalytics(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSpent: number;
    byModel: Record<BillingModel, { count: number; amount: number }>;
    byCampaign: Record<string, { count: number; amount: number }>;
    dailyTrend: { date: string; amount: number }[];
  }> {
    const records = await BillingRecord.find({
      merchantId,
      startDate: { $gte: startDate },
      endDate: { $lte: endDate }
    });

    const byModel: Record<BillingModel, { count: number; amount: number }> = {
      [BillingModel.CPC]: { count: 0, amount: 0 },
      [BillingModel.CPA]: { count: 0, amount: 0 },
      [BillingModel.CPM]: { count: 0, amount: 0 }
    };

    const byCampaign: Record<string, { count: number; amount: number }> = {};
    const dailyMap = new Map<string, Decimal>();

    let totalSpent = new Decimal(0);

    for (const record of records) {
      totalSpent = totalSpent.plus(record.totalAmount);

      byModel[record.billingModel].count += record.eventCount;
      byModel[record.billingModel].amount = new Decimal(byModel[record.billingModel].amount)
        .plus(record.totalAmount).toNumber();

      if (!byCampaign[record.campaignId]) {
        byCampaign[record.campaignId] = { count: 0, amount: 0 };
      }
      byCampaign[record.campaignId].count += record.eventCount;
      byCampaign[record.campaignId].amount = new Decimal(byCampaign[record.campaignId].amount)
        .plus(record.totalAmount).toNumber();

      for (const event of record.events) {
        const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || new Decimal(0);
        dailyMap.set(dateKey, existing.plus(event.amount));
      }
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount: amount.toNumber() }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSpent: totalSpent.toNumber(),
      byModel,
      byCampaign,
      dailyTrend
    };
  }
}

export const billingService = new BillingService();
