// @ts-nocheck
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response } from 'express';
import { logger } from './logger';

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP request counter
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// HTTP request duration
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Database query duration
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

// Database connection pool
export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
});

// Cache hit/miss counter
export const cacheCounter = new Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'],
});

// Active users gauge
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
});

// Queue size gauge
export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Number of items in queue',
  labelNames: ['queue_name'],
});

// Error counter
export const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'code'],
});

// Payment failure counter — tracks every failed payment attempt with structured labels
// so dashboards can slice by gateway (razorpay/stripe) and reason_code (e.g. INSUFFICIENT_FUNDS)
export const paymentFailureCounter = new Counter({
  name: 'payment_failures_total',
  help: 'Total number of failed payment attempts',
  labelNames: ['gateway', 'reason_code'],
});

// Coin expiry burn counter — total coins destroyed by the nightly expiry job
export const coinExpiryBurnCounter = new Counter({
  name: 'coin_expiry_burned_total',
  help: 'Total coins burned through expiry (cumulative)',
  labelNames: ['coin_type'],
});

// Coin issuance counter — incremented on every successful reward credit
export const coinIssuanceCounter = new Counter({
  name: 'coins_issued_total',
  help: 'Total coins credited to users',
  labelNames: ['source', 'coin_type', 'reward_type'],
});

// Business metrics
export const orderCounter = new Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['status'],
});

export const revenueCounter = new Counter({
  name: 'revenue_total',
  help: 'Total revenue',
  labelNames: ['currency'],
});

export const bookingCounter = new Counter({
  name: 'bookings_total',
  help: 'Total number of bookings',
  labelNames: ['status', 'type'],
});

// ─────────────────────────────────────────────────────────────────────────────
// v3 Merchant Observability Contract — 14 new metrics (Part 13)
// ─────────────────────────────────────────────────────────────────────────────

// MERCHANT EVENT BUS
export const merchantEventPublished = new Counter({
  name: 'merchant_event_published_total',
  help: 'Total merchant domain events published by type',
  labelNames: ['event_type', 'source'],
});

export const merchantEventQueueBacklog = new Gauge({
  name: 'merchant_event_queue_backlog',
  help: 'Pending jobs in merchant-events BullMQ queue',
});

// REWARD ENGINE
export const merchantRewardIssued = new Counter({
  name: 'merchant_reward_issued_total',
  help: 'Total rewards issued via merchant reward engine',
  labelNames: ['reward_type', 'merchant_category'],
});

export const merchantRewardSkipped = new Counter({
  name: 'merchant_reward_skipped_total',
  help: 'Merchant rewards skipped with reason (daily_cap, fraud_flag, no_active_program)',
  labelNames: ['reason'],
});

// BROADCAST
export const broadcastSent = new Counter({
  name: 'merchant_broadcast_sent_total',
  help: 'Broadcast messages sent by channel and segment',
  labelNames: ['channel', 'segment'],
});

export const broadcastDelivered = new Counter({
  name: 'merchant_broadcast_delivered_total',
  help: 'Broadcast messages confirmed delivered',
  labelNames: ['channel'],
});

export const broadcastDeduplicated = new Counter({
  name: 'merchant_broadcast_deduplicated_total',
  help: 'Duplicate broadcasts prevented by deduplication lock or message hash',
});

// AGGREGATOR
export const aggregatorSyncConflicts = new Counter({
  name: 'aggregator_sync_conflicts_total',
  help: 'Items where aggregator had a different value than REZ (price/name/availability drift)',
  labelNames: ['platform', 'field'],
});

// ANALYTICS READ MODELS
export const readModelStaleness = new Gauge({
  name: 'merchant_read_model_staleness_seconds',
  help: 'Seconds since last refresh of each merchant read model',
  labelNames: ['model_name'],
});

// FINANCIAL STATE MACHINE
export const fsmInvalidTransitionAttempts = new Counter({
  name: 'financial_fsm_invalid_transition_total',
  help: 'Rejected financial state transitions — should be 0 in healthy production',
  labelNames: ['entity_type', 'from_state', 'to_state'],
});

// WHATSAPP BOT
export const whatsappSessionsActive = new Gauge({
  name: 'whatsapp_bot_sessions_active',
  help: 'Active WhatsApp ordering sessions',
});

export const whatsappBotLockouts = new Counter({
  name: 'whatsapp_bot_lockouts_total',
  help: 'Phone numbers locked out for excessive retries or spam',
  labelNames: ['reason'],
});

// ─────────────────────────────────────────────────────────────────────────────
// Queue depth / stalled / failed / completed metrics (Phase 0 Observability)
// ─────────────────────────────────────────────────────────────────────────────

export const queueDepthGauge = new Gauge({
  name: 'queue_depth',
  help: 'Number of waiting (pending) jobs in BullMQ queue',
  labelNames: ['queue_name'],
});

export const queueActiveGauge = new Gauge({
  name: 'queue_active',
  help: 'Number of actively processing jobs in BullMQ queue',
  labelNames: ['queue_name'],
});

export const queueFailedGauge = new Gauge({
  name: 'queue_failed_total',
  help: 'Number of failed jobs currently retained in BullMQ queue',
  labelNames: ['queue_name'],
});

export const queueStalledGauge = new Gauge({
  name: 'queue_stalled_total',
  help: 'Number of stalled jobs in BullMQ queue',
  labelNames: ['queue_name'],
});

export const queueCompletedGauge = new Gauge({
  name: 'queue_completed_total',
  help: 'Number of completed jobs currently retained in BullMQ queue',
  labelNames: ['queue_name'],
});

export const dlqDepthGauge = new Gauge({
  name: 'dlq_depth',
  help: 'Number of jobs sitting in the dead-letter queue (waiting for manual replay)',
  labelNames: ['queue_name'],
});

// Critical queues — these are the ones that affect money / user experience
// and must be included in the readiness probe.
export const CRITICAL_QUEUE_NAMES = ['payments', 'rewards', 'merchant-events'];

// Module-level cached Queue instances for queues not exported from bullmq-queues.ts.
// Cached so we don't create new ioredis connections on every 30s sample tick —
// each `new Queue()` call opens its own ioredis connection that would leak/die.
let _cachedPaymentsDlq: import('bullmq').Queue | null = null;
let _cachedRewardsDlq: import('bullmq').Queue | null = null;
let _cachedMerchantEventsQueue: import('bullmq').Queue | null = null;
let _cachedBroadcastQueue: import('bullmq').Queue | null = null;

/**
 * Sample queue depths/stalled counts from BullMQ and update Prometheus gauges.
 * Called on an interval (30s) from startQueueMetricsSampler().
 * Also exported so the readiness endpoint can call it on-demand.
 */
export async function sampleQueueMetrics(): Promise<
  Record<string, { depth: number; active: number; failed: number; stalled: number; completed: number }>
> {
  const summary: Record<string, { depth: number; active: number; failed: number; stalled: number; completed: number }> =
    {};

  try {
    // Lazy import to avoid circular dependencies at module load time
    const {
      paymentQueue,
      rewardQueue,
      notificationQueue,
      analyticsQueue,
      emailQueue,
      smsQueue,
      orderQueue,
      exportQueue,
      scheduledQueue,
      integrationQueue,
    } = await import('./bullmq-queues');

    // Lazily initialise DLQ / worker queues once and cache them.
    // Creating `new Queue()` on every sample tick opens a new ioredis connection
    // that leaks and dies; caching ensures one stable connection per queue name.
    if (!_cachedPaymentsDlq || !_cachedRewardsDlq) {
      try {
        const { Queue } = await import('bullmq');
        const { bullmqRedis: conn } = await import('./bullmq-connection');
        _cachedPaymentsDlq = new Queue('payments-dlq', { connection: conn });
        _cachedRewardsDlq = new Queue('rewards-dlq', { connection: conn });
      } catch {
        // Redis not ready yet — skip silently, will retry next interval
      }
    }
    const paymentsDlqQueue = _cachedPaymentsDlq;
    const rewardsDlqQueue = _cachedRewardsDlq;

    if (!_cachedMerchantEventsQueue || !_cachedBroadcastQueue) {
      try {
        const { Queue } = await import('bullmq');
        const { bullmqRedis: conn } = await import('./bullmq-connection');
        _cachedMerchantEventsQueue = new Queue('merchant-events', { connection: conn });
        _cachedBroadcastQueue = new Queue('broadcast', { connection: conn });
      } catch {
        // Skip if redis not ready
      }
    }
    const merchantEventsQueue = _cachedMerchantEventsQueue;
    const broadcastQueue = _cachedBroadcastQueue;

    const allQueues: Array<{ name: string; queue: import('bullmq').Queue }> = [
      { name: 'payments', queue: paymentQueue },
      { name: 'rewards', queue: rewardQueue },
      { name: 'notifications', queue: notificationQueue },
      { name: 'analytics', queue: analyticsQueue },
      { name: 'email', queue: emailQueue },
      { name: 'sms', queue: smsQueue },
      { name: 'orders', queue: orderQueue },
      { name: 'exports', queue: exportQueue },
      { name: 'scheduled', queue: scheduledQueue },
      { name: 'integrations', queue: integrationQueue },
    ];

    if (merchantEventsQueue) allQueues.push({ name: 'merchant-events', queue: merchantEventsQueue });
    if (broadcastQueue) allQueues.push({ name: 'broadcast', queue: broadcastQueue });

    for (const { name, queue } of allQueues) {
      try {
        const counts = await queue.getJobCounts('waiting', 'active', 'failed', 'delayed', 'completed');
        const waiting = (counts as any).waiting ?? 0;
        const active = (counts as any).active ?? 0;
        const failed = (counts as any).failed ?? 0;
        const completed = (counts as any).completed ?? 0;

        // BullMQ does not expose a 'stalled' count in getJobCounts; we use 0 here as a
        // placeholder — the 'stalled' worker event (in workers/index.ts) already fires
        // logger.warn which is the actionable signal. Prometheus stall counter will be
        // added incrementally via worker event hooks in a follow-on task.
        const stalled = 0;

        queueDepthGauge.set({ queue_name: name }, waiting);
        queueActiveGauge.set({ queue_name: name }, active);
        queueFailedGauge.set({ queue_name: name }, failed);
        queueStalledGauge.set({ queue_name: name }, stalled);
        queueCompletedGauge.set({ queue_name: name }, completed);

        summary[name] = { depth: waiting, active, failed, stalled, completed };
      } catch (queueErr: any) {
        logger.warn(`[QueueMetrics] Failed to sample queue ${name}`, { error: queueErr?.message });
        summary[name] = { depth: -1, active: -1, failed: -1, stalled: -1, completed: -1 };
      }
    }

    // DLQ depth gauges
    const dlqs: Array<{ name: string; queue: import('bullmq').Queue | null }> = [
      { name: 'payments-dlq', queue: paymentsDlqQueue },
      { name: 'rewards-dlq', queue: rewardsDlqQueue },
    ];
    for (const { name, queue } of dlqs) {
      if (!queue) continue;
      try {
        const counts = await queue.getJobCounts('waiting', 'active', 'failed');
        const depth = ((counts as any).waiting ?? 0) + ((counts as any).active ?? 0);
        dlqDepthGauge.set({ queue_name: name }, depth);
        if (depth > 0) {
          logger.warn(`[DLQ] ${name} has ${depth} items awaiting manual replay`, { queue_name: name, depth });
        }
      } catch {
        // DLQ not yet initialised — skip
      }
    }
  } catch (err: any) {
    logger.warn('[QueueMetrics] Sampling failed', { error: err?.message });
  }

  return summary;
}

let _queueSamplerTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start a 30-second interval that samples all queue metrics and updates Prometheus gauges.
 * Should be called once after Redis is confirmed ready.
 * Safe to call multiple times — will not start a second interval.
 */
export function startQueueMetricsSampler(): void {
  if (_queueSamplerTimer) return; // already running
  _queueSamplerTimer = setInterval(() => {
    sampleQueueMetrics().catch((err) => logger.warn('[QueueMetrics] Interval sample error', { error: err?.message }));
  }, 30_000);
  // Don't hold the process open just for metrics sampling
  if (_queueSamplerTimer.unref) _queueSamplerTimer.unref();
  logger.info('[QueueMetrics] 30s sampler started');
}

// Export metrics endpoint
export const metricsEndpoint = (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
};

// Metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    // Increment request counter
    httpRequestCounter.inc({
      method: req.method,
      route,
      status: res.statusCode.toString(),
    });

    // Observe request duration
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode.toString(),
      },
      duration,
    );

    // Track errors
    if (res.statusCode >= 400) {
      errorCounter.inc({
        type: res.statusCode >= 500 ? 'server' : 'client',
        code: res.statusCode.toString(),
      });
    }
  });

  next();
};

// Helper to track database operations
export const trackDbOperation = async <T>(operation: string, collection: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.observe({ operation, collection }, duration);
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    dbQueryDuration.observe({ operation, collection }, duration);
    throw error;
  }
};

// Reset all metrics (useful for testing)
export const resetMetrics = () => {
  register.resetMetrics();
};

// ── Security & Financial Metrics ─────────────────────────────────────────────

export const otpRateLimitBlocked = new Counter({
  name: 'rez_otp_rate_limit_blocked_total',
  help: 'Total OTP requests blocked by rate limiter',
  labelNames: ['reason'],
});

export const tokenBlacklistBypassTotal = new Counter({
  name: 'rez_token_blacklist_bypass_total',
  help: 'Total times token blacklist check fell back to MongoDB (Redis unavailable)',
});

export const webhookSignatureFailureTotal = new Counter({
  name: 'rez_webhook_signature_failure_total',
  help: 'Total Razorpay webhook signature validation failures',
  labelNames: ['endpoint'],
});

export const cashbackCapBypassTotal = new Counter({
  name: 'rez_cashback_cap_bypass_total',
  help: 'Total times cashback daily cap was bypassed due to Redis unavailability',
});

export const paymentJobFailedTotal = new Counter({
  name: 'rez_payment_job_failed_total',
  help: 'Total payment BullMQ jobs permanently failed after all retries',
  labelNames: ['job_name'],
});
