// @ts-nocheck
/**
 * config/cronJobs.ts — Cron job initialization
 * Extracted from server.ts for maintainability.
 */
import { logger } from './logger';
import { isGamificationEnabled } from './gamificationFeatureFlags';
import redisService from '../services/redisService';

// Import job initializers
import partnerLevelMaintenanceService from '../services/partnerLevelMaintenanceService';
import { startRefundReversalJob } from '../jobs/refundReversalJob';
// initializeTrialExpiryJob, initializeSessionCleanupJob, initializeCoinExpiryJob,
// initializeCashbackJobs, initializeTravelCashbackJobs, initializeInventoryAlertJob,
// initializeDealExpiryJob, initializeVoucherExpiryJob, initializeTableBookingExpiryJob
// — all removed (double-scheduling with ScheduledJobService, BUG-008 pattern)
// startReconciliationJob / startReservationCleanup — removed (BUG-008 / BUG-015)
import { initializeLeaderboardRefreshJob } from '../jobs/leaderboardRefreshJob';
import { initializeBillVerificationJob } from '../jobs/billVerificationJob';
import { startCreatorJobs } from '../jobs/creatorJobs';
import { initializeStreakResetJob } from '../jobs/streakResetJob';
import { initBonusCampaignJobs } from '../jobs/bonusCampaignJob';
import { initChallengeLifecycleJobs } from '../jobs/challengeLifecycleJob';
import { initializeTournamentLifecycleJobs } from '../jobs/tournamentLifecycleJob';
import { initializePrizeDistributionJob } from '../jobs/leaderboardPrizeDistributionJob';
import { runStuckTransactionRecovery } from '../jobs/stuckTransactionRecoveryJob';
import { runGiftDelivery } from '../jobs/giftDeliveryJob';
import { runGiftExpiry } from '../jobs/giftExpiryJob';
import { runSurpriseDropExpiry } from '../jobs/surpriseDropExpiryJob';
import { runPartnerEarningsSnapshot } from '../jobs/partnerEarningsSnapshotJob';
import { runDevicePatternAnalysis } from '../jobs/devicePatternAnalysisJob';
import { initializeReferralExpiryJob } from '../jobs/referralExpiryJob';
import { initializePriveInviteExpiryJob } from '../jobs/priveInviteExpiryJob';
import { runPushReceiptProcessing } from '../jobs/pushReceiptJob';
import pushNotificationService from '../services/pushNotificationService';
import { initializeNearbyFlashSaleNotificationJob } from '../jobs/nearbyFlashSaleNotificationJob';
import { initializeSmartDemandPushJob } from '../jobs/smartDemandPushJob';
import { initializeRezCapitalScoringJob } from '../jobs/rezCapitalScoringJob';
import { initializeWeeklySummaryJob } from '../jobs/weeklySummaryJob';
import { seedWalletFeatureFlags } from '../services/walletFeatureService';
import { featureFlagService, startFeatureFlagInvalidationSubscriber } from '../services/featureFlagService';
import { initializeSLABreachJob } from '../jobs/slaBreachJob';
import {
  initializeIntegrationReconciliationJob,
  getIntegrationReconciliationTask,
} from '../jobs/integrationReconciliationJob';
import { ScheduledJobService } from '../services/ScheduledJobService';
import AuditRetentionService from '../services/AuditRetentionService';
import { ReportService } from '../merchantservices/ReportService';
import { initializeTagOffersJob } from '../jobs/tagOffersJob';
import { scheduleReconciliation, reconcilePendingRecharges } from '../jobs/paymentReconciliationJob';
import { scheduleAnalyticsSummary } from '../jobs/analyticsSummaryJob';
import { scheduleDailyActionsJob } from '../jobs/dailyActionsJob';
import { scheduleGrowthScoreJob } from '../jobs/growthScoreJob';
import { startCampaignJob } from '../jobs/automatedCampaignJob';
import { startTryFeedRefreshJob } from '../jobs/tryFeedRefreshJob';
import { startSurpriseTrialJob } from '../jobs/surpriseTrialJob';
import { startLeaderboardJob } from '../jobs/leaderboardJob';
import { startAnomalyDetectionJob } from '../jobs/anomalyDetectionJob';
import { startTrialCoinExpiryJob } from '../jobs/trialCoinExpiryJob';
import { startAppointmentReminderJob } from '../jobs/appointmentReminderJob';
import { startRebookingNudgeJob } from '../jobs/rebookingNudgeJob';
import { computeYesterdayStats } from '../jobs/computeMerchantDailyStats';
import startRestore86ItemsJob from '../jobs/restore86ItemsJob';
import { startGoldSipJob } from '../jobs/goldSipJob';
import { getLiveGoldPriceInr } from '../services/goldProviderService';
import { initializeReEngagementJob } from '../jobs/reEngagementTriggerJob';
import { initializeReferralCompletionJob } from '../jobs/referralCompletionNotificationJob';
import { initializeCoinExpiryNotificationJob } from '../jobs/coinExpiryNotificationJob';
import { initializeSlaMonitorJob } from '../jobs/slaMonitorJob';
import { startAlertMonitoring, stopAlertMonitoring, markShuttingDown } from './alerts';
import { initializeStuckPaymentPipelineJob } from '../jobs/stuckPaymentPipelineJob';
import { initializeCashbackHoldCreditJob } from '../jobs/cashbackHoldCreditJob';
import { initializeFailedRefundRetryJob } from '../jobs/failedRefundRetryJob';
import { initializeStuckOrderCancelJob } from '../jobs/stuckOrderCancelJob';
import { scheduleFraudDetection } from '../jobs/fraudDetection';
import { scheduleCoinExpiry, initializeCoinExpiryJob } from '../jobs/coinExpiry';
import { expireWalletCoinBuckets } from '../jobs/expireWalletCoinBuckets';
import { initializeMerchantPayoutJob } from '../jobs/merchantPayoutJob';
import { initExperienceRewardCron } from '../jobs/experienceRewardCron';

/**
 * OMAR: memory leak mitigation — store all cron instances for graceful shutdown
 * Each scheduleCronJob() returns a task that must be stopped to prevent lingering intervals
 */
const activeCronJobs: any[] = [];

// Module-level cron instance — initialised lazily on first use so the module can
// be imported without requiring node-cron to be fully loaded at import time.
let _cron: any = null;
function getCron(): any {
  if (!_cron) _cron = require('node-cron');
  return _cron;
}

/**
 * OMAR: helper to schedule a cron job and store the task reference for shutdown.
 * DB-AUDIT-3 FIX: exported at module level so external job files (e.g. orderLifecycleJobs)
 * can register their tasks in the shared activeCronJobs registry and have them stopped
 * cleanly during SIGTERM/SIGINT shutdown.
 */
export const scheduleCronJob = (schedule: string, callback: () => Promise<void>, description?: string) => {
  try {
    const task = getCron().schedule(schedule, callback);
    activeCronJobs.push(task);
    if (description) {
      logger.debug(`[CRON] Scheduled: ${description}`);
    }
    return task;
  } catch (err) {
    logger.error(`[CRON] Failed to schedule cron job: ${description || schedule}`, err);
    return null;
  }
};

/**
 * Initializes ALL cron jobs and background services.
 * Called from startServer() after DB + Redis are connected.
 */
export async function initializeCronJobs(): Promise<void> {
  // Declare cron once at function scope (used by multiple jobs below)
  const cron = getCron();

  // Initialize report service
  try {
    ReportService.initialize();
  } catch (err: any) {
    logger.error('[CRON] Report service failed to initialize:', err);
  }

  // Partner level maintenance cron jobs
  // BAK-GATEWAY-024 FIX: Wrap startAll() in try/catch so a failing service doesn't crash initializeCronJobs
  logger.info('Initializing partner level maintenance...');
  try {
    partnerLevelMaintenanceService.startAll();
    logger.info('Partner level maintenance cron jobs started');
  } catch (err: any) {
    logger.error('[CRON] Partner level maintenance failed to start:', err);
  }

  // Sprint 7: Fraud detection — coin velocity analysis (daily)
  try {
    scheduleFraudDetection();
    logger.info('[CRON] Fraud detection job scheduled (daily)');
  } catch (err: any) {
    logger.error('[CRON] Fraud detection job failed to start:', err);
  }

  // Sprint 8: Coin expiry — 7-day warnings + hard expiry (daily 1 AM)
  try {
    scheduleCoinExpiry(scheduleCronJob);
    logger.info('[CRON] Coin expiry job scheduled (daily at 1 AM)');
  } catch (err: any) {
    logger.error('[CRON] Coin expiry job failed to start:', err);
  }

  // Branded coin expiry enforcement — marks brandedCoins/coins isActive=false (daily 2 AM)
  try {
    initializeCoinExpiryJob(null, scheduleCronJob);
    logger.info('[CRON] Branded coin expiry enforcement job scheduled (daily at 2 AM)');
  } catch (err: any) {
    logger.error('[CRON] Branded coin expiry enforcement job failed to start:', err);
  }

  // C3 FIX: Wallet bucket coin expiry — zeroes Wallet.coins[] subdocs whose expiryDate has passed.
  // Previously registered but never imported/called in cronJobs.ts.
  // Staggered 30 min after branded job to avoid concurrent Wallet document contention.
  scheduleCronJob(
    '30 2 * * *',
    async () => {
      await expireWalletCoinBuckets();
    },
    'wallet_coin_bucket_expiry',
  );
  logger.info('[CRON] Wallet coin bucket expiry registered (daily at 2:30 AM)');

  // Wallet reconciliation — every 6 hours, checks wallet balance vs CoinTransaction sum
  try {
    const { runReconciliation } = require('../jobs/reconciliationJob');
    if (typeof runReconciliation === 'function') {
      scheduleCronJob('0 */6 * * *', runReconciliation, 'wallet_reconciliation');
      logger.info('[CRON] Wallet reconciliation job registered (every 6 hours)');
    }
  } catch (e) {
    logger.warn('[CRON] Could not register reconciliation job', e);
  }

  // The following jobs are all registered in ScheduledJobService (BullMQ repeatable jobs)
  // and must NOT be registered here via node-cron to prevent double-execution (BUG-008 pattern).
  // Canonical registrations are in src/services/ScheduledJobService.ts JOB_DEFINITIONS:
  //   trial-expiry-notification, cleanup-expired-sessions, expire-coins,
  //   credit-cashback, expire-clicks, travel-credit-cashback, travel-expire-unpaid,
  //   travel-mark-completed, inventory-alerts, expire-deal-redemptions,
  //   expire-voucher-redemptions, expire-table-bookings

  // Cashback 24h/48h hold auto-credit — credits cashbacks once creditableAt has elapsed
  // (this one is NOT in ScheduledJobService, so it stays here)
  initializeCashbackHoldCreditJob();

  // Refund reversal job (processes pending refunds — not in ScheduledJobService)
  startRefundReversalJob();
  logger.info('Refund reversal job started (every 5 minutes)');

  // Reconciliation job — already scheduled above via scheduleCronJob('0 */6 * * *', runReconciliation)
  // startReconciliationJob() removed to prevent double-scheduling (BUG-008)

  // Reservation cleanup job — BUG-015 FIX: startReservationCleanup() removed.
  // It registered a node-cron job (*/5 * * * *) that fired at the same time as
  // the identical BullMQ repeatable job in ScheduledJobService. The BullMQ job
  // is canonical (has distributed lock, retry, and observability). Same pattern
  // as BUG-008 where startReconciliationJob() was removed above.

  // Leaderboard refresh job
  if (isGamificationEnabled('leaderboard')) {
    initializeLeaderboardRefreshJob();
    logger.info('Leaderboard refresh job started (runs every 5 min)');
  }

  // Bill verification job
  try {
    initializeBillVerificationJob();
    logger.info('Bill verification job started (runs every 10 min)');
  } catch (err: any) {
    logger.error('[CRON] Bill verification job failed to start:', err);
  }

  // Payment reconciliation job
  try {
    scheduleReconciliation();
    logger.info('Payment reconciliation job started (runs every 10 min)');
  } catch (err: any) {
    logger.error('[CRON] Payment reconciliation job failed to start:', err);
  }

  // Stuck payment pipeline recovery (Razorpay refund retry, amount-mismatch alerts, stuck pipeline alerts)
  try {
    initializeStuckPaymentPipelineJob(cron, scheduleCronJob);
    logger.info('Stuck payment pipeline recovery job started (runs every 15 min)');
  } catch (err: any) {
    logger.error('[CRON] Stuck payment pipeline recovery job failed to start:', err);
  }

  // Creator program background jobs
  try {
    startCreatorJobs();
    logger.info('Creator jobs started (trending, stats, conversions, tiers)');
  } catch (err: any) {
    logger.error('[CRON] Creator jobs failed to start:', err);
  }

  // Streak reset job (resets broken streaks daily at 00:05 UTC)
  if (isGamificationEnabled('streaks')) {
    try {
      initializeStreakResetJob();
      logger.info('Streak reset job started (runs daily at 00:05 UTC)');
    } catch (err: any) {
      logger.error('[CRON] Streak reset job failed to start:', err);
    }
  }

  // Offer auto-tagging (trending/popular/expiring — runs hourly)
  try {
    initializeTagOffersJob();
  } catch (err: any) {
    logger.error('[CRON] Tag offers job failed to start:', err);
  }

  // Bonus campaign jobs (status transitions every 5m, expire claims every 30m)
  if (isGamificationEnabled('bonusZones')) {
    try {
      initBonusCampaignJobs();
      logger.info('Bonus campaign jobs started (transitions: 5m, expire claims: 30m)');
    } catch (err: any) {
      logger.error('[CRON] Bonus campaign jobs failed to start:', err);
    }
  }

  // Challenge lifecycle jobs (status transitions every 5m, cleanup every 30m)
  if (isGamificationEnabled('challenges')) {
    try {
      initChallengeLifecycleJobs();
      logger.info('Challenge lifecycle jobs started (transitions: 5m, cleanup: 30m)');
    } catch (err: any) {
      logger.error('[CRON] Challenge lifecycle jobs failed to start:', err);
    }
  }

  // Tournament lifecycle jobs (activation + completion + prize distribution)
  if (isGamificationEnabled('tournaments')) {
    try {
      initializeTournamentLifecycleJobs();
      logger.info('Tournament lifecycle jobs started (activation: 5m, completion: 5m)');
    } catch (err: any) {
      logger.error('[CRON] Tournament lifecycle jobs failed to start:', err);
    }
  }

  // ── Wallet production-readiness jobs with distributed locks ──
  // cron already declared at top of function

  // Stuck transaction recovery — every 15 min, one pod only
  scheduleCronJob(
    '*/15 * * * *',
    async () => {
      const lock = await redisService.acquireLock('stuck_tx_recovery', 600);
      if (!lock) return;
      try {
        await runStuckTransactionRecovery();
      } catch (e) {
        logger.error('[JOB] stuckTransactionRecovery:', e);
      } finally {
        await redisService.releaseLock('stuck_tx_recovery', lock);
      }
    },
    'Stuck transaction recovery',
  );

  // Gift delivery — every 5 min, one pod only
  scheduleCronJob(
    '*/5 * * * *',
    async () => {
      const lock = await redisService.acquireLock('gift_delivery', 240);
      if (!lock) return;
      try {
        await runGiftDelivery();
      } catch (e) {
        logger.error('[JOB] giftDelivery:', e);
      } finally {
        await redisService.releaseLock('gift_delivery', lock);
      }
    },
    'Gift delivery',
  );

  // Gift expiry — daily 2:30 AM, one pod only
  scheduleCronJob('30 2 * * *', async () => {
    const lock = await redisService.acquireLock('gift_expiry', 3600);
    if (!lock) return;
    try {
      await runGiftExpiry();
    } catch (e) {
      logger.error('[JOB] giftExpiry:', e);
    } finally {
      await redisService.releaseLock('gift_expiry', lock);
    }
  });

  // Surprise drop expiry — hourly, one pod only
  scheduleCronJob('0 * * * *', async () => {
    const lock = await redisService.acquireLock('surprise_drop_expiry', 3000);
    if (!lock) return;
    try {
      await runSurpriseDropExpiry();
    } catch (e) {
      logger.error('[JOB] surpriseDropExpiry:', e);
    } finally {
      await redisService.releaseLock('surprise_drop_expiry', lock);
    }
  });

  // Partner earnings snapshot — daily 1 AM, one pod only
  scheduleCronJob('0 1 * * *', async () => {
    const lock = await redisService.acquireLock('partner_earnings_snapshot', 7200);
    if (!lock) return;
    try {
      await runPartnerEarningsSnapshot();
    } catch (e) {
      logger.error('[JOB] partnerEarningsSnapshot:', e);
    } finally {
      await redisService.releaseLock('partner_earnings_snapshot', lock);
    }
  });

  // Push receipt processing — every 15 min (offset by 7 min), one pod only
  scheduleCronJob('7,22,37,52 * * * *', async () => {
    const lock = await redisService.acquireLock('push_receipt_processing', 600);
    if (!lock) return;
    try {
      await runPushReceiptProcessing();
    } catch (e) {
      logger.error('[JOB] pushReceiptProcessing:', e);
    } finally {
      await redisService.releaseLock('push_receipt_processing', lock);
    }
  });

  // Expo push receipt checking — every 30 min, one pod only
  // Checks delivery receipts and removes invalid/expired push tokens
  scheduleCronJob(
    '*/30 * * * *',
    async () => {
      const lock = await redisService.acquireLock('push_receipt_check', 600);
      if (!lock) return;
      try {
        const result = await pushNotificationService.handleReceipts();
        logger.info(`[JOB] Push receipt check completed: ${result.checked} checked, ${result.invalidRemoved} removed`);
      } catch (e) {
        logger.error('[JOB] pushReceiptCheck:', e);
      } finally {
        await redisService.releaseLock('push_receipt_check', lock);
      }
    },
    'Expo push receipt check',
  );

  // Device pattern analysis — every 15 min, one pod only
  scheduleCronJob('*/15 * * * *', async () => {
    const lock = await redisService.acquireLock('device_pattern_analysis', 600);
    if (!lock) return;
    try {
      await runDevicePatternAnalysis();
    } catch (e) {
      logger.error('[JOB] devicePatternAnalysis:', e);
    } finally {
      await redisService.releaseLock('device_pattern_analysis', lock);
    }
  });

  // Recharge reconciliation — every 15 min, one pod only
  scheduleCronJob('*/15 * * * *', async () => {
    const lock = await redisService.acquireLock('recharge_reconciliation', 600);
    if (!lock) return;
    try {
      await reconcilePendingRecharges();
    } catch (e) {
      logger.error('[JOB] rechargeReconciliation:', e);
    } finally {
      await redisService.releaseLock('recharge_reconciliation', lock);
    }
  });

  logger.info('Wallet production jobs started with distributed locks');

  // Nearby flash sale notifications — every 30 min, location-filtered
  initializeNearbyFlashSaleNotificationJob();
  logger.info('Nearby flash sale notification job started (runs every 30 minutes)');

  // Smart demand push — every 30 min: near-expiry products + low-demand hours/days
  initializeSmartDemandPushJob();
  logger.info('Smart demand push job started (near-expiry + low-demand detection, every 30 min)');

  // REZ Capital scoring — weekly (Sunday 3 AM): compute merchant credit scores
  initializeRezCapitalScoringJob();
  logger.info('REZ Capital scoring job initialized (runs Sundays 3 AM)');

  // Weekly savings summary — Monday 10 AM
  initializeWeeklySummaryJob();
  logger.info('Weekly summary job started (runs Monday 10:00 AM)');

  // Wallet-ledger reconciliation — daily at 4 AM
  const { initializeLedgerReconciliationJob } = await import('../jobs/walletLedgerReconciliationJob');
  initializeLedgerReconciliationJob();
  logger.info('Wallet-ledger reconciliation job started (runs daily at 4:00 AM)');

  // Merchant liability settlement — daily at 5 AM
  const { initializeMerchantLiabilitySettlementJob } = await import('../jobs/merchantLiabilitySettlementJob');
  initializeMerchantLiabilitySettlementJob();
  logger.info('Merchant liability settlement job started (runs daily at 5:00 AM)');

  // Merchant wallet payout — weekly on Monday at 6:00 AM
  initializeMerchantPayoutJob();
  logger.info('Merchant wallet payout job started (runs every Monday at 6:00 AM UTC)');

  // ISSUE #7: Merchant daily stats computation — daily at 1 AM, one pod only
  scheduleCronJob('0 1 * * *', async () => {
    const lock = await redisService.acquireLock('merchant_daily_stats', 3600);
    if (!lock) return;
    try {
      await computeYesterdayStats();
    } catch (e) {
      logger.error('[JOB] merchantDailyStats:', e);
    } finally {
      await redisService.releaseLock('merchant_daily_stats', lock);
    }
  });
  logger.info('Merchant daily stats job started (runs daily at 1:00 AM)');

  // FEAT-16: 86-item restoration job — daily at 6:00 AM
  startRestore86ItemsJob();
  logger.info('86-item restoration job started (runs daily at 6:00 AM)');

  // Gold SIP monthly investment job — daily at 9:00 AM
  startGoldSipJob();
  logger.info('Gold SIP monthly investment job started (runs daily at 9:00 AM)');

  // FEAT-1: Live gold price refresh — every 15 minutes, one pod only
  scheduleCronJob('*/15 * * * *', async () => {
    const lock = await redisService.acquireLock('gold_price_refresh', 300);
    if (!lock) return;
    try {
      const price = await getLiveGoldPriceInr();
      logger.info('[GOLD] Price refreshed proactively:', price, 'INR/gram');
    } catch (err: any) {
      logger.warn('[GOLD] Price refresh failed:', err.message);
    } finally {
      await redisService.releaseLock('gold_price_refresh', lock);
    }
  });
  logger.info('Gold price refresh job started (runs every 15 minutes, distributed lock)');

  // Referral expiry — daily at 3 AM
  initializeReferralExpiryJob();
  logger.info('Referral expiry job started (runs daily at 3 AM)');

  // Prive invite code expiry — daily at 3:30 AM
  initializePriveInviteExpiryJob();

  // SLA breach detection — every 5 minutes
  initializeSLABreachJob();
  logger.info('SLA breach detection job started (runs every 5 min)');

  // Analytics summary job — daily at 2 AM
  // BAK-GATEWAY-007 FIX: Wrap in try/catch so a failing analytics job doesn't crash
  // the entire cron initialization and prevent all other jobs from starting.
  try {
    scheduleAnalyticsSummary();
    logger.info('Analytics summary job started (runs daily at 2:00 AM)');
  } catch (err: any) {
    logger.error('[CRON] Analytics summary job failed to start:', err);
  }

  // Phase E — Daily Actions job (runs daily at 00:30 UTC / 06:00 IST)
  // Gated by DAILY_ACTIONS_MODE=off|shadow|primary. Cron is always
  // registered; mode-off short-circuits inside runDailyActionsJob so
  // flipping to shadow/primary is an env-var change with no redeploy.
  try {
    scheduleDailyActionsJob();
    logger.info('Daily actions job scheduled (daily at 00:30 UTC / 06:00 IST)');
  } catch (err: any) {
    logger.error('[CRON] Daily actions job failed to start:', err);
  }

  // Phase H — Growth Score job (runs daily at 01:00 UTC / 06:30 IST).
  // Same flag pattern: GROWTH_SCORE_MODE=off|shadow|primary.
  try {
    scheduleGrowthScoreJob();
    logger.info('Growth score job scheduled (daily at 01:00 UTC / 06:30 IST)');
  } catch (err: any) {
    logger.error('[CRON] Growth score job failed to start:', err);
  }

  // Integration reconciliation — daily at 2 AM
  // BUG-012 FIX: register the raw cron task in activeCronJobs so it is stopped
  // cleanly during shutdown. Previously the task was never added to the registry.
  initializeIntegrationReconciliationJob();
  const integrationReconciliationTask = getIntegrationReconciliationTask();
  if (integrationReconciliationTask) activeCronJobs.push(integrationReconciliationTask);
  logger.info('Integration reconciliation job started (runs daily at 2 AM)');

  // BUG-014 FIX: Guard all seeding operations behind a Redis flag so they only
  // run once per 24-hour window even when multiple workers restart simultaneously.
  // Without this guard every worker restart re-ran all seeds, causing redundant
  // DB writes and slow startup times in multi-instance deployments.
  const alreadySeeded = await redisService.get('system:seeded');
  if (!alreadySeeded) {
    // Mark seeded immediately (before awaiting seeds) so a racing worker sees
    // the flag and skips. TTL of 24h means seeds re-run at most once per day.
    await redisService.set('system:seeded', '1', 86400);

    // Seed wallet feature flags
    try {
      await seedWalletFeatureFlags();
      logger.info('Wallet feature flags seeded');
    } catch (err: any) {
      logger.warn('[Seed] Wallet feature flags seed failed (non-fatal):', err);
    }

    // Phase 4: Seed habit-focus de-scoping flags (safe to re-run — uses upsert)
    try {
      const { runHabitFocusFlags } = await import('../seeds/habitFocusFlags');
      await runHabitFocusFlags();
      logger.info('Habit focus feature flags seeded (Phase 4 de-scope)');
    } catch (err: any) {
      logger.warn('[Seed] Habit focus feature flags seed failed (non-fatal):', err);
    }

    // Persona system: initialize PersonaProfile documents for all existing users
    // Safe to re-run — uses upsert on userId so no duplicates are ever created.
    try {
      const { runInitPersonaProfiles } = await import('../seeds/initPersonaProfiles');
      await runInitPersonaProfiles();
      logger.info('PersonaProfile documents initialized for all existing users');
    } catch (err: any) {
      logger.warn('[Seed] PersonaProfile init failed (non-fatal):', err);
    }

    // Demo data seed — populates stores, offers, flash sales, bonus campaigns,
    // lock deals, trial offers, vouchers and banners with realistic Bangalore data.
    // Guard: only runs when the Store collection has fewer than 5 demo stores to
    // avoid re-seeding on every restart once the data is already present.
    try {
      const { Store } = await import('../models/Store');
      const demoStoreCount = await Store.countDocuments({
        slug: /^(third-wave-coffee|blue-tokai|starbucks-reserve|naturals-salon|lakme-salon)/,
      });
      if (demoStoreCount < 3) {
        logger.info('Demo data not found — running seedDemoData…');
        const { runSeedDemoData } = await import('../seeds/seedDemoData');
        await runSeedDemoData();
      } else {
        logger.info('Demo data already present — skipping seedDemoData');
      }
    } catch (seedErr) {
      // Never crash the server if seeding fails
      logger.warn('[SeedDemo] Demo data seed failed (non-fatal):', seedErr);
    }

    // Seed gamification + games feature flags
    try {
      await featureFlagService.seedDefaultFlags();
      logger.info('Feature flags seeded');
    } catch (err: any) {
      logger.warn('[Seed] Feature flags seed failed (non-fatal):', err);
    }
  } else {
    logger.info('[SEED] system:seeded flag present — skipping seeding operations (runs once per 24h)');
  }

  // B4+: Start cross-pod flag-invalidation subscriber. Idempotent — safe
  // on each boot. Non-fatal if Redis is unreachable; individual pods
  // simply fall back to the 1-min L1 TTL for propagation.
  try {
    await startFeatureFlagInvalidationSubscriber();
  } catch (err: any) {
    logger.warn('[CRON] Feature flag invalidation subscriber failed to start (non-fatal):', err);
  }

  // Initialize Bull-based scheduled job service
  logger.info('Initializing Bull scheduled job service...');
  try {
    await ScheduledJobService.initialize();
    logger.info('Bull scheduled job service initialized');
  } catch (err: any) {
    logger.error('[CRON] Bull scheduled job service failed to initialize:', err);
  }

  // Initialize audit retention service
  logger.info('Initializing audit retention service...');
  try {
    await AuditRetentionService.initialize();
    logger.info('Audit retention service initialized');
  } catch (err: any) {
    logger.error('[CRON] Audit retention service failed to initialize:', err);
  }

  // Leaderboard prize distribution job (hourly check for period-end prizes)
  if (isGamificationEnabled('leaderboard')) {
    try {
      initializePrizeDistributionJob();
      logger.info('Leaderboard prize distribution job started (runs hourly)');
    } catch (err: any) {
      logger.error('[CRON] Leaderboard prize distribution job failed to start:', err);
    }
  }

  // Customer lifecycle automation — daily at 10:00 AM (nudge dormant/lapsed/at-risk users)
  const { initializeLifecycleAutomationJob } = await import('../jobs/lifecycleAutomationJob');
  try {
    initializeLifecycleAutomationJob();
    logger.info('Lifecycle automation job started (runs daily at 10:00 AM)');
  } catch (err: any) {
    logger.error('[CRON] Lifecycle automation job failed to start:', err);
  }

  // Archive old records — daily at 3:00 AM (Activity → ArchivedActivity, LedgerEntry → gzip export)
  const { initializeArchiveJob } = await import('../jobs/archiveJob');
  try {
    initializeArchiveJob();
    logger.info('Archive job started (runs daily at 3:00 AM)');
  } catch (err: any) {
    logger.error('[CRON] Archive job failed to start:', err);
  }

  // Dispute timeout resolution job (every 30 minutes)
  const { initializeDisputeTimeoutJob } = await import('../jobs/disputeTimeoutJob');
  try {
    initializeDisputeTimeoutJob();
    logger.info('Dispute timeout resolution job started (runs every 30 min)');
  } catch (err: any) {
    logger.error('[CRON] Dispute timeout job failed to start:', err);
  }

  // Order lifecycle background jobs
  const { initializeOrderLifecycleJobs } = await import('../jobs/orderLifecycleJobs');
  try {
    initializeOrderLifecycleJobs();
    const { initializeOrderReconciliationJob } = await import('../jobs/orderReconciliationJob');
    initializeOrderReconciliationJob();
    logger.info('Order lifecycle + reconciliation jobs started');
  } catch (err: any) {
    logger.error('[CRON] Order lifecycle jobs failed to start:', err);
  }

  // P0-5: Failed refund auto-retry — every 5 minutes
  try {
    initializeFailedRefundRetryJob();
    logger.info('Failed refund retry job started (runs every 5 min)');
  } catch (err: any) {
    logger.error('[CRON] Failed refund retry job failed to start:', err);
  }

  // P1-8: Stuck order auto-cancel — every 10 minutes
  // Cancels paid orders stuck in 'placed' for >60 min (merchant never confirmed)
  try {
    initializeStuckOrderCancelJob();
    logger.info('Stuck order auto-cancel job started (runs every 10 min)');
  } catch (err: any) {
    logger.error('[CRON] Stuck order auto-cancel job failed to start:', err);
  }

  // Personalized deal notifications — 11am lunch + 5pm hangout (IST)
  const { personalizedNotificationJob } = await import('../jobs/personalizedNotificationJob');
  // MP-008 FIX: use scheduleCronJob() helper so these tasks are added to
  // activeCronJobs and stopped during shutdownCronJobs(). Previously they were
  // scheduled with cronScheduler.schedule() directly, bypassing the registry,
  // causing the tasks to survive SIGTERM and keep the process alive.
  scheduleCronJob(
    '0 11 * * *',
    async () => {
      const lock = await redisService.acquireLock('lock:notif:lunch', 300);
      if (!lock) return;
      try {
        await personalizedNotificationJob.run('lunch');
      } catch (e) {
        logger.error('[PersonalizedNotif] Lunch job error:', e);
      } finally {
        await redisService.releaseLock('lock:notif:lunch', lock);
      }
    },
    'Personalized notification lunch (IST 11:00)',
  );
  scheduleCronJob(
    '0 17 * * *',
    async () => {
      const lock = await redisService.acquireLock('lock:notif:hangout', 300);
      if (!lock) return;
      try {
        await personalizedNotificationJob.run('hangout');
      } catch (e) {
        logger.error('[PersonalizedNotif] Hangout job error:', e);
      } finally {
        await redisService.releaseLock('lock:notif:hangout', lock);
      }
    },
    'Personalized notification hangout (IST 17:00)',
  );
  logger.info('Personalized notification jobs started (11am lunch, 5pm hangout IST)');

  // Automated campaign job — every 6 hours
  try {
    startCampaignJob();
    logger.info('Automated campaign job started (runs every 6 hours)');
  } catch (err: any) {
    logger.error('[CRON] Automated campaign job failed to start:', err);
  }

  // TRY gamification jobs
  try {
    startTryFeedRefreshJob();
    logger.info('TRY feed refresh job started (runs every 6 hours)');
  } catch (err: any) {
    logger.error('[CRON] TRY feed refresh job failed to start:', err);
  }

  try {
    startSurpriseTrialJob();
    logger.info('Surprise trial assignment job started (runs Monday 6:00 AM UTC)');
  } catch (err: any) {
    logger.error('[CRON] Surprise trial job failed to start:', err);
  }

  try {
    startLeaderboardJob();
    logger.info('Leaderboard rank update job started (runs every hour)');
  } catch (err: any) {
    logger.error('[CRON] Leaderboard job failed to start:', err);
  }

  try {
    startTrialCoinExpiryJob();
    logger.info('Trial coin expiry job started (runs daily at 2:00 AM)');
  } catch (err: any) {
    logger.error('[CRON] Trial coin expiry job failed to start:', err);
  }

  // Appointment reminder job — reminders at 24h and 1h before appointment
  try {
    startAppointmentReminderJob();
    logger.info('Appointment reminder job started (runs every hour)');
  } catch (err: any) {
    logger.error('[CRON] Appointment reminder job failed to start:', err);
  }

  // Rebooking nudge job — nudge users 6 weeks after completed appointments
  try {
    startRebookingNudgeJob();
    logger.info('Rebooking nudge job started (runs daily at 10:00 AM)');
  } catch (err: any) {
    logger.error('[CRON] Rebooking nudge job failed to start:', err);
  }

  // Gamification event bus
  logger.info('Initializing gamification event bus...');
  let gamificationEventBus: any;
  try {
    gamificationEventBus = (await import('../events/gamificationEventBus')).default;
  } catch (err: any) {
    logger.error('[CRON] Gamification event bus import failed:', err);
  }

  // Anomaly detection job — detects payment failures, coin spikes, revenue anomalies
  try {
    startAnomalyDetectionJob();
    logger.info('Anomaly detection job started (runs every 15 minutes)');
  } catch (err: any) {
    logger.error('[CRON] Anomaly detection job failed to start:', err);
  }

  // Re-engagement job — 3-tier churn recovery (3/5/7 day inactivity push campaigns)
  try {
    initializeReEngagementJob();
    logger.info('Re-engagement job started (runs daily at 9:00 AM and 6:00 PM)');
  } catch (err: any) {
    logger.error('[CRON] Re-engagement job failed to start:', err);
  }

  // Referral completion notification — notify referrer when friend makes first purchase
  try {
    initializeReferralCompletionJob();
    logger.info('Referral completion notification job started (runs every 15 minutes)');
  } catch (err: any) {
    logger.error('[CRON] Referral completion job failed to start:', err);
  }

  // Coin expiry notification — push alerts at 7-day, 3-day, 1-day before expiry
  try {
    initializeCoinExpiryNotificationJob(null, scheduleCronJob);
    logger.info('Coin expiry notification job started (runs daily at 7:00 PM)');
  } catch (err: any) {
    logger.error('[CRON] Coin expiry notification job failed to start:', err);
  }

  // v3: SLA monitor — checks snapshot freshness, queue depth, daily stats every 5 minutes
  try {
    initializeSlaMonitorJob();
    logger.info('SLA monitor job started (runs every 5 minutes)');
  } catch (err: any) {
    logger.error('[CRON] SLA monitor job failed to start:', err);
  }

  // Alert monitoring — evaluates all configured alert conditions on a recurring schedule
  try {
    startAlertMonitoring();
    logger.info('Alert monitoring started');
  } catch (err: any) {
    logger.error('[CRON] Alert monitoring failed to start:', err);
  }

  // Gamification event bus
  if (gamificationEventBus) {
    try {
      await gamificationEventBus.initialize();
      logger.info('Gamification event bus initialized');
    } catch (err: any) {
      logger.error('[CRON] Gamification event bus failed to initialize:', err);
    }
  }

  // ── Phase 1-3: Habit Engine + Intelligence + Growth Jobs ──
  try {
    const { runOpportunityNotificationJob } = await import('../jobs/opportunityNotificationJob');
    scheduleCronJob(
      '0 4,6,8,10,12,14,16 * * *',
      runOpportunityNotificationJob,
      'Opportunity notifications (every 2h, 10AM-9PM IST)',
    );
    logger.info('Opportunity notification job started (every 2h, 10AM-9PM IST)');
  } catch (err: any) {
    logger.error('[CRON] Opportunity notification job failed to start:', err);
  }

  try {
    const { runProgressNudgeJob } = await import('../jobs/progressNudgeJob');
    scheduleCronJob('30 12 * * *', runProgressNudgeJob, 'Progress nudge (daily 6PM IST)');
    logger.info('Progress nudge job started (daily at 6PM IST)');
  } catch (err: any) {
    logger.error('[CRON] Progress nudge job failed to start:', err);
  }

  try {
    const { runRezScoreCalculationJob } = await import('../jobs/rezScoreCalculationJob');
    scheduleCronJob('30 20 * * *', runRezScoreCalculationJob, 'REZ Score calculation (daily 2AM IST)');
    logger.info('REZ Score calculation job started (daily at 2AM IST)');
  } catch (err: any) {
    logger.error('[CRON] REZ Score calculation job failed to start:', err);
  }

  try {
    const { initWeeklyChallengeJob } = await import('../jobs/weeklyChallengeJob');
    initWeeklyChallengeJob();
    logger.info('Weekly challenge job started (every Monday at 6AM)');
  } catch (err: any) {
    logger.error('[CRON] Weekly challenge job failed to start:', err);
  }

  // DB-AUDIT-9 FIX: Stale order sweeper removed from here.
  // The more comprehensive stale-processing sweeper in orderLifecycleJobs.ts
  // (runStaleProcessingOrderSweeper, lock key: job:stale-processing-sweeper) covers
  // the same use-case with proper stock release and timeline tracking.
  // Having two sweepers running on the same set of orders caused double-cancellation
  // races and conflicting stock decrement operations.

  // Experience Rewards — daily at 23:00 UTC: grants Rendez credits to high-spend users
  initExperienceRewardCron();
  logger.info('[CRON] Experience reward cron started (daily at 23:00 UTC)');

  // Offer Automation — daily at 10:30 AM IST (05:00 UTC): evaluates dormant/birthday/milestone/first-visit rules
  const { initializeOfferAutomationJob } = await import('../jobs/runOfferAutomation');
  try {
    initializeOfferAutomationJob();
    logger.info('[CRON] Offer automation job started (daily at 10:30 AM IST)');
  } catch (err: any) {
    logger.error('[CRON] Offer automation job failed to start:', err);
  }
}

/**
 * OMAR: Shutdown function to gracefully stop all cron jobs on SIGTERM/SIGINT
 * Prevents lingering intervals that would keep process alive and accumulate memory
 */
export async function shutdownCronJobs(): Promise<void> {
  markShuttingDown();
  stopAlertMonitoring();
  logger.info('[CRON SHUTDOWN] Stopping all active cron jobs...');
  for (const cronTask of activeCronJobs) {
    try {
      if (cronTask && typeof cronTask.stop === 'function') {
        cronTask.stop();
      }
    } catch (e) {
      logger.warn('[CRON SHUTDOWN] Failed to stop cron task:', e);
    }
  }
  activeCronJobs.length = 0;
  logger.info('[CRON SHUTDOWN] All cron jobs stopped');
}
