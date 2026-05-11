import type { ActivityEvent } from '../gamificationEventBus';
import { logger } from '../../config/logger';

/**
 * Streak Handler
 *
 * Updates user streaks based on login and activity events.
 * Sends a push notification when a streak milestone is reached.
 */

const EVENT_TO_STREAK_TYPE: Record<string, string> = {
  // Login streak
  login: 'login',
  daily_checkin: 'login',
  // Order streak
  order_placed: 'order',
  order_delivered: 'order',
  // Review streak
  review_submitted: 'review',
  // Savings streak — ANY saving action counts
  store_payment_confirmed: 'savings',
  bill_uploaded: 'savings',
  bill_payment_confirmed: 'savings', // BBPS payment triggers savings streak
  deal_locked: 'savings',
  cashback_earned: 'savings',
  // Store visits count toward savings streak
  visit_completed: 'savings',
  visit_checked_in: 'savings',
};

export function registerStreakHandler(eventBus: any): void {
  eventBus.onAll(async (event: ActivityEvent) => {
    const streakType = EVENT_TO_STREAK_TYPE[event.type];
    if (!streakType) return;

    try {
      const streakService = (await import('../../services/streakService')).default;

      if (!streakService || typeof streakService.updateStreak !== 'function') return;

      const { streak, milestoneReached } = await streakService.updateStreak(
        event.userId,
        streakType as 'login' | 'order' | 'review' | 'savings',
      );

      // Notify user when a new milestone is reachable so they know to claim
      if (milestoneReached?.canClaim) {
        try {
          const pushService = (await import('../../services/pushNotificationService')).default;
          await pushService.sendPushToUser(event.userId, {
            title: `🔥 Streak Milestone: ${milestoneReached.name}!`,
            body: `You've hit a ${streak.currentStreak}-day streak — claim your ${milestoneReached.coins} coins now!`,
            data: {
              type: 'streak_milestone',
              streakType,
              milestoneDay: milestoneReached.day,
              coins: milestoneReached.coins,
              badge: milestoneReached.badge ?? null,
            },
            channelId: 'streak',
            priority: 'high',
          });
        } catch (notifyErr) {
          // Non-blocking — notification failure must not fail the streak update
          logger.warn('[STREAK HANDLER] Failed to send milestone notification', {
            userId: event.userId,
            streakType,
            error: (notifyErr as Error).message,
          });
        }
      }
    } catch (error) {
      logger.error(`[STREAK HANDLER] Error processing ${event.type} for user ${event.userId}:`, error);
    }
  });

  logger.info('[STREAK HANDLER] Registered streak handler');
}
