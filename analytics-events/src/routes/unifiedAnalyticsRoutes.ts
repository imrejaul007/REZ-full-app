/**
 * Unified Analytics Routes
 *
 * Combined analytics from:
 * - merchantanalytics (revenue, visitors, products)
 * - growth_events (ads, marketing, conversions)
 * - appevents (raw events)
 *
 * GET /api/analytics/unified/:merchantId?period=30d
 * Returns combined metrics for a merchant
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

function parsePeriodDays(period: string): number {
  const match = period.match(/^(\d+)d$/);
  if (match) return Math.min(Math.max(parseInt(match[1], 10), 1), 365);
  if (period === '1m') return 30;
  if (period === '3m') return 90;
  if (period === '1y') return 365;
  return 30;
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function dateRange(days: number): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(Date.now() - (days - 1) * 86_400_000);
  return { from, to };
}

/**
 * GET /api/analytics/unified/:merchantId
 * Returns unified analytics combining all event sources
 */
router.get('/unified/:merchantId', async (req: Request, res: Response) => {
  const { merchantId } = req.params;
  const periodStr = (req.query.period as string) || '30d';
  const days = parsePeriodDays(periodStr);
  const { from, to } = dateRange(days);

  if (!merchantId) {
    return res.status(400).json({ success: false, error: 'merchantId required' });
  }

  try {
    // Fetch all data in parallel
    const [
      merchantAnalytics,
      growthEvents,
      adImpressions,
      adClicks,
      conversions,
      notifications,
    ] = await Promise.all([
      // Merchant analytics (revenue, visitors)
      mongoose.connection.collection('merchantanalytics').find({
        merchantId,
        date: { $gte: toDateString(from), $lte: toDateString(to) },
      }).toArray(),

      // Growth events summary
      mongoose.connection.collection('growth_events').aggregate([
        {
          $match: {
            merchantId: new mongoose.Types.ObjectId(merchantId),
            timestamp: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' },
          },
        },
      ]).toArray(),

      // Ad impressions count
      mongoose.connection.collection('appevents').countDocuments({
        'properties.merchantId': merchantId,
        'properties.campaignId': { $exists: true, $ne: null },
        name: 'ad.impression',
        timestamp: { $gte: from, $lte: to },
      }),

      // Ad clicks count
      mongoose.connection.collection('appevents').countDocuments({
        'properties.merchantId': merchantId,
        'properties.campaignId': { $exists: true, $ne: null },
        name: 'ad.click',
        timestamp: { $gte: from, $to: to },
      }),

      // Conversions from ads
      mongoose.connection.collection('appevents').countDocuments({
        'properties.merchantId': merchantId,
        name: 'conversion',
        timestamp: { $gte: from, $lte: to },
      }),

      // Notification stats
      mongoose.connection.collection('appevents').aggregate([
        {
          $match: {
            'properties.merchantId': merchantId,
            name: { $in: ['notification.sent', 'notification.opened'] },
            timestamp: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: '$name',
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
    ]);

    // Aggregate merchant analytics
    let totalRevenue = 0;
    let totalVisitors = 0;
    let newCustomers = 0;
    let returningCustomers = 0;

    for (const doc of merchantAnalytics as any[]) {
      totalRevenue += doc.revenue || 0;
      totalVisitors += doc.uniqueVisitors || 0;
      newCustomers += doc.newCustomers || 0;
      returningCustomers += doc.returningCustomers || 0;
    }

    // Aggregate growth events
    const growthMetrics: Record<string, { count: number; value: number }> = {};
    for (const event of growthEvents as any[]) {
      growthMetrics[event._id] = {
        count: event.count,
        value: event.totalValue || 0,
      };
    }

    // Calculate rates
    const ctr = adImpressions > 0 ? (adClicks / adImpressions) * 100 : 0;
    const conversionRate = adClicks > 0 ? (conversions / adClicks) * 100 : 0;
    const notificationOpenRate = (() => {
      const sent = notifications.find((n: any) => n._id === 'notification.sent')?.count || 0;
      const opened = notifications.find((n: any) => n._id === 'notification.opened')?.count || 0;
      return sent > 0 ? (opened / sent) * 100 : 0;
    })();

    res.json({
      success: true,
      data: {
        merchantId,
        period: periodStr,
        summary: {
          revenue: totalRevenue,
          visitors: totalVisitors,
          newCustomers,
          returningCustomers,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
        ads: {
          impressions: adImpressions,
          clicks: adClicks,
          conversions,
          ctr: Math.round(ctr * 100) / 100,
        },
        marketing: {
          notificationsSent: growthMetrics['notification_sent']?.count || 0,
          notificationsOpened: growthMetrics['notification_opened']?.count || 0,
          notificationOpenRate: Math.round(notificationOpenRate * 100) / 100,
          vouchersIssued: growthMetrics['voucher_issued']?.count || 0,
        },
        campaigns: {
          created: growthMetrics['campaign_created']?.count || 0,
          adSpend: growthMetrics['ad_impression']?.count || 0,
        },
        events: {
          adImpressions: growthMetrics['ad_impression']?.count || 0,
          adClicks: growthMetrics['ad_click']?.count || 0,
          conversions: growthMetrics['conversion']?.count || 0,
          totalValue: Object.values(growthMetrics).reduce((sum, m) => sum + m.value, 0),
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/analytics/unified/platform
 * Returns platform-wide unified analytics
 */
router.get('/unified/platform', async (req: Request, res: Response) => {
  const periodStr = (req.query.period as string) || '30d';
  const days = parsePeriodDays(periodStr);
  const { from, to } = dateRange(days);

  try {
    const [totalRevenue, totalVisitors, eventCounts] = await Promise.all([
      // Total revenue from merchantanalytics
      mongoose.connection.collection('merchantanalytics').aggregate([
        { $match: { date: { $gte: toDateString(from), $lte: toDateString(to) } } },
        { $group: { _id: null, total: { $sum: '$revenue' } } },
      ]).toArray(),

      // Total visitors
      mongoose.connection.collection('merchantanalytics').aggregate([
        { $match: { date: { $gte: toDateString(from), $lte: toDateString(to) } } },
        { $group: { _id: null, total: { $sum: '$uniqueVisitors' } } },
      ]).toArray(),

      // All event counts
      mongoose.connection.collection('growth_events').aggregate([
        { $match: { timestamp: { $gte: from, $lte: to } } },
        { $group: { _id: '$eventType', count: { $sum: 1 }, value: { $sum: '$value' } } },
      ]).toArray(),
    ]);

    const events: Record<string, { count: number; value: number }> = {};
    for (const e of eventCounts as any[]) {
      events[e._id] = { count: e.count, value: e.value || 0 };
    }

    res.json({
      success: true,
      data: {
        period: periodStr,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalVisitors: totalVisitors[0]?.total || 0,
        events,
        totalValue: Object.values(events).reduce((sum, e) => sum + e.value, 0),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export function createUnifiedAnalyticsRouter(): Router {
  return router;
}
