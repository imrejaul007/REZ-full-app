// @ts-nocheck
import { Router } from 'express';
import {
  trackEvent,
  getStoreAnalytics,
  getPopularStores,
  getUserAnalytics,
  getAnalyticsDashboard,
  getSearchAnalytics,
  getCategoryAnalytics,
} from '../controllers/analyticsController';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validateQuery, validateParams, validateBody, commonSchemas } from '../middleware/validation';
import { generalLimiter, analyticsLimiter } from '../middleware/rateLimiter';
import { Joi } from '../middleware/validation';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { publishAnalyticsEvent } from '../events/analyticsQueue';
import * as crypto from 'crypto';

const router = Router();
router.use(generalLimiter);

// Shared validation schema for batch event ingestion
const batchEventsSchema = Joi.object({
  events: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().max(100),
        properties: Joi.object().unknown(true),
        timestamp: Joi.alternatives().try(Joi.number().integer(), Joi.date().iso()).allow(null),
        userId: Joi.string().max(50).allow(null, ''),
        sessionId: Joi.string().max(100).allow(null, ''),
        platform: Joi.string().max(20).allow(null, ''),
        appVersion: Joi.string().max(20).allow(null, ''),
      }),
    )
    .max(100)
    .required(),
  sessionId: Joi.string().max(100).allow(null, ''),
  userId: Joi.string().max(50).allow(null, ''),
});

// Shared handler for batch event ingestion
const handleBatchEvents = asyncHandler(async (req: any, res: any) => {
  const events = req.body?.events;
  if (!Array.isArray(events)) {
    return res.json({ success: true, message: 'No events to process', timestamp: new Date().toISOString() });
  }
  logger.info(`[Analytics] Received batch of ${events.length} events`);

  // Publish each event to the durable analytics queue.
  // Log errors instead of swallowing them silently
  const userId: string = req.user?._id?.toString() || req.body?.userId || 'anonymous';
  const now = new Date().toISOString();
  const failedEvents: string[] = [];

  setImmediate(() => {
    for (const evt of events) {
      const eventId = crypto.randomUUID();
      publishAnalyticsEvent({
        eventId,
        eventType: 'visit_event',
        userId: evt.userId || userId,
        data: {
          source: evt.platform || 'frontend',
          metadata: {
            name: evt.name,
            properties: evt.properties,
            sessionId: evt.sessionId || req.body?.sessionId,
            appVersion: evt.appVersion,
          },
        },
        sourceEventId: eventId,
        timestamp: evt.timestamp ? new Date(evt.timestamp).toISOString() : now,
      }).catch((err) => {
        logger.error('[Analytics] Failed to publish event', {
          eventId,
          eventName: evt.name,
          error: err?.message || 'Unknown error',
        });
        failedEvents.push(eventId);
      });
    }
  });

  if (failedEvents.length > 0) {
    logger.warn(`[Analytics] ${failedEvents.length} events failed to publish`);
  }

  res.json({ success: true, message: `Received ${events.length} events`, timestamp: new Date().toISOString() });
});

// Homepage view analytics — called by consumer app on homepage load
router.post(
  '/homepage',
  optionalAuth,
  validateBody(
    Joi.object({
      screenName: Joi.string().max(100).allow(null, ''),
      userId: Joi.string().max(50).allow(null, ''),
      metadata: Joi.object().unknown(true).allow(null),
    }),
  ),
  asyncHandler(async (req: any, res: any) => {
    const userId: string = req.user?._id?.toString() || req.body?.userId || 'anonymous';
    const { screenName = 'homepage', metadata } = req.body || {};
    const now = new Date().toISOString();
    const eventId = crypto.randomUUID();

    // Fire-and-forget: publish to analytics queue — log errors instead of swallowing
    setImmediate(() => {
      publishAnalyticsEvent({
        eventId,
        eventType: 'visit_event',
        userId,
        data: {
          source: 'frontend',
          metadata: {
            name: screenName,
            properties: metadata || {},
            sessionId: null,
            appVersion: null,
          },
        },
        sourceEventId: eventId,
        timestamp: now,
      }).catch((err) => {
        logger.error('[Analytics] Failed to publish homepage event', {
          eventId,
          screenName,
          error: err?.message || 'Unknown error',
        });
      });
    });

    return res.json({ success: true, timestamp: new Date().toISOString() });
  }),
);

// Batch analytics events from frontend
router.post('/batch', analyticsLimiter, optionalAuth, validateBody(batchEventsSchema), handleBatchEvents);

// Alias for frontend CustomProvider (posts to /api/analytics/events)
router.post('/events', analyticsLimiter, optionalAuth, validateBody(batchEventsSchema), handleBatchEvents);

// Track an analytics event
router.post(
  '/track',
  // analyticsLimiter,, // Disabled for development
  optionalAuth,
  validateBody(
    Joi.object({
      storeId: commonSchemas.objectId().required(),
      eventType: Joi.string()
        .valid('view', 'search', 'favorite', 'unfavorite', 'compare', 'review', 'click', 'share')
        .required(),
      eventData: Joi.object({
        searchQuery: Joi.string().trim().max(100),
        category: Joi.string().trim().max(50),
        source: Joi.string().trim().max(50),
        location: Joi.object({
          coordinates: Joi.array().items(Joi.number()).length(2),
          address: Joi.string().trim().max(200),
        }),
        metadata: Joi.object(),
      }),
    }),
  ),
  trackEvent,
);

// Get store analytics
router.get(
  '/store/:storeId',
  // generalLimiter,, // Disabled for development
  optionalAuth,
  validateParams(
    Joi.object({
      storeId: commonSchemas.objectId(),
    }),
  ),
  validateQuery(
    Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso(),
      eventType: Joi.string().valid('view', 'search', 'favorite', 'unfavorite', 'compare', 'review', 'click', 'share'),
      groupBy: Joi.string().valid('hour', 'day', 'week', 'month').default('day'),
    }),
  ),
  getStoreAnalytics,
);

// Get popular stores
router.get(
  '/popular',
  // generalLimiter,, // Disabled for development
  optionalAuth,
  validateQuery(
    Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso(),
      eventType: Joi.string().valid('view', 'search', 'favorite', 'unfavorite', 'compare', 'review', 'click', 'share'),
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  ),
  getPopularStores,
);

// Get user analytics
router.get(
  '/user/my-analytics',
  // generalLimiter,, // Disabled for development
  requireAuth,
  validateQuery(
    Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso(),
      eventType: Joi.string().valid('view', 'search', 'favorite', 'unfavorite', 'compare', 'review', 'click', 'share'),
    }),
  ),
  getUserAnalytics,
);

// Get analytics dashboard
router.get(
  '/dashboard',
  // generalLimiter,, // Disabled for development
  requireAuth,
  validateQuery(
    Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso(),
    }),
  ),
  getAnalyticsDashboard,
);

// Get search analytics
router.get(
  '/search',
  // generalLimiter,, // Disabled for development
  requireAuth,
  validateQuery(
    Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso(),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  ),
  getSearchAnalytics,
);

// Get category analytics
router.get(
  '/categories',
  // generalLimiter,, // Disabled for development
  requireAuth,
  validateQuery(
    Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso(),
    }),
  ),
  getCategoryAnalytics,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /analytics/merchant/:merchantId/summary?period=30d
// Merchant analytics summary for the REZ Summary screen (rez-summary.tsx).
// Aggregates revenue, visitors, top products, and new vs returning ratio.
// Auth: optional — merchant app passes the merchant JWT in Authorization header.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/merchant/:merchantId/summary',
  optionalAuth,
  asyncHandler(async (req: any, res: any) => {
    try {
      const { merchantId } = req.params as { merchantId: string };
      const { period = '30d' } = req.query as { period?: string };

      const periodDays: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const daysNum = periodDays[period] ?? 30;
      const now = new Date();
      const since = new Date(now.getTime() - daysNum * 86400000);
      const prevSince = new Date(since.getTime() - daysNum * 86400000);

      const mongoose = require('mongoose');
      const { Order } = require('../models/Order');

      if (!mongoose.Types.ObjectId.isValid(merchantId)) {
        return res.status(400).json({ success: false, message: 'Invalid merchantId' });
      }
      const merchantObjId = new mongoose.Types.ObjectId(merchantId);

      // Resolve store IDs for this merchant — Order items are linked by store, not merchantId
      const { Store } = require('../models/Store');
      const merchantStores = await Store.find({ merchant: merchantObjId }, '_id').lean();
      const storeIds = merchantStores.map((s: any) => s._id);
      const storeFilter =
        storeIds.length > 0 ? { 'items.store': { $in: storeIds } } : { 'items.store': { $exists: true } };

      const [currentAgg, prevAgg, productAgg, userAgg, dailyAgg] = await Promise.all([
        // Revenue + visitor count for current period
        Order.aggregate([
          {
            $match: {
              ...storeFilter,
              status: { $in: ['delivered', 'completed'] },
              createdAt: { $gte: since },
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$totals.total' },
              visitors: { $addToSet: '$user' },
            },
          },
        ]),
        // Revenue for previous period (% change calculation)
        Order.aggregate([
          {
            $match: {
              ...storeFilter,
              status: { $in: ['delivered', 'completed'] },
              createdAt: { $gte: prevSince, $lt: since },
            },
          },
          { $group: { _id: null, revenue: { $sum: '$totals.total' } } },
        ]),
        // Top 5 products by revenue
        Order.aggregate([
          {
            $match: {
              ...storeFilter,
              status: { $in: ['delivered', 'completed'] },
              createdAt: { $gte: since },
            },
          },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.product',
              name: { $first: '$items.name' },
              revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
              quantity: { $sum: '$items.quantity' },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
        ]),
        // New vs returning: users with first order in current period vs before
        Order.aggregate([
          {
            $match: {
              ...storeFilter,
              status: { $in: ['delivered', 'completed'] },
            },
          },
          {
            $group: {
              _id: '$user',
              firstOrder: { $min: '$createdAt' },
              lastOrder: { $max: '$createdAt' },
            },
          },
          {
            $addFields: {
              isNew: { $gte: ['$firstOrder', since] },
              isActive: { $gte: ['$lastOrder', since] },
            },
          },
          { $match: { isActive: true } },
          { $group: { _id: null, newCount: { $sum: { $cond: ['$isNew', 1, 0] } }, total: { $sum: 1 } } },
        ]),
        // Daily revenue + visitors for sparkline
        Order.aggregate([
          {
            $match: {
              ...storeFilter,
              status: { $in: ['delivered', 'completed'] },
              createdAt: { $gte: since },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              revenue: { $sum: '$totals.total' },
              visitors: { $addToSet: '$user' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const revenue = Math.round((currentAgg[0]?.revenue ?? 0) * 100) / 100;
      const visitors = currentAgg[0]?.visitors?.length ?? 0;
      const userStats = userAgg[0] ?? { newCount: 0, total: 1 };
      const newCount = userStats.newCount ?? 0;
      const returningCount = Math.max((userStats.total ?? 0) - newCount, 0);

      return res.json({
        success: true,
        data: {
          merchantId,
          period,
          revenue,
          prevRevenue: Math.round((prevAgg[0]?.revenue ?? 0) * 100) / 100,
          visitors,
          topProducts: productAgg.map((p: any) => ({
            productId: String(p._id),
            name: p.name || 'Unknown',
            revenue: Math.round(p.revenue * 100) / 100,
            quantity: p.quantity,
          })),
          newVsReturning: {
            new: newCount,
            returning: returningCount,
            ratio: userStats.total > 0 ? Math.round((returningCount / userStats.total) * 100) : 0,
          },
          days: dailyAgg.map((d: any) => ({
            date: d._id,
            revenue: Math.round(d.revenue * 100) / 100,
            visitors: d.visitors?.length ?? 0,
          })),
        },
      });
    } catch (err: any) {
      logger.error('[Analytics] merchant summary error', err);
      return res.status(500).json({ success: false, message: 'Failed to load merchant analytics summary' });
    }
  }),
);

export default router;
