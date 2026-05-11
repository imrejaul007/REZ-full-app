import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import cron from 'node-cron';

import { connectRedis, redis } from './config/redis';
import { logger } from './config/logger';

// Routes
import walletRoutes from './routes/wallet.routes';
import billingRoutes from './routes/billing.routes';
import invoiceRoutes from './routes/invoice.routes';
import fraudRoutes from './routes/fraud.routes';
import settlementRoutes from './routes/settlement.routes';

// Services
import { invoiceService } from './invoice.service';
import { settlementService } from './settlement.service';

// Queue
import { closeBillingQueue } from './queues/billing.queue';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-billing-service',
    timestamp: new Date().toISOString()
  });
});

// Readiness check
app.get('/ready', async (_req, res) => {
  try {
    // Check MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check Redis
    const redisStatus = await redis.ping() === 'PONG' ? 'connected' : 'disconnected';

    if (mongoStatus === 'connected' && redisStatus === 'connected') {
      res.json({
        status: 'ready',
        mongodb: mongoStatus,
        redis: redisStatus
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        mongodb: mongoStatus,
        redis: redisStatus
      });
    }
  } catch (error) {
    res.status(503).json({ status: 'error', error: 'Health check failed' });
  }
});

// API Routes
app.use('/api/wallets', walletRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/settlements', settlementRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Scheduled jobs
function setupScheduledJobs(): void {
  // Update overdue invoices every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running overdue invoice update job');
    try {
      const count = await invoiceService.updateOverdueInvoices();
      logger.info(`Updated ${count} overdue invoices`);
    } catch (error) {
      logger.error('Error updating overdue invoices:', error);
    }
  });

  // Auto-settle eligible merchants daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running auto-settlement job');
    try {
      const result = await settlementService.autoSettleEligibleMerchants();
      logger.info(`Auto-settlement complete: ${result.successful}/${result.processed} successful`);
    } catch (error) {
      logger.error('Error in auto-settlement:', error);
    }
  });

  // Retry failed settlements every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running settlement retry job');
    try {
      const count = await settlementService.retryFailedSettlements();
      logger.info(`Retried ${count} failed settlements`);
    } catch (error) {
      logger.error('Error retrying settlements:', error);
    }
  });

  logger.info('Scheduled jobs configured');
}

// Database connection
async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-billing';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    await closeBillingQueue();
    await mongoose.connection.close();
    await redis.quit();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Setup scheduled jobs
    setupScheduledJobs();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`REZ Billing Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
