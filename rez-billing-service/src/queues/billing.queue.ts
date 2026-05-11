import Bull from 'bull';
import { billingService, BillingEventInput } from '../billing.service';
import { logger } from '../config/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create billing queue
export const billingQueue = new Bull<BillingEventInput>('billing', {
  redis: redisUrl,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Process billing events
billingQueue.process(async (job) => {
  const event = job.data;

  try {
    logger.debug(`Processing billing event from queue: ${job.id}`);

    const result = await billingService.processEventImmediate(event);

    if (!result.success) {
      throw new Error(result.error || 'Processing failed');
    }

    return result;
  } catch (error) {
    logger.error(`Error processing billing event ${job.id}:`, error);
    throw error;
  }
});

// Event handlers
billingQueue.on('completed', (job, result) => {
  logger.debug(`Billing job ${job.id} completed`, result);
});

billingQueue.on('failed', (job, err) => {
  logger.error(`Billing job ${job?.id} failed:`, err);
});

billingQueue.on('stalled', (job) => {
  logger.warn(`Billing job ${job?.id} stalled`);
});

// Graceful shutdown
export async function closeBillingQueue(): Promise<void> {
  await billingQueue.close();
}
