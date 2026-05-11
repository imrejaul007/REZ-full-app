/**
 * BBPS Service - Bill Payment Service
 * Handles electricity, water, gas, DTH, mobile, insurance, loan bills
 *
 * @description Bharat Bill Payment System (BBPS) service for India
 * @author ReZ Full App Team
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDatabase, disconnectDatabase, isConnected } from './config/database';
import { billRoutes } from './routes/bill.routes';
import { paymentRoutes } from './routes/payment.routes';
import { operatorRoutes } from './routes/operator.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-request-id']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${requestId}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    service: 'bbps-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: isConnected()
    }
  };

  res.status(healthStatus.database.connected ? 200 : 503).json(healthStatus);
});

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'BBPS Service',
    version: '1.0.0',
    description: 'Bharat Bill Payment System API',
    endpoints: {
      operators: {
        list: 'GET /api/bbps/operators',
        categories: 'GET /api/bbps/operators/categories',
        electricity: 'GET /api/bbps/operators/electricity',
        gas: 'GET /api/bbps/operators/gas',
        water: 'GET /api/bbps/operators/water',
        mobile: 'GET /api/bbps/operators/mobile',
        insurance: 'GET /api/bbps/operators/insurance',
        loan: 'GET /api/bbps/operators/loan',
        dth: 'GET /api/bbps/operators/dth',
        broadband: 'GET /api/bbps/operators/broadband',
        landline: 'GET /api/bbps/operators/landline',
        cable: 'GET /api/bbps/operators/cable',
        search: 'GET /api/bbps/operators/search?q=',
        byId: 'GET /api/bbps/operators/:operatorId',
        fields: 'GET /api/bbps/operators/:operatorId/fields',
        validate: 'POST /api/bbps/operators/:operatorId/validate'
      },
      bills: {
        fetch: 'POST /api/bbps/bill/fetch',
        pay: 'POST /api/bbps/bill/pay',
        details: 'GET /api/bbps/bill/:billId',
        history: 'GET /api/bbps/bill',
        validate: 'POST /api/bbps/bill/validate'
      },
      payments: {
        status: 'GET /api/bbps/payment/status/:transactionId',
        details: 'GET /api/bbps/payment/:transactionId',
        history: 'GET /api/bbps/payment/history',
        refund: 'POST /api/bbps/payment/:transactionId/refund',
        refundStatus: 'GET /api/bbps/payment/refund/:refundId',
        retry: 'POST /api/bbps/payment/:transactionId/retry',
        webhook: 'POST /api/bbps/payment/webhook'
      }
    }
  });
});

// Routes - BBPS API
app.use('/api/bbps/operators', operatorRoutes);
app.use('/api/bbps/bill', billRoutes);
app.use('/api/bbps/payment', paymentRoutes);

// Legacy route aliases (for backward compatibility)
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 4110;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express server
    const server = app.listen(Number(PORT), HOST, () => {
      console.log(`
========================================
  BBPS Service Started Successfully
========================================
  Environment: ${process.env.NODE_ENV || 'development'}
  Host: ${HOST}
  Port: ${PORT}
  Database: MongoDB ${isConnected() ? 'Connected' : 'Disconnected'}
  Health: http://localhost:${PORT}/health
  API Docs: http://localhost:${PORT}/api
========================================
      `);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('HTTP server closed');

        try {
          await disconnectDatabase();
          console.log('Database connections closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
