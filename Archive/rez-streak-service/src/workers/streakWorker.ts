import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { connectMongoDB } from '../config/mongodb';
import { streakService } from '../services/StreakService';

// Redis connection for BullMQ
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

// Queue names
export const QUEUE_NAMES = {
  NOTIFICATION: 'streak-notifications',
  STREAK_CHECK: 'streak-check',
  COIN_AWARD: 'coin-award',
} as const;

// Worker for processing streak-related jobs
const streakCheckWorker = new Worker(
  QUEUE_NAMES.STREAK_CHECK,
  async (job: Job) => {
    console.log(`Processing streak check job: ${job.id}`);

    try {
      switch (job.name) {
        case 'daily-check':
          await streakService.processDailyStreakCheck();
          break;

        default:
          console.warn(`Unknown job name: ${job.name}`);
      }

      return { processed: true, jobName: job.name };
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

// Worker for processing notifications
const notificationWorker = new Worker(
  QUEUE_NAMES.NOTIFICATION,
  async (job: Job) => {
    console.log(`Processing notification job: ${job.id}`);

    try {
      const { userId, type, title, message, data } = job.data;

      // In production, this would send to a notification service
      console.log(`Sending notification to user ${userId}:`, {
        type,
        title,
        message,
        data,
      });

      // Simulate notification service call
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL;
      if (notificationServiceUrl) {
        const response = await fetch(`${notificationServiceUrl}/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            type,
            title,
            message,
            data,
            channel: 'streak',
          }),
        });

        if (!response.ok) {
          throw new Error(`Notification service error: ${response.status}`);
        }
      }

      return { sent: true, userId, type };
    } catch (error) {
      console.error(`Error processing notification job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 10,
  }
);

// Worker for processing coin awards
const coinAwardWorker = new Worker(
  QUEUE_NAMES.COIN_AWARD,
  async (job: Job) => {
    console.log(`Processing coin award job: ${job.id}`);

    try {
      const { userId, coins, reason, streak } = job.data;

      // In production, this would call the coin service
      console.log(`Awarding ${coins} coins to user ${userId}:`, {
        reason,
        streak,
      });

      const coinServiceUrl = process.env.COIN_SERVICE_URL;
      if (coinServiceUrl) {
        const response = await fetch(`${coinServiceUrl}/award`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            amount: coins,
            reason: reason || 'streak_milestone',
            metadata: { streak },
          }),
        });

        if (!response.ok) {
          throw new Error(`Coin service error: ${response.status}`);
        }
      }

      return { awarded: true, userId, coins };
    } catch (error) {
      console.error(`Error processing coin award job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

// Event handlers for streak check worker
streakCheckWorker.on('completed', (job) => {
  console.log(`Streak check job ${job.id} completed`);
});

streakCheckWorker.on('failed', (job, err) => {
  console.error(`Streak check job ${job?.id} failed:`, err);
});

streakCheckWorker.on('error', (err) => {
  console.error('Streak check worker error:', err);
});

// Event handlers for notification worker
notificationWorker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err);
});

notificationWorker.on('error', (err) => {
  console.error('Notification worker error:', err);
});

// Event handlers for coin award worker
coinAwardWorker.on('completed', (job) => {
  console.log(`Coin award job ${job.id} completed`);
});

coinAwardWorker.on('failed', (job, err) => {
  console.error(`Coin award job ${job?.id} failed:`, err);
});

coinAwardWorker.on('error', (err) => {
  console.error('Coin award worker error:', err);
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down workers...');

  await streakCheckWorker.close();
  await notificationWorker.close();
  await coinAwardWorker.close();
  await connection.quit();

  console.log('All workers shut down gracefully');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start workers
async function start() {
  try {
    await connectMongoDB();
    console.log('Workers started successfully');
    console.log(`  - Streak Check Worker: ${QUEUE_NAMES.STREAK_CHECK}`);
    console.log(`  - Notification Worker: ${QUEUE_NAMES.NOTIFICATION}`);
    console.log(`  - Coin Award Worker: ${QUEUE_NAMES.COIN_AWARD}`);
  } catch (error) {
    console.error('Failed to start workers:', error);
    process.exit(1);
  }
}

start();

export { streakCheckWorker, notificationWorker, coinAwardWorker };
