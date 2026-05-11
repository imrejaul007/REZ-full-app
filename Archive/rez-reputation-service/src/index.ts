import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { Worker } from 'bullmq';
import { reviewRoutes } from './routes/review.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { AggregationService } from './services/AggregationService';
import { SentimentService } from './services/SentimentService';
import { AlertService } from './services/AlertService';
import { logger } from './utils/logger';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'reputation-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Services initialization
let redis: Redis;
let aggregationWorker: Worker;
let sentimentWorker: Worker;

async function initializeServices(): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reputation';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Connect to Redis
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl);
    redis.on('error', (err) => logger.error('Redis error:', { error: err.message }));
    logger.info('Connected to Redis');

    // Initialize services
    const sentimentService = new SentimentService();
    const alertService = new AlertService(redis);
    const aggregationService = new AggregationService(sentimentService, alertService);

    // Create BullMQ workers
    aggregationWorker = new Worker('review-aggregation', async (job) => {
      await aggregationService.processAggregationJob(job.data);
    }, { connection: redis });

    sentimentWorker = new Worker('sentiment-analysis', async (job) => {
      await sentimentService.analyzeReview(job.data.reviewId);
    }, { connection: redis });

    aggregationWorker.on('failed', (job, err) => {
      logger.error('Aggregation job failed:', { jobId: job?.id, error: err.message });
    });

    sentimentWorker.on('failed', (job, err) => {
      logger.error('Sentiment job failed:', { jobId: job?.id, error: err.message });
    });

    logger.info('BullMQ workers initialized');

    // Start scheduled aggregation jobs
    await aggregationService.scheduleAggregation();
    logger.info('Aggregation scheduler started');
  } catch (error) {
    logger.error('Failed to initialize services:', { error: (error as Error).message });
    throw error;
  }
}

const PORT = process.env.PORT || 4006;

async function startServer(): Promise<void> {
  try {
    await initializeServices();

    app.listen(PORT, () => {
      logger.info(`Reputation Service running on port ${PORT}`);
      console.log(`Reputation Service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: (error as Error).message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.disconnect();
  await redis?.quit();
  await aggregationWorker?.close();
  await sentimentWorker?.close();
  process.exit(0);
});

startServer();

export { app, initializeServices };
