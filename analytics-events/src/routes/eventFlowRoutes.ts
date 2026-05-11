/**
 * Event Flow Monitoring Routes
 *
 * Provides visibility into the event flow between services.
 * GET /api/monitoring/event-flow - Shows event counts by source and type
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * GET /api/monitoring/event-flow
 * Returns event flow statistics for monitoring
 */
router.get('/event-flow', async (req: Request, res: Response) => {
  try {
    const { hours = '24' } = req.query;
    const hoursNum = Math.min(Math.max(parseInt(hours as string, 10) || 24, 1), 168);
    const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000);

    // Count events by source
    const eventsBySource = await mongoose.connection.collection('appevents').aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Count events by type
    const eventsByType = await mongoose.connection.collection('appevents').aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Count growth events by type
    const growthEventsByType = await mongoose.connection.collection('growth_events').aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Event platform status (check if collections exist and have recent data)
    const appEventsCount = await mongoose.connection.collection('appevents').countDocuments({
      timestamp: { $gte: since }
    });

    const growthEventsCount = await mongoose.connection.collection('growth_events').countDocuments({
      timestamp: { $gte: since }
    });

    // Recent events sample
    const recentEvents = await mongoose.connection.collection('appevents')
      .find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(10)
      .project({ name: 1, timestamp: 1, platform: 1, _id: 0 })
      .toArray();

    res.json({
      success: true,
      data: {
        period: { hours: hoursNum, since: since.toISOString() },
        summary: {
          totalAppEvents: appEventsCount,
          totalGrowthEvents: growthEventsCount,
        },
        eventsBySource: eventsBySource.map((e: any) => ({
          source: e._id || 'unknown',
          count: e.count,
        })),
        eventsByType: eventsByType.map((e: any) => ({
          type: e._id || 'unknown',
          count: e.count,
        })),
        growthEventsByType: growthEventsByType.map((e: any) => ({
          type: e._id || 'unknown',
          count: e.count,
        })),
        recentEvents,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/monitoring/health
 * Returns health status of analytics pipeline
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // Check MongoDB
    const mongoStart = Date.now();
    try {
      await mongoose.connection.db?.admin().ping();
      checks.mongodb = { status: 'up', latencyMs: Date.now() - mongoStart };
    } catch (err: any) {
      checks.mongodb = { status: 'down', error: err.message };
    }

    // Check collections exist
    const collections = await mongoose.connection.db?.listCollections().toArray() || [];
    const collectionNames = collections.map((c: any) => c.name);
    const analyticsCollections = collectionNames.filter((n: string) =>
      ['appevents', 'growth_events', 'merchantanalytics'].includes(n)
    );
    checks.collections = {
      status: 'ok',
      names: analyticsCollections,
    } as any;

    // Check recent activity
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await mongoose.connection.collection('appevents')
      .countDocuments({ timestamp: { $gte: last24h } });

    checks.activity = {
      status: recentCount > 0 ? 'ok' : 'warning',
      eventsLast24h: recentCount,
    } as any;

    const overallStatus = Object.values(checks).every(c => c.status === 'ok' || c.status === 'warning')
      ? 'healthy'
      : 'unhealthy';

    res.json({
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export function createEventFlowRouter(): Router {
  return router;
}
