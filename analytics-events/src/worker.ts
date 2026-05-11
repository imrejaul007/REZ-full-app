/**
 * Analytics Worker — standalone BullMQ consumer for analytics-events queue.
 *
 * Phase C extraction. Persists analytics events to MongoDB with idempotent upsert.
 */

import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { bullmqRedis } from './config/redis';
import { createServiceLogger } from './config/logger';

const logger = createServiceLogger('analytics-worker');

export const QUEUE_NAME = 'analytics-events';

export interface AnalyticsQueueEvent {
  eventId: string;
  eventType: string;
  userId: string;
  data: {
    entityId?: string;
    entityType?: string;
    amount?: number;
    storeId?: string;
    category?: string;
    source?: string;
    metadata?: Record<string, any>;
  };
  sourceEventId?: string;
  createdAt: string;
}

let _worker: Worker | null = null;

export function startAnalyticsWorker(): Worker {
  if (_worker) return _worker;

  _worker = new Worker(
    QUEUE_NAME,
    async (job: Job<AnalyticsQueueEvent>) => {
      const event = job.data;

      // FIX: Validate required event fields before processing
      if (!event.eventId || !event.eventType || !event.userId) {
        logger.error('[Worker] Invalid event — missing required fields', {
          eventId: event.eventId,
          eventType: event.eventType,
          userId: event.userId,
        });
        throw new Error('Invalid analytics event: missing eventId, eventType, or userId');
      }

      logger.debug('[Worker] Processing analytics event', {
        eventId: event.eventId,
        eventType: event.eventType,
        userId: event.userId,
        attempt: job.attemptsMade,
      });

      // Idempotent upsert — E11000 duplicate key is treated as success
      try {
        const AnalyticsEvent = mongoose.connection.collection('analyticsevents');
        await AnalyticsEvent.updateOne(
          { eventId: event.eventId },
          {
            $setOnInsert: {
              eventId: event.eventId,
              eventType: event.eventType,
              userId: event.userId,
              data: event.data,
              sourceEventId: event.sourceEventId,
              processedAt: new Date(),
              createdAt: new Date(event.createdAt),
            },
          },
          { upsert: true },
        );
      } catch (err: any) {
        if (err.code === 11000) {
          logger.debug('[Worker] Duplicate event (idempotent skip)', { eventId: event.eventId });
          return;
        }
        throw err;
      }

      // Aggregate daily metrics
      try {
        const createdDate = new Date(event.createdAt);
        if (isNaN(createdDate.getTime())) {
          logger.warn('[Worker] Invalid createdAt — skipping daily metrics aggregation', { eventId: event.eventId });
          return;
        }
        const today = createdDate.toISOString().split('T')[0];
        const DailyMetrics = mongoose.connection.collection('dailymetrics');
        await DailyMetrics.updateOne(
          { date: today, eventType: event.eventType },
          {
            $inc: { count: 1, totalAmount: event.data.amount || 0 },
            $setOnInsert: { date: today, eventType: event.eventType },
          },
          { upsert: true },
        );
      } catch (err: any) {
        logger.warn('[Worker] Daily metrics aggregation failed', { error: err.message });
      }
    },
    {
      connection: bullmqRedis,
      concurrency: 15,
      limiter: { max: 500, duration: 1000 },
      // C-28 FIX: Job timeout enforcement - prevent stuck jobs
      lockDuration: 30000, // 30 second lock
      lockRenewTime: 5000, // Renew lock every 5 seconds
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 2, // Fail job after 2 stalled attempts
    },
  );

  _worker.on('failed', (job, err) => {
    logger.error('[Worker] Job failed', {
      jobId: job?.id,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  _worker.on('error', (err) => {
    logger.error('[Worker] Error:', err.message);
  });

  // C-28 FIX: Stuck job detection and recovery
  _worker.on('stalled', (jobId: string) => {
    logger.warn('[Worker] Job stalled (lock expired without renewal)', { jobId });
  });

  logger.info('[Worker] Started — queue: ' + QUEUE_NAME);
  return _worker;
}

export async function stopWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
}
