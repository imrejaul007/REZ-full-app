import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import {
  identityRoutes,
  deviceRoutes,
  linkRoutes,
  resolveRoutes,
  gdprRoutes
} from './routes';
import { logger } from './utils/logger';

dotenv.config();

const app: Express = express();

const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-identity-graph';

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});
app.use('/api/', limiter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-identity-graph',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'MongoDB not connected'
      });
    }

    await mongoose.connection.db?.admin().ping();

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: 'MongoDB ping failed'
    });
  }
});

app.use('/api/identities', identityRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/resolve', resolveRoutes);
app.use('/api/gdpr', gdprRoutes);

app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'rez-identity-graph',
    version: '1.0.0',
    endpoints: [
      { path: '/api/identities', methods: ['GET', 'POST'] },
      { path: '/api/identities/:identityId', methods: ['GET', 'PUT', 'DELETE'] },
      { path: '/api/devices', methods: ['GET', 'POST'] },
      { path: '/api/devices/:deviceId', methods: ['GET'] },
      { path: '/api/links', methods: ['POST'] },
      { path: '/api/links/email', methods: ['POST'] },
      { path: '/api/links/phone', methods: ['POST'] },
      { path: '/api/resolve/by-identity', methods: ['POST'] },
      { path: '/api/resolve/by-cluster', methods: ['POST'] },
      { path: '/api/resolve/by-device', methods: ['POST'] },
      { path: '/api/gdpr/consent/:identityId', methods: ['POST'] },
      { path: '/api/gdpr/erasure/:identityId', methods: ['POST'] },
      { path: '/api/gdpr/export/:identityId', methods: ['GET'] }
    ]
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error processing request', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message
    });
  }

  if (err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      error: 'Database error',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info(`rez-identity-graph service started`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();

export { app };
