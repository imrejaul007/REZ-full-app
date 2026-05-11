/**
 * Merchant Analytics HTTP Routes
 *
 * GET /api/analytics/merchant/:merchantId/summary?period=30d
 *
 * Returns aggregated analytics for a merchant over the requested period.
 * Reads from the 'merchantanalytics' collection written by the nightly job.
 *
 * Response shape:
 *   {
 *     merchantId: string,
 *     period: string,
 *     revenue: number,
 *     visitors: number,
 *     topProducts: Array<{ productId, name, revenue, quantity }>,
 *     newVsReturning: { new: number, returning: number, ratio: number },
 *     days: Array<{ date, revenue, visitors }>
 *   }
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

// ── Period parser ─────────────────────────────────────────────────────────────

function parsePeriodDays(period: string): number {
  const match = period.match(/^(\d+)d$/);
  if (match) return Math.min(Math.max(parseInt(match[1], 10), 1), 365);
  if (period === '1m') return 30;
  if (period === '3m') return 90;
  if (period === '1y') return 365;
  return 30; // default
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function dateRange(days: number): { from: string; to: string } {
  const to   = toDateString(new Date());
  const from = toDateString(new Date(Date.now() - (days - 1) * 86_400_000));
  return { from, to };
}

// ── Route handler ─────────────────────────────────────────────────────────────

async function getMerchantSummary(req: Request, res: Response): Promise<void> {
  const { merchantId } = req.params;
  const periodStr = (req.query.period as string) || '30d';

  if (!merchantId || typeof merchantId !== 'string') {
    res.status(400).json({ success: false, error: 'merchantId is required' });
    return;
  }

  const days          = parsePeriodDays(periodStr);
  const { from, to }  = dateRange(days);

  try {
    const MerchantAnalytics = mongoose.connection.collection('merchantanalytics');

    const docs = await MerchantAnalytics.find(
      { merchantId, date: { $gte: from, $lte: to } },
      { sort: { date: 1 } },
    ).toArray();

    // Aggregate across the date range
    let totalRevenue         = 0;
    let totalVisitors        = 0;
    let totalNew             = 0;
    let totalReturning       = 0;
    const productMap         = new Map<string, { name: string; revenue: number; quantity: number }>();
    const days_arr: Array<{ date: string; revenue: number; visitors: number }> = [];

    for (const doc of docs as any[]) {
      totalRevenue   += doc.revenue   ?? 0;
      totalVisitors  += doc.uniqueVisitors ?? 0;
      totalNew       += doc.newCustomers   ?? 0;
      totalReturning += doc.returningCustomers ?? 0;

      days_arr.push({
        date: doc.date,
        revenue:  doc.revenue ?? 0,
        visitors: doc.uniqueVisitors ?? 0,
      });

      // Merge top products
      for (const p of (doc.topProducts || []) as any[]) {
        const pid = String(p.productId ?? p.name);
        const existing = productMap.get(pid);
        if (existing) {
          existing.revenue  += p.revenue  ?? 0;
          existing.quantity += p.quantity ?? 0;
        } else {
          productMap.set(pid, {
            name:     p.name     ?? pid,
            revenue:  p.revenue  ?? 0,
            quantity: p.quantity ?? 0,
          });
        }
      }
    }

    // Sort and cap top products
    const topProducts = Array.from(productMap.entries())
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        merchantId,
        period: periodStr,
        revenue:   totalRevenue,
        visitors:  totalVisitors,
        topProducts,
        newVsReturning: {
          new:       totalNew,
          returning: totalReturning,
          ratio:     totalVisitors > 0 ? totalNew / totalVisitors : 0,
        },
        days: days_arr,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── Platform summary handler ──────────────────────────────────────────────────

async function getPlatformSummary(req: Request, res: Response): Promise<void> {
  const periodStr = (req.query.period as string) || '30d';

  const days         = parsePeriodDays(periodStr);
  const { from, to } = dateRange(days);

  try {
    const MerchantAnalytics = mongoose.connection.collection('merchantanalytics');

    const docs = await MerchantAnalytics.find(
      { date: { $gte: from, $lte: to } },
      { sort: { date: 1 } },
    ).toArray();

    // Aggregate across all merchants
    let totalRevenue   = 0;
    let totalVisitors  = 0;
    let totalNew       = 0;
    let totalReturning = 0;

    // Per-merchant revenue map for top merchants
    const merchantRevenue = new Map<string, number>();
    // Per-day totals for revenue trend
    const dayMap = new Map<string, { revenue: number; visitors: number }>();

    for (const doc of docs as any[]) {
      const mId = String(doc.merchantId ?? '');
      totalRevenue   += doc.revenue          ?? 0;
      totalVisitors  += doc.uniqueVisitors   ?? 0;
      totalNew       += doc.newCustomers     ?? 0;
      totalReturning += doc.returningCustomers ?? 0;

      merchantRevenue.set(mId, (merchantRevenue.get(mId) ?? 0) + (doc.revenue ?? 0));

      const existing = dayMap.get(doc.date);
      if (existing) {
        existing.revenue  += doc.revenue        ?? 0;
        existing.visitors += doc.uniqueVisitors  ?? 0;
      } else {
        dayMap.set(doc.date, { revenue: doc.revenue ?? 0, visitors: doc.uniqueVisitors ?? 0 });
      }
    }

    const topMerchants = Array.from(merchantRevenue.entries())
      .map(([merchantId, revenue]) => ({ merchantId, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const days_arr = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    res.json({
      success: true,
      data: {
        period: periodStr,
        revenue:   totalRevenue,
        visitors:  totalVisitors,
        topMerchants,
        newVsReturning: {
          new:       totalNew,
          returning: totalReturning,
          ratio:     totalVisitors > 0 ? totalNew / totalVisitors : 0,
        },
        days: days_arr,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── Merchant coin-transaction summary (live aggregation) ─────────────────────
// Aggregates from 'cointransactions' collection, not the nightly rollup.
// Cached in-memory for 5 minutes per merchantId:days key.

interface CoinSummaryCache {
  expiresAt: number;
  data: MerchantCoinSummary;
}

interface StoreStats {
  storeId: string;
  storeName: string;
  transactionCount: number;
  totalCoins: number;
}

interface MerchantCoinSummary {
  merchantId: string;
  periodDays: number;
  totalTransactions: number;
  totalCoinsPaid: number;
  topStores: StoreStats[];
}

const coinSummaryCache = new Map<string, CoinSummaryCache>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getMerchantCoinSummary(req: Request, res: Response): Promise<void> {
  const { merchantId } = req.params;

  if (!merchantId || !mongoose.isValidObjectId(merchantId)) {
    res.status(400).json({ success: false, error: 'merchantId must be a valid ObjectId' });
    return;
  }

  const rawDays = parseInt((req.query.days as string) || '30', 10);
  const periodDays = Math.min(90, Math.max(1, isNaN(rawDays) ? 30 : rawDays));

  const cacheKey = `${merchantId}:${periodDays}`;
  const cached = coinSummaryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.json({ success: true, data: cached.data });
    return;
  }

  try {
    const since = new Date(Date.now() - periodDays * 86_400_000);
    const merchantObjectId = new mongoose.Types.ObjectId(merchantId);

    const collection = mongoose.connection.collection('cointransactions');

    const pipeline = [
      {
        $match: {
          merchantId: merchantObjectId,
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$storeId',
          storeName: { $first: '$storeName' },
          transactionCount: { $sum: 1 },
          totalCoins: { $sum: '$amount' },
        },
      },
      { $sort: { totalCoins: -1 as const } },
      { $limit: 10 },
    ];

    const storeGroups = await collection.aggregate(pipeline).toArray();

    let totalTransactions = 0;
    let totalCoinsPaid = 0;
    const topStores: StoreStats[] = [];

    for (const g of storeGroups as any[]) {
      totalTransactions += g.transactionCount ?? 0;
      totalCoinsPaid    += g.totalCoins       ?? 0;
      topStores.push({
        storeId:          String(g._id ?? ''),
        storeName:        String(g.storeName ?? ''),
        transactionCount: g.transactionCount ?? 0,
        totalCoins:       g.totalCoins       ?? 0,
      });
    }

    const summary: MerchantCoinSummary = {
      merchantId,
      periodDays,
      totalTransactions,
      totalCoinsPaid,
      topStores,
    };

    coinSummaryCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: summary });

    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── Router factory ────────────────────────────────────────────────────────────

export function createMerchantAnalyticsRouter(): Router {
  const router = Router();

  router.get('/merchant/:merchantId/summary', getMerchantSummary);
  router.get('/merchant/:merchantId/coin-summary', getMerchantCoinSummary);
  router.get('/platform/summary', getPlatformSummary);

  return router;
}
