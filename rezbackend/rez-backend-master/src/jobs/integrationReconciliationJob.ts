import cron from 'node-cron';
import { MerchantIntegration } from '../models/MerchantIntegration';
import { ExternalTransaction } from '../models/ExternalTransaction';
import redisService from '../services/redisService';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('integration-reconciliation');

/**
 * Integration Reconciliation Job
 *
 * Runs nightly at 2:00 AM. For each active integration:
 * - Detects stuck transactions (pending > 1 hour)
 * - Flags integrations with high error counts
 * - Reports orphaned rewards
 */
// BUG-012 FIX: Store the task reference so cronJobs.ts can push it into
// activeCronJobs and stop it cleanly during SIGTERM/SIGINT shutdown.
let integrationReconciliationTask: ReturnType<typeof cron.schedule> | null = null;

export function getIntegrationReconciliationTask(): ReturnType<typeof cron.schedule> | null {
  return integrationReconciliationTask;
}

export function initializeIntegrationReconciliationJob(): void {
  // Daily at 2:00 AM
  integrationReconciliationTask = cron.schedule('0 2 * * *', async () => {
    const lockKey = 'lock:integration-reconciliation';
    const lockToken = await redisService.acquireLock(lockKey, 300);
    if (!lockToken) return;

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Find stuck transactions (pending > 1 hour)
      const stuckCount = await ExternalTransaction.countDocuments({
        status: 'pending',
        createdAt: { $lte: oneHourAgo },
      });

      if (stuckCount > 0) {
        logger.warn(`Integration reconciliation: ${stuckCount} stuck transactions found`);
      }

      // Find integrations with errors
      const errorIntegrations = await MerchantIntegration.find({
        status: 'active',
        errorCount: { $gte: 10 },
      })
        .select('_id merchant provider errorCount')
        .lean();

      for (const integration of errorIntegrations) {
        logger.warn('Integration with high error count', {
          integrationId: integration._id,
          provider: integration.provider,
          errorCount: integration.errorCount,
        });

        // Auto-pause integrations with >50 errors
        if (integration.errorCount > 50) {
          await MerchantIntegration.findByIdAndUpdate(integration._id, {
            status: 'error',
            lastSyncStatus: 'Auto-paused due to excessive errors',
          });
          logger.warn('Integration auto-paused', { integrationId: integration._id });
        }
      }

      // Summary stats
      const totalActive = await MerchantIntegration.countDocuments({ status: 'active' });
      const todayTxns = await ExternalTransaction.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      const rewardedTxns = await ExternalTransaction.countDocuments({
        status: 'rewarded',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      logger.info('Integration reconciliation complete', {
        activeIntegrations: totalActive,
        todayTransactions: todayTxns,
        todayRewarded: rewardedTxns,
        stuckTransactions: stuckCount,
        errorIntegrations: errorIntegrations.length,
      });
    } catch (error) {
      logger.error('Integration reconciliation failed', error as Error);
    } finally {
      await redisService.releaseLock(lockKey, lockToken);
    }
  });
}
