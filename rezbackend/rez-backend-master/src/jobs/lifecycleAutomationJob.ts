import cron from 'node-cron';
import { User } from '../models/User';
import { NotificationService } from '../services/notificationService';
import redisService from '../services/redisService';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('lifecycle-automation');

const LOCK_KEY = 'job:lifecycle-automation';
const LOCK_TTL = 900; // 15 minutes

// ─── Segment Definitions ────────────────────────────────────

interface UserSegment {
  name: string;
  query: Record<string, any>;
  notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'promotional';
    category: 'general' | 'promotional' | 'reminder';
  };
  maxPerRun: number;
}

const SEGMENTS: UserSegment[] = [
  // ── CARLOS retention fix: Day 2 nudge ──────────────────────────────────────
  // The critical "did they come back?" window. Users who signed up 24–48 h ago
  // and have not logged in since their first session need a specific hook back,
  // not a generic "we miss you". Surface the welcome coins they received to give
  // them a concrete reason to return.
  {
    name: 'day2_no_return',
    query: {
      lastLoginAt: {
        $lte: new Date(Date.now() - 24 * 60 * 60 * 1000),   // Not seen in last 24 h
        $gt:  new Date(Date.now() - 48 * 60 * 60 * 1000),   // But was here 24-48 h ago
      },
      isOnboarded: true,
      isActive: { $ne: false },
    },
    notification: {
      title: 'Your 50 welcome coins are waiting',
      message: 'You earned coins when you joined — use them on your first purchase today!',
      type: 'info',
      category: 'reminder',
    },
    maxPerRun: 400,
  },

  // ── CARLOS retention fix: Day 3 habit formation nudge ─────────────────────
  // Day 3 is the last cheap window before churn accelerates.  Personalise to
  // the nearest-store angle — geo-contextual messages outperform generic ones
  // by ~35% open-rate.  Backend currently stores profile.location on the user
  // model so nearby store name lookup is feasible (see sendUrgencyPushNotifications
  // in expireCoins.ts for the pattern).
  // TODO: extend processSegment() to accept an optional messageBuilder fn so the
  //       notification body can include the user's nearest store name.
  {
    name: 'day3_habit_nudge',
    query: {
      lastLoginAt: {
        $lte: new Date(Date.now() - 48 * 60 * 60 * 1000),   // Not seen in last 48 h
        $gt:  new Date(Date.now() - 72 * 60 * 60 * 1000),   // But was here 48-72 h ago
      },
      isOnboarded: true,
      isActive: { $ne: false },
    },
    notification: {
      title: 'Stores near you have exclusive deals',
      message: 'Open the app to see cashback offers at stores in your area before they expire.',
      type: 'promotional',
      category: 'promotional',
    },
    maxPerRun: 400,
  },

  {
    name: 'dormant_7d',
    query: {
      lastLoginAt: {
        $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        $gt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      isOnboarded: true,
      isActive: { $ne: false },
    },
    notification: {
      title: 'We miss you!',
      message: 'Your favourite stores have new cashback offers waiting. Come back and save!',
      type: 'promotional',
      category: 'promotional',
    },
    maxPerRun: 500,
  },
  {
    name: 'lapsed_30d',
    query: {
      lastLoginAt: {
        $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $gt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      isOnboarded: true,
      isActive: { $ne: false },
    },
    notification: {
      title: 'Your coins are waiting',
      message: 'You have unused rewards. Visit a store today and earn bonus cashback!',
      type: 'promotional',
      category: 'promotional',
    },
    maxPerRun: 200,
  },
  {
    name: 'at_risk_no_order',
    query: {
      lastLoginAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      'stats.totalOrders': { $eq: 0 },
      isOnboarded: true,
      createdAt: {
        $lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Signed up >3 days ago
      },
    },
    notification: {
      title: 'Make your first order',
      message: 'Discover stores near you and earn cashback on your first purchase!',
      type: 'info',
      category: 'reminder',
    },
    maxPerRun: 300,
  },
];

// ─── Redis dedup key prefix (prevents re-notifying same user in same segment within 7 days)
const DEDUP_PREFIX = 'lifecycle:notified';
const DEDUP_TTL = 7 * 24 * 60 * 60; // 7 days

// ─── Main Job ───────────────────────────────────────────────

async function runLifecycleAutomation(): Promise<void> {
  let lockToken: string | null = null;

  try {
    lockToken = await redisService.acquireLock(LOCK_KEY, LOCK_TTL);
    if (!lockToken) {
      logger.info('Lifecycle automation skipped — lock held');
      return;
    }

    logger.info('Starting lifecycle automation...');
    const results: Record<string, { found: number; notified: number; skipped: number }> = {};

    for (const segment of SEGMENTS) {
      const segResult = await processSegment(segment);
      results[segment.name] = segResult;
      logger.info(`Segment ${segment.name}:`, segResult);
    }

    logger.info('Lifecycle automation complete', results);
  } catch (error) {
    logger.error('Lifecycle automation failed', error as Error);
  } finally {
    if (lockToken) {
      await redisService.releaseLock(LOCK_KEY, lockToken);
    }
  }
}

async function processSegment(segment: UserSegment): Promise<{
  found: number;
  notified: number;
  skipped: number;
}> {
  let notified = 0;
  let skipped = 0;

  try {
    const users = await User.find(segment.query)
      .select('_id')
      .limit(segment.maxPerRun)
      .lean();

    for (const user of users) {
      const userId = (user as any)._id.toString();
      const dedupKey = `${DEDUP_PREFIX}:${segment.name}:${userId}`;

      // Check if already notified in this window
      try {
        const alreadySent = await redisService.get(dedupKey);
        if (alreadySent) {
          skipped++;
          continue;
        }
      } catch {
        // Redis error — skip dedup, proceed cautiously
      }

      // Send notification (fire-and-forget)
      try {
        await NotificationService.createNotification({
          userId,
          title: segment.notification.title,
          message: segment.notification.message,
          type: segment.notification.type,
          category: segment.notification.category,
          priority: 'medium',
          source: 'automated',
        });

        // Mark as notified
        await redisService.set(dedupKey, '1', DEDUP_TTL);
        notified++;
      } catch (err) {
        logger.error(`Failed to notify user ${userId} for segment ${segment.name}`, err as Error);
      }
    }

    return { found: users.length, notified, skipped };
  } catch (error) {
    logger.error(`Failed to process segment ${segment.name}`, error as Error);
    return { found: 0, notified: 0, skipped: 0 };
  }
}

// ─── Cron Schedule ──────────────────────────────────────────

/**
 * Initialize lifecycle automation — runs daily at 10:00 AM.
 * Sends targeted nudges to dormant, lapsed, and at-risk users.
 */
export function initializeLifecycleAutomationJob(): void {
  cron.schedule('0 10 * * *', () => {
    runLifecycleAutomation().catch(err => {
      logger.error('Unhandled error in lifecycle automation', err as Error);
    });
  });
}

export { runLifecycleAutomation };
export default initializeLifecycleAutomationJob;
