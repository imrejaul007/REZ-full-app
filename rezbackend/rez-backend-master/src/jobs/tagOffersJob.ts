import cron from 'node-cron';
import Offer from '../models/Offer';
import { logger } from '../config/logger';
import redisService from '../services/redisService';

const BATCH_SIZE = 100;

/**
 * Auto-tags offers based on redemption patterns.
 * Runs every hour. Updates isTrending and metadata.autoTags.
 *
 * Uses a Mongoose cursor instead of loading all offers into memory at once
 * to avoid the 90%+ memory spike caused by a single unbounded find().
 * Writes are batched with bulkWrite() to reduce round-trips.
 */
export function initializeTagOffersJob() {
  cron.schedule('0 * * * *', async () => {
    const lockKey = 'lock:tag-offers-job';
    const acquired = await redisService.acquireLock(lockKey, 300);
    if (!acquired) return;

    try {
      const now = new Date();
      const week = new Date(now.getTime() - 7 * 86400000);

      const cursor = Offer.find({
        'validity.isActive': true,
        'validity.endDate': { $gt: now },
      })
        .select('_id redemptionCount metadata createdAt validity.endDate')
        .lean()
        .cursor();

      let tagged = 0;
      let total = 0;
      let batch: any[] = [];

      const flushBatch = async () => {
        if (batch.length === 0) return;
        await Offer.bulkWrite(
          batch.map(({ id, update }) => ({
            updateOne: { filter: { _id: id }, update: { $set: update } },
          })),
          { ordered: false },
        );
        batch = [];
      };

      for await (const offer of cursor) {
        total++;
        const tags: string[] = [];

        if ((offer.redemptionCount || 0) > 50) tags.push('popular');
        if (new Date(offer.createdAt) > week) tags.push('new');

        const views = (offer as any).metadata?.views || 0;
        if (views > 0 && (offer.redemptionCount || 0) / views > 0.15) tags.push('best_value');

        if (offer.validity?.endDate) {
          const daysLeft = Math.ceil((new Date(offer.validity.endDate).getTime() - now.getTime()) / 86400000);
          if (daysLeft <= 3) tags.push('limited_time');
        }

        const isTrending = tags.includes('popular') || (offer.redemptionCount || 0) > 100;

        if (tags.length > 0 || isTrending) {
          batch.push({
            id: offer._id,
            update: {
              'metadata.isTrending': isTrending,
              'metadata.autoTags': tags,
              'metadata.tagsUpdatedAt': now,
            },
          });
          tagged++;
        }

        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      }

      await flushBatch();

      logger.info(`[TAG OFFERS JOB] Tagged ${tagged}/${total} offers`);
    } catch (err) {
      logger.error('[TAG OFFERS JOB] Failed:', err);
    } finally {
      await redisService.releaseLock(lockKey);
    }
  });

  logger.info('[TAG OFFERS JOB] Registered — runs hourly');
}
