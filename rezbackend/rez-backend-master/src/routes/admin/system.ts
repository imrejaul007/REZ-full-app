// @ts-nocheck
import { logger } from '../../config/logger';
import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { sendSuccess } from '../../utils/response';
import { QueueService } from '../../services/QueueService';
import { getLatestReconciliationResult, triggerManualReconciliation } from '../../jobs/reconciliationJob';
import mongoose from 'mongoose';
import redisService from '../../services/redisService';
import os from 'os';
import { asyncHandler } from '../../utils/asyncHandler';
import AlertRule from '../../models/AlertRule';

const router = Router();

// All routes require admin authentication
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/system/health
 * @desc    System health overview
 * @access  Admin
 */
router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    // Database status
    const dbState = mongoose.connection.readyState;
    const dbStateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    const dbStatus = dbStateMap[dbState] || 'unknown';

    let dbConnectionCount = 0;
    try {
      const adminDb = mongoose.connection.db;
      if (adminDb) {
        const serverStatus = await adminDb.command({ serverStatus: 1 });
        dbConnectionCount = serverStatus?.connections?.current || 0;
      }
    } catch {
      // serverStatus may not be available in all configurations
    }

    // Redis status
    const redisStats = await redisService.getStats();
    const redisStatus = redisStats.connected ? 'connected' : 'disconnected';
    const redisMemory = redisStats.info?.Memory?.used_memory_human || null;

    // Queue health
    let queueHealth = null;
    try {
      queueHealth = await QueueService.getHealthStatus();
    } catch {
      queueHealth = { overall: 'unavailable', queues: [], timestamp: new Date().toISOString() };
    }

    // Server info
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();
    const cpuUsage =
      cpus.length > 0
        ? cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total) * 100;
          }, 0) / cpus.length
        : 0;

    // Scheduled jobs status
    const jobs = await getScheduledJobStatuses();

    const health = {
      server: {
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
        memory: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
          external: memUsage.external,
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memUsage.rss / 1024 / 1024),
        },
        totalMemory: totalMem,
        freeMemory: freeMem,
        totalMemoryGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
        freeMemoryGB: (freeMem / 1024 / 1024 / 1024).toFixed(2),
        cpuUsagePercent: Math.round(cpuUsage * 100) / 100,
        cpuCores: cpus.length,
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      database: {
        status: dbStatus,
        connectionCount: dbConnectionCount,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
      },
      redis: {
        status: redisStatus,
        enabled: redisStats.enabled,
        memory: redisMemory,
        dbSize: redisStats.dbSize || 0,
      },
      queues: queueHealth,
      jobs,
      timestamp: new Date().toISOString(),
    };

    // Determine overall status
    const isHealthy = dbStatus === 'connected' && (redisStatus === 'connected' || !redisStats.enabled);
    const isDegraded = dbStatus === 'connected' && redisStats.enabled && redisStatus !== 'connected';
    const overallStatus = isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy';

    return sendSuccess(res, { ...health, overallStatus }, 'System health retrieved');
  }),
);

/**
 * @route   GET /api/admin/system/reconciliation
 * @desc    Get latest reconciliation results
 * @access  Admin
 */
router.get(
  '/reconciliation',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await getLatestReconciliationResult();

    if (!result) {
      return sendSuccess(
        res,
        {
          hasResults: false,
          message: 'No reconciliation results available. The job may not have run yet.',
        },
        'No reconciliation results',
      );
    }

    return sendSuccess(
      res,
      {
        hasResults: true,
        ...result,
      },
      'Reconciliation results retrieved',
    );
  }),
);

/**
 * @route   POST /api/admin/system/reconciliation/trigger
 * @desc    Manually trigger reconciliation
 * @access  Admin
 */
router.post(
  '/reconciliation/trigger',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info(`[ADMIN SYSTEM] Manual reconciliation triggered by admin user`);
    const result = await triggerManualReconciliation();

    return sendSuccess(res, result, 'Reconciliation completed successfully');
  }),
);

/**
 * @route   GET /api/admin/system/jobs
 * @desc    Get all scheduled job statuses
 * @access  Admin
 */
router.get(
  '/jobs',
  asyncHandler(async (req: Request, res: Response) => {
    const jobs = await getScheduledJobStatuses();
    return sendSuccess(res, { jobs }, 'Scheduled job statuses retrieved');
  }),
);

/**
 * @route   GET /api/admin/system/active-sessions
 * @desc    Get count of active sessions by user type
 * @access  Admin
 */
router.get(
  '/active-sessions',
  asyncHandler(async (req: Request, res: Response) => {
    let consumers = 0,
      merchants = 0;
    try {
      // Access raw Redis client for set operations
      const client = (redisService as any).client;
      if (client) {
        consumers = (await client.sCard('active:consumers').catch(() => 0)) || 0;
        merchants = (await client.sCard('active:merchants').catch(() => 0)) || 0;
      }
    } catch {
      // non-fatal
    }

    // Get admin socket count from global io if available
    let admins = 0;
    try {
      const adminNamespace = (global as any).io?.of?.('/admin');
      admins = adminNamespace?.sockets?.size || 0;
    } catch {
      // io not available
    }

    const total = consumers + merchants + admins;

    return sendSuccess(
      res,
      {
        consumers,
        merchants,
        admins,
        total,
        updatedAt: new Date().toISOString(),
      },
      'Active sessions retrieved',
    );
  }),
);

/**
 * @route   POST /api/admin/system/queues/:name/retry-failed
 * @desc    Retry all failed jobs in a queue
 * @access  Admin
 */
router.post(
  '/queues/:name/retry-failed',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;

    try {
      // Attempt to get queue — QueueService may have a getQueue method
      let queue: any = null;
      try {
        queue = (QueueService as any).getQueue?.(name);
      } catch {
        // Queue not available
      }

      if (!queue) {
        return res.status(404).json({ success: false, error: `Queue "${name}" not found or not initialized` });
      }

      const failed = await queue.getFailed();
      let retried = 0;

      for (const job of failed) {
        try {
          await job.retry();
          retried++;
        } catch {
          // Continue on individual job retry failures
        }
      }

      logger.info(`[ADMIN] Retried ${retried}/${failed.length} failed jobs in queue: ${name}`);
      return sendSuccess(res, { retried, total: failed.length, queue: name }, 'Jobs retried');
    } catch (err: any) {
      logger.error(`[ADMIN] Queue retry failed for ${name}:`, err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }),
);

/**
 * @route   GET /api/admin/system/alert-rules
 * @desc    Get all alert rules
 * @access  Admin
 */
router.get(
  '/alert-rules',
  asyncHandler(async (req: Request, res: Response) => {
    const rules = await AlertRule.find().sort({ createdAt: -1 });
    return sendSuccess(res, rules, 'Alert rules retrieved');
  }),
);

/**
 * @route   PATCH /api/admin/system/alert-rules/:id
 * @desc    Update an alert rule
 * @access  Admin
 */
router.patch(
  '/alert-rules/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { enabled, threshold, channels } = req.body;

    const updates: any = {};
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (typeof threshold === 'number') updates.threshold = threshold;
    if (Array.isArray(channels)) updates.channels = channels;

    const rule = await AlertRule.findOneAndUpdate({ id }, updates, { new: true, runValidators: true });

    if (!rule) {
      return res.status(404).json({ success: false, error: 'Alert rule not found' });
    }

    logger.info(`[ADMIN] Alert rule updated: ${id}`, { updates });
    return sendSuccess(res, rule, 'Alert rule updated');
  }),
);

/**
 * Initialize default alert rules if collection is empty
 */
async function initializeAlertRules() {
  try {
    const count = await AlertRule.countDocuments();
    if (count === 0) {
      const defaultRules = [
        {
          id: 'api-p99',
          name: 'API P99 Latency',
          metric: 'api_p99_ms',
          threshold: 2000,
          unit: 'ms',
          enabled: true,
          channels: ['slack', 'pagerduty'],
          cooldownMinutes: 60,
        },
        {
          id: 'error-rate',
          name: 'Error Rate',
          metric: 'error_rate_pct',
          threshold: 5,
          unit: '%',
          enabled: true,
          channels: ['slack', 'pagerduty'],
          cooldownMinutes: 60,
        },
        {
          id: 'queue-backlog',
          name: 'Queue Backlog',
          metric: 'queue_depth',
          threshold: 500,
          unit: 'jobs',
          enabled: true,
          channels: ['slack'],
          cooldownMinutes: 60,
        },
        {
          id: 'payment-failure',
          name: 'Payment Failure Rate',
          metric: 'payment_failure_pct',
          threshold: 3,
          unit: '%',
          enabled: true,
          channels: ['slack', 'pagerduty', 'email'],
          cooldownMinutes: 60,
        },
        {
          id: 'coin-liability',
          name: 'Coin Liability',
          metric: 'coin_liability_inr',
          threshold: 5000000,
          unit: '₹',
          enabled: true,
          channels: ['email'],
          cooldownMinutes: 120,
        },
        {
          id: 'job-failures',
          name: 'Consecutive Job Failures',
          metric: 'job_failures',
          threshold: 3,
          unit: 'count',
          enabled: true,
          channels: ['slack', 'pagerduty'],
          cooldownMinutes: 60,
        },
        {
          id: 'fraud-score',
          name: 'Fraud Score Spike',
          metric: 'fraud_score',
          threshold: 80,
          unit: 'score',
          enabled: false,
          channels: ['slack', 'pagerduty', 'email'],
          cooldownMinutes: 60,
        },
      ];

      await AlertRule.insertMany(defaultRules);
      logger.info('[ADMIN] Default alert rules initialized');
    }
  } catch (error) {
    logger.error('[ADMIN] Failed to initialize alert rules:', error);
  }
}

// Initialize alert rules on module load
initializeAlertRules();

// ---- Helpers ----

/**
 * Get statuses of all known scheduled cron jobs.
 * Since the jobs don't store their status centrally, we build a known list
 * with schedule info. Last run / next run come from Redis if available.
 */
async function getScheduledJobStatuses() {
  // TASK 2: Full 58-job list with expected intervals and health tracking
  const knownJobs = [
    // ── FINANCIAL CRITICAL ──
    {
      name: 'Payment Reconciliation',
      schedule: '*/10 * * * *',
      redisKey: 'job:payment:recon:lastRun',
      category: 'financial',
      expectedIntervalMin: 15,
    },
    {
      name: 'Credit Pending Cashback',
      schedule: '0 * * * *',
      redisKey: 'job:credit:cashback:lastRun',
      category: 'financial',
      expectedIntervalMin: 70,
    },
    {
      name: 'Daily Reconciliation',
      schedule: '0 3 * * *',
      redisKey: 'job:daily:recon:lastRun',
      category: 'financial',
      expectedIntervalMin: 1500,
    },
    {
      name: 'Travel Credit Cashback',
      schedule: '0 */2 * * *',
      redisKey: 'job:travel:cashback:lastRun',
      category: 'financial',
      expectedIntervalMin: 130,
    },
    {
      name: 'Wallet Ledger Reconciliation',
      schedule: '0 2 * * *',
      redisKey: 'job:wallet:recon:lastRun',
      category: 'financial',
      expectedIntervalMin: 1500,
    },
    {
      name: 'Stuck Transaction Recovery',
      schedule: '*/15 * * * *',
      redisKey: 'job:stuck:tx:lastRun',
      category: 'financial',
      expectedIntervalMin: 20,
    },
    {
      name: 'Merchant Liability Settlement',
      schedule: '0 1 * * *',
      redisKey: 'job:liability:settlement:lastRun',
      category: 'financial',
      expectedIntervalMin: 1500,
    },

    // ── BOOKING & ORDERS ──
    {
      name: 'Expire Unpaid Bookings',
      schedule: '*/15 * * * *',
      redisKey: 'job:expire:bookings:lastRun',
      category: 'bookings',
      expectedIntervalMin: 20,
    },
    {
      name: 'Mark Completed Bookings',
      schedule: '0 3 * * *',
      redisKey: 'job:complete:bookings:lastRun',
      category: 'bookings',
      expectedIntervalMin: 1500,
    },
    {
      name: 'Appointment Reminders',
      schedule: '0 * * * *',
      redisKey: 'job:appointment:reminders:lastRun',
      category: 'bookings',
      expectedIntervalMin: 70,
    },
    {
      name: 'Rebooking Nudge',
      schedule: '0 10 * * *',
      redisKey: 'job:rebook:nudge:lastRun',
      category: 'bookings',
      expectedIntervalMin: 1500,
    },

    // ── COINS & REWARDS ──
    {
      name: 'Expire Stale Clicks',
      schedule: '0 2 * * *',
      redisKey: 'job:expire:clicks:lastRun',
      category: 'coins',
      expectedIntervalMin: 1500,
    },
    {
      name: 'Expire Coins',
      schedule: '0 */2 * * *',
      redisKey: 'job:coins:expire:lastRun',
      category: 'coins',
      expectedIntervalMin: 130,
    },
    {
      name: 'Trial Coin Expiry',
      schedule: '0 * * * *',
      redisKey: 'job:trial:coin:expire:lastRun',
      category: 'coins',
      expectedIntervalMin: 70,
    },
    {
      name: 'Leaderboard Prize Distribution',
      schedule: '0 0 * * 1',
      redisKey: 'job:leaderboard:prize:lastRun',
      category: 'coins',
      expectedIntervalMin: 10100,
    },
    {
      name: 'Bill Payment Reminder',
      schedule: '0 9 * * *',
      redisKey: 'job:bill:reminder:lastRun',
      category: 'coins',
      expectedIntervalMin: 1500,
    },

    // ── MARKETING ──
    {
      name: 'Automated Campaign',
      schedule: '0 */6 * * *',
      redisKey: 'job:campaign:auto:lastRun',
      category: 'marketing',
      expectedIntervalMin: 380,
    },
    {
      name: 'Subscription Expiry',
      schedule: '0 6 * * *',
      redisKey: 'job:subscription:expire:lastRun',
      category: 'marketing',
      expectedIntervalMin: 1500,
    },
    {
      name: 'Subscription Downgrade',
      schedule: '0 7 * * *',
      redisKey: 'job:subscription:downgrade:lastRun',
      category: 'marketing',
      expectedIntervalMin: 1500,
    },

    // ── FRAUD & SECURITY ──
    {
      name: 'Fraud Detection',
      schedule: '*/30 * * * *',
      redisKey: 'job:fraud:detect:lastRun',
      category: 'security',
      expectedIntervalMin: 35,
    },
    {
      name: 'Device Pattern Analysis',
      schedule: '0 */4 * * *',
      redisKey: 'job:device:analysis:lastRun',
      category: 'security',
      expectedIntervalMin: 250,
    },
    {
      name: 'SLA Breach Monitor',
      schedule: '*/10 * * * *',
      redisKey: 'job:sla:breach:lastRun',
      category: 'security',
      expectedIntervalMin: 15,
    },

    // ── INVENTORY & OPERATIONS ──
    {
      name: 'Inventory Alerts',
      schedule: '0 */3 * * *',
      redisKey: 'job:inventory:alerts:lastRun',
      category: 'operations',
      expectedIntervalMin: 190,
    },
    {
      name: 'Merchant Quality Metrics',
      schedule: '0 4 * * *',
      redisKey: 'job:quality:metrics:lastRun',
      category: 'operations',
      expectedIntervalMin: 1500,
    },
  ];

  const jobs = await Promise.all(
    knownJobs.map(async (job: any) => {
      let lastRun: string | null = null;
      let lastError: string | null = null;
      let consecutiveFailures: number = 0;
      let status: 'healthy' | 'warning' | 'failing' | 'unknown' = 'unknown';

      try {
        // Read last run timestamp
        const lastRunValue = await redisService.get<string>(job.redisKey);
        if (lastRunValue) {
          const timestamp = parseInt(lastRunValue, 10);
          if (!isNaN(timestamp)) {
            lastRun = new Date(timestamp).toISOString();
          }
        }

        // Read failure counter
        const failureStr = await redisService.get<string>(`${job.redisKey}:consecutiveFailures`);
        consecutiveFailures = failureStr ? parseInt(failureStr, 10) : 0;

        // Read last error
        const errorValue = await redisService.get<string>(`${job.redisKey}:lastError`);
        lastError = errorValue || null;

        // Compute health status
        if (consecutiveFailures >= 3) {
          status = 'failing';
        } else if (lastRun) {
          const lastRunTime = new Date(lastRun).getTime();
          const nowTime = Date.now();
          const minutesSinceRun = (nowTime - lastRunTime) / 60000;
          const threshold1 = job.expectedIntervalMin * 2;
          const threshold2 = job.expectedIntervalMin * 4;

          if (minutesSinceRun <= threshold1) {
            status = 'healthy';
          } else if (minutesSinceRun <= threshold2) {
            status = 'warning';
          } else {
            status = 'failing';
          }
        } else {
          status = 'unknown';
        }
      } catch (e) {
        status = 'unknown';
      }

      return {
        name: job.name,
        schedule: job.schedule,
        scheduleHuman: cronToHuman(job.schedule),
        category: job.category || 'other',
        lastRun,
        lastError,
        consecutiveFailures,
        status,
        expectedIntervalMin: job.expectedIntervalMin,
      };
    }),
  );

  return jobs;
}

/**
 * Convert cron expression to human-readable string
 */
function cronToHuman(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;

  const [min, hour, dom, mon, dow] = parts;

  if (min.startsWith('*/')) {
    return `Every ${min.slice(2)} minutes`;
  }
  if (hour.startsWith('*/')) {
    return `Every ${hour.slice(2)} hours`;
  }
  if (min === '0' && hour === '*') {
    return 'Every hour';
  }
  if (min === '0' && dom === '*' && mon === '*' && dow === '*') {
    return `Daily at ${hour}:00`;
  }

  return cron;
}

/**
 * Format seconds uptime to human-readable string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * @route   GET /api/admin/metrics/events
 * @desc    Get business event metrics for dashboard
 * @access  Admin
 */
router.get(
  '/metrics/events',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const days = parseInt((req.query.days as string) || '7', 10);

      if (days < 1 || days > 90) {
        return res.status(400).json({
          success: false,
          message: 'Days must be between 1 and 90',
        });
      }

      const result: Record<string, number[]> = {};

      // Key events to track
      const eventKeys = [
        'user.signup',
        'user.login',
        'booking.created',
        'booking.completed',
        'booking.cancelled',
        'order.placed',
        'order.delivered',
        'payment.success',
        'payment.failure',
        'coins.earned',
        'coins.redeemed',
        'coins.expired',
        'trial.booked',
        'trial.completed',
        'bbps.initiated',
        'bbps.completed',
        'bbps.failed',
        'referral.rewarded',
        'merchant.onboarded',
        'fraud.flagged',
      ];

      const redisClient = redisService.getClient();

      // Build date keys once
      const dateKeys: string[] = [];
      for (let i = days - 1; i >= 0; i--) {
        dateKeys.push(new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      }

      // Fetch all event data in parallel (1 HMGET per day instead of 140+ sequential hGet calls)
      const dailyResults = await Promise.all(
        dateKeys.map(async (date) => {
          const hashKey = `events:daily:${date}`;
          const values = await redisClient?.hmGet(hashKey, eventKeys);
          return values || eventKeys.map(() => null);
        }),
      );

      // Reshape into { eventKey: number[] } format
      for (let keyIdx = 0; keyIdx < eventKeys.length; keyIdx++) {
        result[eventKeys[keyIdx]] = dailyResults.map((dayValues) => parseInt(dayValues[keyIdx] || '0', 10));
      }

      // Compute summary statistics for today using already-fetched data
      const todayValues = dailyResults[dailyResults.length - 1];
      const getToday = (eventKey: string) => {
        const idx = eventKeys.indexOf(eventKey);
        return idx >= 0 ? parseInt(todayValues[idx] || '0', 10) : 0;
      };
      const todayStats = {
        totalBookings: getToday('booking.created'),
        totalOrders: getToday('order.placed'),
        paymentSuccess: getToday('payment.success'),
        paymentFailure: getToday('payment.failure'),
        coinsEarned: getToday('coins.earned'),
        coinsRedeemed: getToday('coins.redeemed'),
        trialBooked: getToday('trial.booked'),
        newUsers: getToday('user.signup'),
        bbpsCompleted: getToday('bbps.completed'),
      };

      // Calculate health metrics
      const totalPayments = todayStats.paymentSuccess + todayStats.paymentFailure;
      const paymentSuccessRate =
        totalPayments > 0 ? ((todayStats.paymentSuccess / totalPayments) * 100).toFixed(2) : 'N/A';

      const coinsRatio =
        todayStats.coinsEarned > 0 ? (todayStats.coinsRedeemed / todayStats.coinsEarned).toFixed(2) : 'N/A';

      return sendSuccess(res, {
        events: result,
        days,
        summary: todayStats,
        health: {
          paymentSuccessRate,
          coinsEarnedVsRedeemedRatio: coinsRatio,
        },
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      logger.error('Failed to fetch event metrics:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch event metrics',
      });
    }
  }),
);

/**
 * @route   GET /api/admin/system/kill-switches
 * @desc    List all active kill switches
 * @access  Admin
 */
router.get(
  '/kill-switches',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { KillSwitchService } = await import('../../services/KillSwitchService');
      const switches = await KillSwitchService.listAllKillSwitches();
      return sendSuccess(res, { success: true, data: switches });
    } catch (err: any) {
      logger.error('Failed to fetch kill switches:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch kill switches',
      });
    }
  }),
);

/**
 * @route   POST /api/admin/system/kill-switches
 * @desc    Set a kill switch
 * @access  Admin
 */
router.post(
  '/kill-switches',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { KillSwitchService } = await import('../../services/KillSwitchService');
      const { scope, target, merchantId, campaignId, reason } = req.body;

      if (!scope || !target || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: scope, target, reason',
        });
      }

      if (scope === 'platform') {
        await KillSwitchService.setPlatformKill(target, reason);
      } else if (scope === 'merchant' && merchantId) {
        await KillSwitchService.setMerchantKill(merchantId, target, reason);
      } else if (scope === 'campaign' && campaignId) {
        await KillSwitchService.setCampaignKill(campaignId, reason);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid scope or missing required parameters',
        });
      }

      logger.info('[KILL_SWITCH] Kill switch activated:', {
        scope,
        target,
        merchantId,
        campaignId,
        reason,
        adminId: (req as any).user?.id,
      });

      return sendSuccess(res, { success: true, message: 'Kill switch activated' });
    } catch (err: any) {
      logger.error('Failed to set kill switch:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to set kill switch',
      });
    }
  }),
);

/**
 * @route   DELETE /api/admin/system/kill-switches/:scope/:target
 * @desc    Clear a kill switch
 * @access  Admin
 */
router.delete(
  '/kill-switches/:scope/:target',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { KillSwitchService } = await import('../../services/KillSwitchService');
      const { scope, target } = req.params;
      const { merchantId } = req.query;

      if (scope === 'platform') {
        await KillSwitchService.clearPlatformKill(target as any);
      } else if (scope === 'merchant' && merchantId) {
        await KillSwitchService.clearMerchantKill(merchantId as string, target as any);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid scope or missing required parameters',
        });
      }

      logger.info('[KILL_SWITCH] Kill switch cleared:', {
        scope,
        target,
        merchantId,
        adminId: (req as any).user?.id,
      });

      return sendSuccess(res, { success: true, message: 'Kill switch cleared' });
    } catch (err: any) {
      logger.error('Failed to clear kill switch:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear kill switch',
      });
    }
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// SLA Monitor — v3 Architecture Part 13
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/admin/system/sla-status
 * @desc    Live SLA status for all v3 merchant observability metrics.
 *          Polled by the admin SLA dashboard every 30s.
 * @access  Admin
 */
router.get(
  '/sla-status',
  asyncHandler(async (_req: Request, res: Response) => {
    const results: Record<string, any> = {};

    // ── 1. Customer Snapshot Freshness ───────────────────────────────────────
    try {
      const MerchantCustomerSnapshot = await import('../../models/MerchantCustomerSnapshot')
        .then((m: any) => m.default || m.MerchantCustomerSnapshot)
        .catch(() => null);

      if (MerchantCustomerSnapshot) {
        const oldest = await (MerchantCustomerSnapshot as any)
          .findOne()
          .sort({ updatedAt: 1 })
          .select('updatedAt merchantId')
          .lean();

        if (oldest) {
          const ageSeconds = Math.floor((Date.now() - new Date((oldest as any).updatedAt).getTime()) / 1000);
          results.customerSnapshot = {
            status: ageSeconds > 900 ? 'breach' : ageSeconds > 300 ? 'warning' : 'ok',
            ageSeconds,
            ageMinutes: Math.round(ageSeconds / 60),
            thresholdSec: 900,
            merchantId: (oldest as any).merchantId,
            checkedAt: new Date().toISOString(),
          };
        } else {
          results.customerSnapshot = {
            status: 'ok',
            ageSeconds: 0,
            ageMinutes: 0,
            thresholdSec: 900,
            checkedAt: new Date().toISOString(),
          };
        }
      } else {
        results.customerSnapshot = { status: 'unknown', reason: 'model_unavailable' };
      }
    } catch {
      results.customerSnapshot = { status: 'unknown', reason: 'check_failed' };
    }

    // ── 2. Merchant Event Queue Depth ─────────────────────────────────────────
    try {
      const { Queue } = await import('bullmq');
      const { bullmqRedis } = await import('../../config/bullmq-connection');
      const queue = new Queue('merchant-events', { connection: bullmqRedis });
      const [waiting, active, failed] = await Promise.all([
        queue.getWaitingCount().catch(() => 0),
        queue.getActiveCount().catch(() => 0),
        queue.getFailedCount().catch(() => 0),
      ]);
      await queue.close();

      results.merchantEventQueue = {
        status: waiting > 500 ? 'breach' : waiting > 200 ? 'warning' : 'ok',
        waiting,
        active,
        failed,
        threshold: 500,
        checkedAt: new Date().toISOString(),
      };
    } catch {
      results.merchantEventQueue = { status: 'unknown', reason: 'redis_unavailable' };
    }

    // ── 3. Daily Stats Availability ───────────────────────────────────────────
    try {
      const MerchantDailyStat = await import('../../models/MerchantDailyStat')
        .then((m: any) => m.default)
        .catch(() => null);

      if (MerchantDailyStat) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        const count = await (MerchantDailyStat as any).countDocuments({ date: yesterdayDate });
        results.dailyStats = {
          status: count === 0 ? 'breach' : 'ok',
          date: yesterdayDate,
          merchantCount: count,
          checkedAt: new Date().toISOString(),
        };
      } else {
        results.dailyStats = { status: 'unknown', reason: 'model_unavailable' };
      }
    } catch {
      results.dailyStats = { status: 'unknown', reason: 'check_failed' };
    }

    // ── 4. Broadcast Queue Depth ──────────────────────────────────────────────
    try {
      const { Queue } = await import('bullmq');
      const { bullmqRedis } = await import('../../config/bullmq-connection');
      const queue = new Queue('broadcasts', { connection: bullmqRedis });
      const [waiting, active] = await Promise.all([
        queue.getWaitingCount().catch(() => 0),
        queue.getActiveCount().catch(() => 0),
      ]);
      await queue.close();
      results.broadcastQueue = {
        status: waiting > 1000 ? 'warning' : 'ok',
        waiting,
        active,
        checkedAt: new Date().toISOString(),
      };
    } catch {
      results.broadcastQueue = { status: 'unknown', reason: 'redis_unavailable' };
    }

    // ── Overall status ────────────────────────────────────────────────────────
    const allStatuses = Object.values(results).map((r: any) => r.status);
    const overallStatus = allStatuses.includes('breach')
      ? 'breach'
      : allStatuses.includes('warning')
        ? 'warning'
        : allStatuses.includes('unknown')
          ? 'degraded'
          : 'ok';

    return sendSuccess(res, { overallStatus, metrics: results, generatedAt: new Date().toISOString() });
  }),
);

/**
 * @route   GET /api/admin/system/merchant-flag-overrides
 * @desc    List all merchants that have at least one MerchantFeatureFlag override set.
 *          Used by the admin Feature Flags "Merchant Overrides" tab.
 * @access  Admin
 */
router.get(
  '/merchant-flag-overrides',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { MerchantFeatureFlag } = await import('../../models/MerchantFeatureFlag');
      const page = parseInt(String(req.query.page || '1'), 10);
      const limit = parseInt(String(req.query.limit || '20'), 10);
      const skip = (page - 1) * limit;

      const [overrides, total] = await Promise.all([
        (MerchantFeatureFlag as any).find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
        (MerchantFeatureFlag as any).countDocuments(),
      ]);

      return sendSuccess(res, {
        overrides,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch {
      return sendSuccess(res, { overrides: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    }
  }),
);

export default router;

// ===== RECONCILIATION ENDPOINTS =====

/**
 * @route   GET /api/admin/system/reconciliation/issues
 * @desc    Get open reconciliation issues with pagination
 * @access  Admin
 */
router.get(
  '/reconciliation/issues',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const ReconciliationIssue = (await import('../../models/ReconciliationIssue')).default;

      const status = (req.query.status as string) || 'open';
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      const issues = await ReconciliationIssue.find({ status })
        .sort({ detectedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name phone email')
        .populate('orderId', 'orderNumber totals status')
        .populate('bookingId', 'bookingId status')
        .lean();

      const total = await ReconciliationIssue.countDocuments({ status });

      return sendSuccess(res, {
        issues,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      logger.error('Failed to fetch reconciliation issues:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch reconciliation issues' });
    }
  }),
);

/**
 * @route   PATCH /api/admin/system/reconciliation/issues/:id
 * @desc    Update reconciliation issue status
 * @access  Admin
 */
router.patch(
  '/reconciliation/issues/:id',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const ReconciliationIssue = (await import('../../models/ReconciliationIssue')).default;
      const { status, note } = req.body;

      if (!['open', 'investigating', 'resolved', 'ignored'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const userId = (req as any).user?.id;
      const issue = await ReconciliationIssue.findByIdAndUpdate(
        req.params.id,
        {
          status,
          resolvedBy: userId,
          resolvedAt: status !== 'open' ? new Date() : undefined,
        },
        { new: true },
      );

      if (!issue) {
        return res.status(404).json({ success: false, message: 'Issue not found' });
      }

      logger.info('[RECONCILIATION] Issue updated:', {
        issueId: req.params.id,
        newStatus: status,
        updatedBy: userId,
      });

      return sendSuccess(res, issue);
    } catch (err) {
      logger.error('Failed to update reconciliation issue:', err);
      return res.status(500).json({ success: false, message: 'Failed to update issue' });
    }
  }),
);

/**
 * @route   POST /api/admin/system/reconciliation/run
 * @desc    Manually trigger reconciliation job
 * @access  Admin
 */
router.post(
  '/reconciliation/run',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { triggerManualReconciliation } = await import('../../jobs/reconciliationJob');

      const userId = (req as any).user?.id;
      logger.info('[RECONCILIATION] Manual run triggered by admin:', { adminId: userId });

      const result = await triggerManualReconciliation();

      return sendSuccess(res, {
        success: true,
        message: 'Reconciliation completed',
        result: {
          discrepancies: result.summary.totalDiscrepancies,
          criticalCount: result.summary.criticalCount,
          highCount: result.summary.highCount,
          totalDifference: result.summary.totalDifferenceAmount,
          issuesCreated: result.issuesCreated,
          duration: result.duration,
          timestamp: result.timestamp,
        },
      });
    } catch (err: any) {
      logger.error('Failed to trigger manual reconciliation:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to trigger reconciliation',
      });
    }
  }),
);

/**
 * @route   GET /api/admin/system/reconciliation/stats
 * @desc    Get reconciliation statistics
 * @access  Admin
 */
router.get(
  '/reconciliation/stats',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const ReconciliationIssue = (await import('../../models/ReconciliationIssue')).default;

      const openCount = await ReconciliationIssue.countDocuments({ status: 'open' });
      const investigatingCount = await ReconciliationIssue.countDocuments({ status: 'investigating' });
      const resolvedCount = await ReconciliationIssue.countDocuments({ status: 'resolved' });

      const recentIssues = await ReconciliationIssue.find({}).sort({ detectedAt: -1 }).limit(1).lean();

      const latestRun = recentIssues[0]?.detectedAt;

      return sendSuccess(res, {
        stats: {
          open: openCount,
          investigating: investigatingCount,
          resolved: resolvedCount,
          total: openCount + investigatingCount + resolvedCount,
        },
        latestRun,
      });
    } catch (err) {
      logger.error('Failed to fetch reconciliation stats:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
  }),
);

/**
 * @route   GET /api/admin/system/merchant-live-status
 * @desc    Real-time overview of all merchants — active sessions, pending orders,
 *          broadcast queue depth, and health scores for the admin live-status screen.
 * @access  Admin
 */
router.get(
  '/merchant-live-status',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const { getRedis } = await import('../../config/redis-pool');
      const { Merchant } = await import('../../models/Merchant');
      const { default: TableSession } = await import('../../models/TableSession');
      const { Order } = await import('../../models/Order');

      // Fetch all active merchants
      const merchants = (await Merchant.find({ isActive: true }).select('_id businessName city').lean()) as any[];

      const redis = getRedis();

      const merchantEntries = await Promise.all(
        merchants.slice(0, 200).map(async (m: any) => {
          const mId = m._id.toString();

          // Active table sessions
          let activeSessions = 0;
          try {
            activeSessions = await TableSession.countDocuments({
              merchantId: mId,
              status: { $in: ['active', 'bill_requested'] },
            });
          } catch {
            /* ignore */
          }

          // Pending orders
          let pendingOrders = 0;
          try {
            pendingOrders = await Order.countDocuments({
              merchant: mId,
              status: { $in: ['pending', 'confirmed', 'preparing'] },
            });
          } catch {
            /* ignore */
          }

          // Broadcast queue depth (Redis list length)
          let broadcastQueueDepth = 0;
          try {
            const queueKey = `broadcast:queue:${mId}`;
            const len = await redis.llen(queueKey);
            broadcastQueueDepth = len ?? 0;
          } catch {
            /* ignore */
          }

          // Health score from Redis cache (set by merchantPercentileService)
          let healthScore: number | null = null;
          try {
            const cached = await redis.get(`merchant:percentile:${mId}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              healthScore = parsed.percentileRank ?? null;
            }
          } catch {
            /* ignore */
          }

          // Last seen (Redis presence key, set by merchant app on API calls)
          let lastSeenAt = new Date(0).toISOString();
          try {
            const ts = await redis.get(`merchant:lastseen:${mId}`);
            if (ts) lastSeenAt = ts;
          } catch {
            /* ignore */
          }

          // Derive status from last-seen timestamp
          const seenMs = new Date(lastSeenAt).getTime();
          const ageMins = (Date.now() - seenMs) / 60_000;
          const status: 'online' | 'idle' | 'offline' = ageMins < 5 ? 'online' : ageMins < 60 ? 'idle' : 'offline';

          return {
            merchantId: mId,
            businessName: m.businessName ?? 'Unknown',
            city: m.city ?? '',
            activeSessions,
            pendingOrders,
            broadcastQueueDepth,
            healthScore,
            lastSeenAt,
            status,
          };
        }),
      );

      const summary = {
        totalOnline: merchantEntries.filter((e) => e.status === 'online').length,
        totalIdle: merchantEntries.filter((e) => e.status === 'idle').length,
        totalOffline: merchantEntries.filter((e) => e.status === 'offline').length,
        totalActiveSessions: merchantEntries.reduce((s, e) => s + e.activeSessions, 0),
        totalPendingOrders: merchantEntries.reduce((s, e) => s + e.pendingOrders, 0),
        generatedAt: new Date().toISOString(),
      };

      return sendSuccess(res, { merchants: merchantEntries, summary });
    } catch (err: any) {
      logger.error('[Admin] merchant-live-status failed', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }),
);
