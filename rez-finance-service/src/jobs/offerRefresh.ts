/**
 * Offer Refresh Job
 *
 * Periodically refreshes pre-approved partner offers for active users.
 * Runs every 6 hours. Batches users to avoid partner API rate limits.
 */

import cron from 'node-cron';
import { CreditProfile } from '../models/CreditProfile';
import { partnerService } from '../services/partnerService';
import { logger } from '../config/logger';

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 500;

async function runOfferRefresh(): Promise<void> {
  logger.info('[OfferRefresh] Starting offer refresh job');
  try {
    // BE-FIN-016: Ensure expired offers are atomically deactivated first
    const { PartnerOffer } = await import('../models/PartnerOffer');
    const deactivatedResult = await PartnerOffer.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    if (deactivatedResult.deletedCount > 0) {
      logger.info('[OfferRefresh] Expired offers deactivated', { count: deactivatedResult.deletedCount });
    }

    // Get recently active users (score updated in last 30 days)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const profiles = await CreditProfile.find({ rezScoreUpdatedAt: { $gte: cutoff } })
      .select('userId')
      .lean();

    logger.info('[OfferRefresh] Refreshing offers for users', { count: profiles.length });

    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(batch.map((p) => partnerService.refreshOffersForUser(p.userId)));

      if (i + BATCH_SIZE < profiles.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    logger.info('[OfferRefresh] Job complete', { users: profiles.length });
  } catch (err) {
    logger.error('[OfferRefresh] Job failed', { error: (err as Error).message });
  }
}

export function startOfferRefreshJob(): void {
  // Every 6 hours
  cron.schedule('0 */6 * * *', runOfferRefresh);
  logger.info('[OfferRefresh] Scheduled — every 6 hours');
}
