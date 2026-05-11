/**
 * Merchant Analytics Aggregation Worker
 *
 * BullMQ repeatable job that runs nightly at 2am UTC.
 * Aggregates per-merchant analytics and writes results to the
 * 'merchantanalytics' collection with { merchantId, date } as the key.
 *
 * Metrics computed:
 *   - Daily revenue (sum of storePayments where merchantId matches, grouped by date)
 *   - Customer visit frequency (count visits per customer per merchant per month)
 *   - Top products by revenue (from pos bills / items)
 *   - New vs returning customer ratio
 */

import { Queue, Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { bullmqRedis } from '../config/redis';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('merchant-aggregation-worker');

const SCHEDULER_QUEUE = 'merchant-aggregation-scheduler';

let _schedulerQueue: Queue | null = null;
let _worker: Worker | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function startOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function endOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

// ── Aggregation functions ─────────────────────────────────────────────────────

/**
 * Compute daily revenue for a merchant on a given date.
 * Reads from storePayments where { merchantId, status: 'success', createdAt: <range> }.
 */
async function computeDailyRevenue(
  merchantId: string,
  dateStr: string,
): Promise<number> {
  const StorePayments = mongoose.connection.collection('storepayments');
  const result = await StorePayments.aggregate([
    {
      $match: {
        merchantId,
        status: 'success',
        createdAt: { $gte: startOfDay(dateStr), $lte: endOfDay(dateStr) },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]).toArray();

  return result[0]?.total ?? 0;
}

/**
 * Count unique visitors for the current month and distinguish
 * new vs returning based on whether they had prior visits.
 */
async function computeVisitorStats(
  merchantId: string,
  dateStr: string,
): Promise<{
  uniqueVisitors: number;
  newCustomers: number;
  returningCustomers: number;
  visitFrequency: Array<{ userId: string; visits: number }>;
}> {
  const StoreVisits = mongoose.connection.collection('storevisits');

  const monthStart = dateStr.slice(0, 7) + '-01'; // YYYY-MM-01

  // All visits this month for this merchant
  const monthVisits = await StoreVisits.aggregate([
    {
      $match: {
        merchantId,
        createdAt: { $gte: startOfDay(monthStart), $lte: endOfDay(dateStr) },
      },
    },
    {
      $group: {
        _id: '$userId',
        visits: { $sum: 1 },
        firstVisitThisMonth: { $min: '$createdAt' },
      },
    },
  ]).toArray();

  // For each visitor, check if they had ANY visit before this month
  const userIds = monthVisits.map((v: any) => v._id);
  const priorVisitDocs = await StoreVisits.find(
    {
      merchantId,
      userId: { $in: userIds },
      createdAt: { $lt: startOfDay(monthStart) },
    },
    { projection: { userId: 1 } },
  ).toArray();

  const priorVisitorSet = new Set(priorVisitDocs.map((d: any) => String(d.userId)));

  let newCustomers = 0;
  let returningCustomers = 0;
  const visitFrequency: Array<{ userId: string; visits: number }> = [];

  for (const v of monthVisits as any[]) {
    const uid = String(v._id);
    visitFrequency.push({ userId: uid, visits: v.visits });
    if (priorVisitorSet.has(uid)) {
      returningCustomers++;
    } else {
      newCustomers++;
    }
  }

  return {
    uniqueVisitors: monthVisits.length,
    newCustomers,
    returningCustomers,
    visitFrequency,
  };
}

/**
 * Top products by revenue from pos bills for this merchant on this date.
 */
async function computeTopProducts(
  merchantId: string,
  dateStr: string,
  topN = 10,
): Promise<Array<{ productId: string; name: string; revenue: number; quantity: number }>> {
  const PosBills = mongoose.connection.collection('posbills');

  const result = await PosBills.aggregate([
    {
      $match: {
        merchantId,
        status: 'paid',
        createdAt: { $gte: startOfDay(dateStr), $lte: endOfDay(dateStr) },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: { productId: '$items.productId', name: '$items.name' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        quantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: topN },
    {
      $project: {
        _id: 0,
        productId: '$_id.productId',
        name: '$_id.name',
        revenue: 1,
        quantity: 1,
      },
    },
  ]).toArray();

  return result as Array<{ productId: string; name: string; revenue: number; quantity: number }>;
}

// ── Per-merchant aggregation ──────────────────────────────────────────────────

async function aggregateMerchant(merchantId: string, dateStr: string): Promise<void> {
  const [revenue, visitorStats, topProducts] = await Promise.all([
    computeDailyRevenue(merchantId, dateStr),
    computeVisitorStats(merchantId, dateStr),
    computeTopProducts(merchantId, dateStr),
  ]);

  const MerchantAnalytics = mongoose.connection.collection('merchantanalytics');

  await MerchantAnalytics.updateOne(
    { merchantId, date: dateStr },
    {
      $set: {
        merchantId,
        date: dateStr,
        revenue,
        uniqueVisitors: visitorStats.uniqueVisitors,
        newCustomers: visitorStats.newCustomers,
        returningCustomers: visitorStats.returningCustomers,
        newVsReturningRatio:
          visitorStats.uniqueVisitors > 0
            ? visitorStats.newCustomers / visitorStats.uniqueVisitors
            : 0,
        topProducts,
        visitFrequency: visitorStats.visitFrequency.slice(0, 100), // store top-100 by visits
        computedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

// ── Full nightly aggregation run ─────────────────────────────────────────────

async function runNightlyAggregation(): Promise<{ merchants: number; date: string }> {
  // Aggregate for YESTERDAY: the job runs at 2am UTC, so the previous calendar day
  // is now complete. Using new Date() (today) would miss orders placed after midnight.
  const dateStr = toDateString(new Date(Date.now() - 86_400_000));

  // Get all active merchants
  const Stores = mongoose.connection.collection('stores');
  const merchantDocs = await Stores.distinct('merchantId', { isActive: true });

  if (merchantDocs.length === 0) {
    logger.info('[MerchantAgg] No active merchants found');
    return { merchants: 0, date: dateStr };
  }

  logger.info(`[MerchantAgg] Aggregating ${merchantDocs.length} merchants for ${dateStr}`);

  // Process in batches of 10 concurrently
  const BATCH = 10;
  let processed = 0;

  for (let i = 0; i < merchantDocs.length; i += BATCH) {
    const batch = merchantDocs.slice(i, i + BATCH) as string[];
    await Promise.allSettled(
      batch.map(async (merchantId) => {
        try {
          await aggregateMerchant(String(merchantId), dateStr);
          processed++;
        } catch (err: any) {
          logger.warn(`[MerchantAgg] Failed for merchant ${merchantId}`, { error: err.message });
        }
      }),
    );
  }

  logger.info(`[MerchantAgg] Completed: ${processed}/${merchantDocs.length} merchants aggregated`);
  return { merchants: processed, date: dateStr };
}

// ── Start the scheduler ───────────────────────────────────────────────────────

export async function startMerchantAggregationScheduler(): Promise<void> {
  const schedulerQueue = new Queue(SCHEDULER_QUEUE, { connection: bullmqRedis });
  // Assign to module-level ref so stopMerchantAggregationScheduler can close it on shutdown
  _schedulerQueue = schedulerQueue;

  // Register the repeatable job at 2am UTC nightly
  await schedulerQueue.upsertJobScheduler(
    'merchant-aggregation-nightly',
    { pattern: '0 2 * * *' }, // 2am UTC every day
    {
      name: 'merchant_aggregation_run',
      data: {},
      opts: { attempts: 2, backoff: { type: 'exponential', delay: 30_000 } },
    },
  );

  logger.info('[MerchantAgg] Repeatable job registered — cron: 0 2 * * *');

  _worker = new Worker(
    SCHEDULER_QUEUE,
    async (_job: Job) => {
      logger.info('[MerchantAgg] Nightly aggregation triggered');
      const result = await runNightlyAggregation();
      return result;
    },
    {
      connection: bullmqRedis,
      concurrency: 1,
      // C-28 FIX: Job timeout enforcement - prevent stuck jobs
      lockDuration: 30000, // 30 second lock
      lockRenewTime: 5000, // Renew lock every 5 seconds
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 2, // Fail job after 2 stalled attempts
    },
  );

  _worker.on('completed', (job, result) => {
    logger.info('[MerchantAgg] Nightly run completed', { result });
  });

  _worker.on('failed', (job, err) => {
    logger.error('[MerchantAgg] Nightly run failed', { error: err.message });
  });

  _worker.on('error', (err) => {
    logger.error('[MerchantAgg] Worker error', { error: err.message });
  });

  // C-28 FIX: Stuck job detection and recovery
  _worker.on('stalled', (jobId: string) => {
    logger.warn('[MerchantAgg] Job stalled (lock expired without renewal)', { jobId });
  });

  logger.info('[MerchantAgg] Scheduler started');
}

export async function stopMerchantAggregationScheduler(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
  if (_schedulerQueue) {
    await _schedulerQueue.close();
    _schedulerQueue = null;
  }
}
