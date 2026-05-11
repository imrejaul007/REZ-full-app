// ReZ Travel Service - Entry Point
// Flight, Train, Bus, Cab Booking API

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import http from 'http';

import { flightRoutes, trainRoutes, busRoutes, cabRoutes } from './index';
import { TravelBooking } from './models';

dotenv.config();

// ── Service Name ──────────────────────────────────────────────────────────
process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'rez-travel-service';

// ── Sentry Setup ──────────────────────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    serverName: process.env.SERVICE_NAME,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  });
}

// ── Prometheus Metrics ──────────────────────────────────────────────────────
const httpRequestDuration = new Map<string, number[]>();
const httpRequestTotal = new Map<string, number>();

// ── App Setup ──────────────────────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT || '4007', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: (() => {
    const origins = process.env.CORS_ORIGIN?.split(',') || [];
    if (origins.includes('*')) {
      throw new Error('Wildcard CORS origin forbidden in production');
    }
    return origins.length > 0 ? origins : ['http://localhost:3000'];
  })(),
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const key = `${req.method} ${req.path}`;
    httpRequestDuration.set(key, [...(httpRequestDuration.get(key) || []), duration].slice(-100));
    httpRequestTotal.set(key, (httpRequestTotal.get(key) || 0) + 1);
  });
  next();
});

// ── Health Endpoints ───────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'rez-travel-service',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', uptime: process.uptime() });
});

app.get('/health/ready', async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.status(mongoOk ? 200 : 503).json({
    status: mongoOk ? 'ready' : 'not_ready',
    mongodb: mongoOk ? 'ok' : 'disconnected',
  });
});

// ── Prometheus Metrics ─────────────────────────────────────────────────────
app.get('/metrics', (req, res) => {
  const metrics: string[] = [];
  httpRequestTotal.forEach((count, route) => {
    metrics.push(`# TYPE http_requests_total counter\nhttp_requests_total{route="${route}"} ${count}`);
  });
  httpRequestDuration.forEach((durations, route) => {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    metrics.push(`# TYPE http_request_duration_ms gauge\nhttp_request_duration_ms{route="${route}"} ${avg}`);
  });
  metrics.push(`process_uptime_seconds ${process.uptime()}`);
  res.set('Content-Type', 'text/plain').send(metrics.join('\n'));
});

// API Routes
app.use('/api/travel/flights', flightRoutes);
app.use('/api/travel/trains', trainRoutes);
app.use('/api/travel/buses', busRoutes);
app.use('/api/travel/cabs', cabRoutes);

// My Bookings (all types)
app.get('/api/travel/bookings', async (req, res) => {
  try {
    const userId = (req as any).user?._id || req.query.userId;
    const { type, status, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const bookings = await TravelBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string));

    const total = await TravelBooking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bookings' });
  }
});

// Get single booking
app.get('/api/travel/bookings/:bookingId', async (req, res) => {
  try {
    const booking = await TravelBooking.findOne({ bookingId: req.params.bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error: any) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// SECURITY FIX: Fail at startup if MONGODB_URI not set
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

let server: http.Server | undefined;
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('MongoDB disconnect error:', err);
  }

  // Flush Sentry
  if (Sentry.isInitialized()) {
    await Sentry.flush(2000);
  }

  console.log('Graceful shutdown complete');
  process.exit(0);
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    server = app.listen(PORT, () => {
      console.log(`ReZ Travel Service running on port ${PORT}`);
      console.log(`Routes available:`);
      console.log(`  - GET  /health`);
      console.log(`  - GET  /health/live`);
      console.log(`  - GET  /health/ready`);
      console.log(`  - GET  /metrics`);
      console.log(`  - GET  /api/travel/flights/search`);
      console.log(`  - POST /api/travel/flights/book`);
      console.log(`  - GET  /api/travel/trains/search`);
      console.log(`  - POST /api/travel/trains/book`);
      console.log(`  - GET  /api/travel/buses/search`);
      console.log(`  - POST /api/travel/buses/book`);
      console.log(`  - GET  /api/travel/cabs/quotes`);
      console.log(`  - POST /api/travel/cabs/book`);
      console.log(`  - GET  /api/travel/bookings`);
    });

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
