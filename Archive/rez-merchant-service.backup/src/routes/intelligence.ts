import { Router, Request, Response } from 'express';
import { StorePayment } from '../models/StorePayment';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// MEDIUM FIX: All aggregation pipelines must specify maxTimeMS to prevent runaway queries.
const AGG_OPTIONS = { maxTimeMS: 30000 };

// Helper: validate storeId and verify merchant ownership
async function validateAndGetStoreId(
  storeId: unknown,
  merchantId: string,
): Promise<mongoose.Types.ObjectId | null> {
  if (!storeId || typeof storeId !== 'string' || !mongoose.Types.ObjectId.isValid(storeId)) {
    return null;
  }
  const store = await Store.findOne({
    _id: new mongoose.Types.ObjectId(storeId),
    merchantId: new mongoose.Types.ObjectId(merchantId),
  }).select('_id').lean();
  return store ? store._id as mongoose.Types.ObjectId : null;
}

router.get('/insights', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ success: false, message: 'storeId required' }); return;
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [revenue, peakHours] = await Promise.all([
      StorePayment.aggregate([
        { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$billAmount' }, avg: { $avg: '$billAmount' }, count: { $sum: 1 } } },
      ], AGG_OPTIONS),
      StorePayment.aggregate([
        { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ], AGG_OPTIONS),
    ]);
    res.json({ success: true, data: { revenue: revenue[0] || { total: 0, avg: 0, count: 0 }, peakHours: peakHours.map(h => ({ hour: h._id, orders: h.count })) } });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

const ACTIVE_STATUSES = [
  'placed', 'confirmed', 'preparing', 'ready',
  'dispatched', 'out_for_delivery', 'delivered',
];

const HOUR_LABELS: Record<number, string> = {
  0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM',
  5: '5 AM', 6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM',
  10: '10 AM', 11: '11 AM', 12: '12 PM', 13: '1 PM', 14: '2 PM',
  15: '3 PM', 16: '4 PM', 17: '5 PM', 18: '6 PM', 19: '7 PM',
  20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM',
};

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GET /merchant/intelligence/empty-slots
 * Finds time slots (day-of-week + hour) with zero orders in the last 30 days.
 * FIX-17: Uses aggregation pipeline instead of Order.find() to prevent OOM.
 */
router.get('/empty-slots', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ success: false, message: 'storeId is required' }); return;
    }
    const storeObjId = await validateAndGetStoreId(storeId, req.merchantId!);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found or access denied' }); return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    // FIX-17: Use aggregation pipeline instead of Order.find() to avoid loading
    // all matching orders into Node.js heap (OOM prevention for high-volume merchants).
    const filledSlots = new Set<string>();
    const cursor = Order.aggregate([
      {
        $match: {
          store: storeObjId,
          status: { $nin: ['cancelled', 'refunded'] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $isoDayOfWeek: '$createdAt' },
            hour: { $hour: '$createdAt' },
          },
        },
      },
    ], AGG_OPTIONS);

    for await (const doc of cursor) {
      // Convert MongoDB isoDayOfWeek (1=Monday...7=Sunday) to JS getDay() (0=Sunday...6=Saturday)
      const jsDay = doc._id.dayOfWeek === 7 ? 0 : doc._id.dayOfWeek;
      filledSlots.add(`${jsDay}-${doc._id.hour}`);
    }

    // Check all day-hour combinations for business hours 6 AM - 10 PM
    const emptySlots: Array<{ day: string; dayOfWeek: number; hour: number; label: string }> = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 6; hour <= 22; hour++) {
        const key = `${day}-${hour}`;
        if (!filledSlots.has(key)) {
          emptySlots.push({ day: DAY_LABELS[day], dayOfWeek: day, hour, label: HOUR_LABELS[hour] });
        }
      }
    }

    let suggestion = '';
    if (emptySlots.length === 0) {
      suggestion = "Great news! You've had orders at every time slot this month. Consider expanding your hours or adding delivery.";
    } else if (emptySlots.length < 7) {
      suggestion = `You have ${emptySlots.length} time slot${emptySlots.length === 1 ? '' : 's'} with no orders this month. Try a flash deal to fill them.`;
    } else if (emptySlots.length < 21) {
      suggestion = `${emptySlots.length} time slots are empty this month. A targeted offer during slow hours could boost revenue by 15-20%.`;
    } else {
      suggestion = `${emptySlots.length} slots are empty — consider promotions, loyalty rewards, or reducing hours to save costs.`;
    }

    res.json({
      success: true,
      data: {
        suggestion,
        emptySlots: emptySlots.slice(0, 10),
        emptyCount: emptySlots.length,
        totalChecked: 7 * 17,
      },
    });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/intelligence/dead-hours
 * Finds hours of the day with below-average order volume in the last 30 days.
 */
router.get('/dead-hours', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ success: false, message: 'storeId is required' }); return;
    }
    const storeObjId = await validateAndGetStoreId(storeId, req.merchantId!);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found or access denied' }); return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const hourlyStats = await Order.aggregate([
      {
        $match: {
          store: storeObjId,
          status: { $in: ACTIVE_STATUSES },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totals.total' },
        },
      },
      { $sort: { count: -1 } },
    ], AGG_OPTIONS);

    if (hourlyStats.length === 0) {
      res.json({
        success: true,
        data: {
          suggestion: 'Not enough order data yet. Keep serving customers and check back in a few days.',
          deadHours: [],
        },
      });
      return;
    }

    const avgCount = hourlyStats.reduce((sum, h) => sum + h.count, 0) / hourlyStats.length;
    const deadHours = hourlyStats
      .filter(h => h.count < avgCount * 0.3)
      .map(h => ({
        hour: h._id,
        label: HOUR_LABELS[h._id] || `${h._id}:00`,
        count: h.count,
        revenue: h.totalRevenue,
      }));

    const peakHours = hourlyStats.slice(0, 3).map(h => ({
      hour: h._id,
      label: HOUR_LABELS[h._id] || `${h._id}:00`,
      count: h.count,
    }));

    let suggestion = '';
    if (deadHours.length === 0) {
      suggestion = 'Your busiest and slowest hours are performing well. Consider running loyalty rewards to maintain momentum.';
    } else {
      const slowLabels = deadHours.map(h => h.label).join(', ');
      suggestion = `${deadHours.length} slow hour${deadHours.length === 1 ? '' : 's'} detected (${slowLabels}). ` +
        `Run targeted promotions between ${deadHours[0]?.label} and ${deadHours[deadHours.length - 1]?.label} to boost revenue.`;
    }

    res.json({
      success: true,
      data: {
        suggestion,
        deadHours,
        peakHours,
        avgOrdersPerHour: Math.round(avgCount * 10) / 10,
      },
    });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/intelligence/action-center
 * Returns actionable items for the merchant.
 */
router.get('/action-center', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const query: Record<string, unknown> = { merchantId: req.merchantId };
    if (storeId) query['storeId'] = storeId;
    const actions: Array<{ id: string; type: string; priority: string; message: string; createdAt: Date }> = [];
    res.json({ success: true, data: { actions, count: actions.length } });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/intelligence/network-stats
 * Returns REZ-network attribution metrics for the past 30 days.
 */
router.get('/network-stats', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ success: false, message: 'storeId is required' }); return;
    }
    const storeObjId = await validateAndGetStoreId(storeId, req.merchantId!);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found or access denied' }); return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const coinRedemptionStats = await StorePayment.aggregate([
      {
        $match: {
          storeId: storeObjId,
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo },
          'coinRedemption.totalAmount': { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalVisits: { $sum: 1 },
          totalSpend: { $sum: '$billAmount' },
          coinsRedeemed: { $sum: '$coinRedemption.totalAmount' },
        },
      },
    ], AGG_OPTIONS);

    const totalCustomers = await StorePayment.distinct('userId', {
      storeId: storeObjId,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo },
    });

    const newCustomers = await StorePayment.aggregate([
      { $match: { storeId: storeObjId, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$userId', firstVisit: { $min: '$createdAt' } } },
      { $match: { firstVisit: { $gte: thirtyDaysAgo } } },
    ], AGG_OPTIONS);

    const networkCustomers = coinRedemptionStats.length;
    const totalUniqueCustomers = totalCustomers.length;
    const networkRevenue = coinRedemptionStats.reduce((s: number, c: any) => s + c.totalSpend, 0);

    res.json({
      success: true,
      data: {
        period: '30d',
        totalCustomers: totalUniqueCustomers,
        networkCustomers,
        newCustomers: newCustomers.length,
        networkRevenue: Math.round(networkRevenue),
        networkPct: totalUniqueCustomers > 0 ? Math.round((networkCustomers / totalUniqueCustomers) * 100) : 0,
        insight:
          networkCustomers > 0
            ? `${networkCustomers} customer${networkCustomers > 1 ? 's' : ''} came via REZ coins this month, spending \u20b9${Math.round(networkRevenue).toLocaleString('en-IN')}`
            : 'Start rewarding customers to grow your REZ network.',
      },
    });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
