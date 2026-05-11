import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { config } from 'dotenv';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { redis, disconnectRedis } from './config/redis';
import { Queue } from 'bullmq';
import streakRoutes from './routes/streak.routes';
import { streakService, setNotificationQueue } from './services/StreakService';
import { QUEUE_NAMES } from './workers/streakWorker';

// Load environment variables
config();

const PORT = parseInt(process.env.PORT || '3003', 10);

// Create Express application
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoStatus =
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check Redis connection
    const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
      uptime: process.uptime(),
    };

    return res.status(200).json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// API routes
app.use('/api/v1/streak', streakRoutes);

// Welcome endpoint
app.get('/', (req: Request, res: Response) => {
  return res.json({
    service: 'REZ Streak Service',
    version: '1.0.0',
    description: 'Streak tracking service for REZ Loyalty System',
    endpoints: {
      health: 'GET /health',
      getStreak: 'GET /api/v1/streak/:userId',
      recordVisit: 'POST /api/v1/streak/:userId/visit',
      recoverStreak: 'POST /api/v1/streak/:userId/recover',
      getMilestones: 'GET /api/v1/streak/:userId/milestones',
      milestoneConfig: 'GET /api/v1/streak/milestones/config',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize notification queue
let notificationQueue: Queue | null = null;

// Cron job for daily streak checks (runs at midnight)
const streakCheckCron = cron.schedule('0 0 * * *', async () => {
  console.log('Running daily streak check...');
  try {
    await streakService.processDailyStreakCheck();
    console.log('Daily streak check completed');
  } catch (error) {
    console.error('Daily streak check failed:', error);
  }
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down server...');

  // Stop cron jobs
  streakCheckCron.stop();

  // Close notification queue
  if (notificationQueue) {
    await notificationQueue.close();
  }

  // Disconnect from databases
  await disconnectMongoDB();
  await disconnectRedis();

  console.log('Server shut down gracefully');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Initialize notification queue
    notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    });

    // Set notification queue in streak service
    setNotificationQueue(notificationQueue);

    // Start Express server
    app.listen(PORT, () => {
      console.log(`REZ Streak Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base URL: http://localhost:${PORT}/api/v1/streak`);
      console.log('\nAPI Endpoints:');
      console.log('  GET  /api/v1/streak/:userId            - Get user streak data');
      console.log('  POST /api/v1/streak/:userId/visit      - Record a visit');
      console.log('  POST /api/v1/streak/:userId/recover    - Recover lost streak');
      console.log('  GET  /api/v1/streak/:userId/milestones - Get milestone status');
      console.log('  GET  /api/v1/streak/milestones/config  - Get milestone config');
    });

    // Start cron job
    streakCheckCron.start();
    console.log('Daily streak check cron job started (runs at midnight)');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Need to import mongoose for connection state check
import mongoose from 'mongoose';

start();

export { app };
