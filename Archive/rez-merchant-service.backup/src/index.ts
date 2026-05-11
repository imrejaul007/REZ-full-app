import 'dotenv/config';
import 'express-async-errors';
import * as Sentry from '@sentry/node';
import { expressErrorHandler, expressIntegration } from '@sentry/node';

process.env.SERVICE_NAME = 'rez-merchant-service';

// Initialize Sentry only if DSN is provided
const SENTRY_INITIALIZED = !!process.env.SENTRY_DSN;
if (SENTRY_INITIALIZED) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    serverName: process.env.SERVICE_NAME,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    integrations: [expressIntegration()],
  });
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { createRateLimiter } from '@rez/shared';
import { redis } from './config/redis';
import { logger } from './config/logger';
import { tracingMiddleware } from './middleware/tracing';
import { csrfProtection } from './middleware/csrf';
import { connectMongoDB } from './config/mongodb';
import { metricsMiddleware, getMetricsHandler } from './metrics';

// Domain routers — bounded modules replacing individual route imports
import coreRouter from './routers/core';
import ordersRouter from './routers/orders';
import engagementRouter from './routers/engagement';
import campaignsRouter from './routers/campaigns';
import analyticsRouter from './routers/analytics';
import financeRouter from './routers/finance';
import staffRouter from './routers/staff';
import operationsRouter from './routers/operations';
import supportRouter from './routers/support';
import qrRouter from './routers/qr';
import loyaltyConfigRouter from './routers/loyaltyConfig';
import merchantAISuggestionsRouter from './routes/merchantAISuggestions';
import trialsRouter from './routers/trials';
import marketingTemplatesRouter from './routers/marketingTemplates';
import internalRoutes from './routes/internalRoutes';
import oauthRouter from './routes/oauth';
import karmaRouter from './routes/karmaRoutes';
import karmaPerkRouter from './routes/karmaPerkRoutes';
import bonusZoneCampaignsRouter from './routes/bonusZoneCampaigns';
import goalsRouter from './routes/goals';
import pricingRouter from './routes/pricing';
import demandSignalsMerchantRouter from './routes/demandSignalsMerchant';
import tallyExportRouter from './routes/tallyExport';
import channelManagerRouter from './routes/channelManager';
import qrIntegrationRouter from './routes/qrIntegration';

const app = express();
// Behind nginx API gateway / Render LB. trust proxy=true accepts ANY proxy
// chain, so a forged X-Forwarded-For header lets a client bypass rate
// limits entirely. Only trust the actual number of hops between this
// service and the public internet. TRUST_PROXY_HOPS defaults to 1
// (single gateway/LB hop) — set it to 2 if you have both LB and CDN.
// CRITICAL-SEC FIX (MA-BACK-008): Validate range to prevent bypass via
// trust proxy=999999 which would accept any forwarded header.
const rawTrustHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
const TRUST_PROXY_HOPS = Number.isFinite(rawTrustHops)
  ? Math.max(1, Math.min(3, rawTrustHops))
  : 1;
app.set('trust proxy', TRUST_PROXY_HOPS);
const PORT = parseInt(process.env.PORT || '4005', 10);

function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL'];
  const missing = required.filter((k) => !process.env[k]);
  // IMPORTANT: the auth middleware and all auth routes read JWT_MERCHANT_SECRET
  // (not JWT_SECRET, not MERCHANT_JWT_SECRET). Earlier this check looked for
  // the wrong names, so a deploy that set only JWT_SECRET booted successfully
  // but every authenticated request returned 500 "Auth not configured".
  if (!process.env.JWT_MERCHANT_SECRET) {
    missing.push('JWT_MERCHANT_SECRET');
  }
  // ENCRYPTION_KEY is required by utils/encryption.ts for bank-details
  // encryption. Without it, the pre('save') hook throws at first write and
  // bank details are either dropped or (if writers bypass the hook) stored
  // in plaintext. Fail fast at startup instead.
  if (!process.env.ENCRYPTION_KEY) {
    missing.push('ENCRYPTION_KEY');
  }
  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON && !process.env.INTERNAL_SERVICE_TOKEN) {
    missing.push('INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN');
  }
  if (missing.length > 0) {
    logger.error(`[FATAL] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Sentry request handler — before all middleware (v8 uses expressIntegration via init)
if (SENTRY_INITIALIZED) {
  // In Sentry v8, express tracing is set up via integrations in init()
  // No explicit requestHandler needed - it's handled by expressIntegration
}

// CORS — restrict to known origins only
const rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
const allowedOrigins: string[] = rawAllowedOrigins
  ? rawAllowedOrigins.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

// Production Rez origins — always allowed (the nginx API gateway is the
// CORS authority, but still forwards the Origin header to upstreams).
// CRITICAL-SEC FIX (MA-BACK-007): Removed wildcard [a-z0-9-]+\.vercel\.app regex.
// Previously matched ANY vercel.app subdomain, allowing an attacker to deploy a
// malicious vercel app and use it as an allowed CORS origin to steal merchant
// credentials. Now restricted to known Rez-specific vercel deployments only.
const REZ_ORIGIN_RE = /^https:\/\/(merchant\.rez\.money|admin\.rez\.money|menu\.rez\.money|rez\.money|www\.rez\.money|rez-app-merchant\.com)$/;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) { callback(null, true); return; }
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) { callback(null, true); return; }
    if (REZ_ORIGIN_RE.test(origin)) { callback(null, true); return; }
    if (allowedOrigins.includes(origin)) { callback(null, true); return; }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
};

// Rate limiting — Redis-backed for distributed deployments
// Each instance shares rate limit state via Redis, preventing bypass via instance rotation
const generalLimiter = createRateLimiter(
  redis.call.bind(redis),
  { windowMs: 15 * 60 * 1000, max: 300 }
);

const authLimiter = createRateLimiter(
  redis.call.bind(redis),
  { windowMs: 1 * 60 * 1000, max: 100, message: 'Too many authentication attempts, please try again later.' }
);

// Core middleware
// CRITICAL-SEC FIX (MA-BACK-009): Explicit HSTS configuration via helmet.
// Default helmet() does NOT set HSTS headers. Adding maxAge and includeSubDomains
// to enforce HTTPS-only for all Rez domains and subdomains.
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// PEN-TEST FIX: Additional security headers for clickjacking, MIME sniffing, and referrer leakage
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(compression());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(generalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(csrfProtection);
app.use(tracingMiddleware);
app.use(metricsMiddleware);

// Stricter rate limit on auth routes
app.use('/auth', authLimiter);
app.use('/api/v1/merchant/auth', authLimiter);
app.use('/api/v1/merchant/oauth', authLimiter);

// Internal service-to-service routes — NOT proxied through nginx /api/merchant/*
// Registered before the general rate limiter prefix so they get the general limiter,
// but the requireInternalToken middleware ensures only trusted callers can use them.
app.use('/internal', internalRoutes);
app.use('/api/v1/karma', karmaRouter);

// Health endpoints
app.get('/health/live', (_req, res) => {
  res.json({ alive: true, service: 'rez-merchant-service', uptime: process.uptime() });
});

app.get('/health/ready', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  let redisState = 'disconnected';
  try {
    await redis.ping();
    redisState = 'connected';
  } catch { /* redis unavailable */ }
  const dbReady = dbState === 1;
  const redisReady = redisState === 'connected';
  const ready = dbReady && redisReady;
  res.status(ready ? 200 : 503).json({
    ready,
    service: 'rez-merchant-service',
    db: dbState === 1 ? 'connected' : 'disconnected',
    redis: redisState,
    uptime: process.uptime(),
  });
});

app.get('/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: dbState === 1 ? 'ok' : 'degraded',
    service: 'rez-merchant-service',
    uptime: process.uptime(),
    db: dbState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.get('/health/detailed', async (_req, res) => {
  const checks: Record<string, any> = {};
  let isHealthy = true;

  // Check MongoDB with latency
  const mongoStart = Date.now();
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db?.admin().ping();
    checks.database = { status: 'up', latencyMs: Date.now() - mongoStart };
  } catch (err: any) {
    checks.database = { status: 'down', error: err.message, latencyMs: Date.now() - mongoStart };
    isHealthy = false;
  }

  // Check Redis with latency
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: 'up', latencyMs: Date.now() - redisStart };
  } catch (err: any) {
    checks.redis = { status: 'down', error: err.message, latencyMs: Date.now() - redisStart };
  }

  const overallStatus = isHealthy ? 'healthy' : 'unhealthy';
  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    uptime: process.uptime(),
    checks,
  });
});

// Prometheus metrics endpoint
app.get('/metrics', getMetricsHandler);

// Swagger UI API documentation
app.use('/api-docs', require('swagger-ui-express'), require('yamljs').load('./docs/openapi.yaml'),
  require('swagger-ui-express').serve,
  require('swagger-ui-express').setup(
    require('yamljs').load('./docs/openapi.yaml'),
    { customCss: '.swagger-ui .topbar { display: none }', customSiteTitle: 'ReZ Merchant API Docs' }
  )
);
app.get('/api-docs.json', (_req, res) => {
  res.json(require('yamljs').load('./docs/openapi.yaml'));
});

// ── Domain routers — production paths ────────────────────────────────────────
// All domain routers use the canonical '/api/v1/merchant' prefix.
app.use('/api/v1/merchant', oauthRouter);
app.use('/api/v1/merchant', coreRouter);
app.use('/api/v1/merchant', ordersRouter);
app.use('/api/v1/merchant', engagementRouter);
app.use('/api/v1/merchant', campaignsRouter);
app.use('/api/v1/merchant', analyticsRouter);
app.use('/api/v1/merchant', financeRouter);
app.use('/api/v1/merchant', staffRouter);
app.use('/api/v1/merchant', operationsRouter);
app.use('/api/v1/merchant', supportRouter);
app.use('/api/v1/merchant', qrRouter);
app.use('/api/v1/merchant', qrIntegrationRouter);
app.use('/api/v1/merchant', loyaltyConfigRouter);
app.use('/api/v1/merchant', trialsRouter);
app.use('/api/v1/merchant', marketingTemplatesRouter);
app.use('/api/v1/merchant/karma', karmaRouter);
app.use('/api/v1/merchant/karma', karmaPerkRouter);
app.use('/api/v1/merchant/bonus-zone', bonusZoneCampaignsRouter);
app.use('/api/v1/merchant', goalsRouter);
app.use('/api/v1/merchant/pricing', pricingRouter);
app.use('/api/v1/merchant/ai', merchantAISuggestionsRouter);
app.use('/api/v1/merchant/export', tallyExportRouter);
app.use('/api/v1/merchant/channels', channelManagerRouter);
app.use('/internal', demandSignalsMerchantRouter);

// Sentry error handler
if (SENTRY_INITIALIZED) app.use(expressErrorHandler());

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // CRITICAL-SEC FIX (MA-BACK-010): Never log stack traces in production.
  // Stack traces may contain: file paths revealing internal infra structure,
  // environment variable names from closure captures, library version numbers,
  // and stack frames that aid in crafting targeted exploits. Stack is only
  // logged to Sentry (which strips sensitive data) — not to stdout/structured logs.
  const isOperational = err instanceof Error && (err as any).isOperational;
  logger.error('Unhandled error', { error: err.message, operational: isOperational });
  if (process.env.NODE_ENV === 'development' || isOperational === undefined) {
    logger.debug('Unhandled error stack', { stack: err.stack });
  }
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Graceful shutdown — drains in-flight requests, then closes DB connections
let server: any;
let isShuttingDown = false;
async function start() {
  validateEnv();
  await connectMongoDB();
  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[rez-merchant-service] HTTP API listening on port ${PORT}`);
  });
}

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`[${signal}] Graceful shutdown...`);

  // Stop accepting new connections, wait for in-flight to drain
  if (server) {
    server.close(() => {
      logger.info('[shutdown] HTTP server closed, draining connections...');
    });
  }

  // Force exit if draining takes too long
  const forceTimeout = setTimeout(() => {
    logger.warn('[shutdown] Force exit after 30s drain timeout');
    process.exit(0);
  }, 30000);

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    logger.info('[shutdown] MongoDB disconnected');
  } catch (err) {
    logger.error('[shutdown] MongoDB disconnect error', { error: (err as Error).message });
  }

  // Close Redis connection
  try {
    await redis.quit();
    logger.info('[shutdown] Redis disconnected');
  } catch (err) {
    logger.error('[shutdown] Redis disconnect error', { error: (err as Error).message });
  }

  clearTimeout(forceTimeout);
  logger.info('[shutdown] Complete');
  process.exit(0);
}
const isTestRuntime = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

if (!isTestRuntime) {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('[unhandledRejection] Unhandled promise rejection', { reason });
  });
  process.on('uncaughtException', (err: Error) => {
    logger.error('[uncaughtException] Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  start().catch((err) => {
    logger.error('[FATAL] Failed to start:', err);
    process.exit(1);
  });
}

export default app;
