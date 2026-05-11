import { Worker, Job } from 'bullmq';
import { ExportService } from '../services/exportService';
import { logger } from '../config/logger';
import { attachFailureHandler } from '../config/bullmqFailureHandler';
import { bullmqRedis } from '../config/bullmq-connection';

/**
 * Export worker - processes export jobs from the queue
 * Only starts if Redis is available
 */
const enableExportQueue = process.env.ENABLE_EXPORT_QUEUE === 'true';

if (enableExportQueue) {
  // Use the shared bullmqRedis connection (maxRetriesPerRequest: null — required for
  // BullMQ Workers which use blocking BRPOP). The old inline config used
  // maxRetriesPerRequest: 1 which caused BullMQ to abort retries prematurely.
  const connection = bullmqRedis;

  const exportWorker = new Worker(
    'analytics-export',
    async (job: Job) => {
      logger.info(`Processing export job ${job.id}:`, job.data);

      try {
        const result = await ExportService.processExport(job);

        if (!result.success) {
          throw new Error(result.error || 'Export failed');
        }

        return result;
      } catch (error: any) {
        logger.error(`Export job ${job.id} failed:`, error);
        throw error;
      }
    },
    { connection },
  );

  exportWorker.on('error', (err) => {
    logger.warn('⚠️ Export worker error:', err);
  });

  // MED-002 FIX: Handle permanent job failures. Without this handler, BullMQ silently moves
  // exhausted jobs to the 'failed' set with no logging. Ops has no visibility into failed exports,
  // and users never get told their export won't arrive.
  exportWorker.on('failed', (job, err) => {
    if (!job) return;
    logger.error('❌ Export job permanently failed', {
      jobId: job.id,
      exportType: job.data?.type,
      requestedBy: job.data?.userId,
      attemptsMade: job.attemptsMade,
      err: err?.message,
    });
    // TODO: Notify the requesting user that their export failed (email/push)
    // await notificationService.sendExportFailedNotification(job.data?.userId, job.data?.type);
  });

  // Attach dead-letter queue handler: permanently failed export jobs are pushed to
  // rez:dlq:analytics-export Redis list and reported via Sentry.
  attachFailureHandler(exportWorker, 'analytics-export');

  logger.info('✅ Export worker started and listening for jobs...');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing export worker...');
    await exportWorker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing export worker...');
    await exportWorker.close();
    process.exit(0);
  });
} else {
  logger.warn('⚠️ Export worker not started - Redis is not available');
}
