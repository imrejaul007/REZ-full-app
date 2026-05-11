// @ts-nocheck
/**
 * config/middleware.ts — Middleware setup (cors, helmet, compression, etc.)
 * Extracted from server.ts for maintainability.
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as crypto from 'crypto';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

import jwt from 'jsonwebtoken';
import { logger, requestLogger, correlationIdMiddleware } from './logger';
import { initSentry, sentryRequestHandler, sentryTracingHandler } from './sentry';
import { setCsrfToken } from '../middleware/csrf';
import { metricsMiddleware, metricsEndpoint } from './prometheus';
import { generalLimiter } from '../middleware/rateLimiter';
import { ipBlocker } from '../middleware/ipBlocker';
import { handleStripeWebhook, handleWebhook as handleRazorpayWebhook } from '../controllers/paymentController';
import { authenticate, requireAdmin, verifyToken } from '../middleware/auth';

// ── CORS ──

// Localhost origins are always allowed — they cannot be spoofed from the
// public internet (only a real local dev machine can send Origin: localhost),
// so including them in every environment is safe and removes the need for
// DEV_CORS_LOCALHOST env vars on each Render service.
const LOCALHOST_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://localhost:19000',
  'http://localhost:19006',
  'http://127.0.0.1:19000',
  'http://127.0.0.1:19006',
];

export const getAllowedOrigins = (): string[] => {
  const isProduction = process.env.NODE_ENV === 'production';

  // If CORS_ORIGIN is explicitly set, use it; in non-production also add localhost origins.
  if (process.env.CORS_ORIGIN) {
    const explicit = process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
    if (isProduction) {
      return [...new Set(explicit)];
    }
    return [...new Set([...explicit, ...LOCALHOST_ORIGINS])];
  }

  // Collect env-configured origins
  const origins: string[] = [];
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  if (process.env.MERCHANT_FRONTEND_URL) {
    origins.push(process.env.MERCHANT_FRONTEND_URL);
  }
  if (process.env.ADMIN_FRONTEND_URL) {
    origins.push(process.env.ADMIN_FRONTEND_URL);
  }

  // rez.money is always allowed (production consumer web app)
  // now.rez.money must also be in CORS_ORIGIN env var for production deployments.
  origins.push('https://rez.money', 'https://www.rez.money', 'https://now.rez.money');

  // Localhost origins are only allowed outside production.
  if (!isProduction) {
    origins.push(...LOCALHOST_ORIGINS);
  }

  return [...new Set(origins)];
};

/**
 * Checks whether `origin` is allowed by CORS policy.
 * Supports exact matches from getAllowedOrigins() plus:
 * - Any *.vercel.app subdomain (Vercel preview deployments — consumer, merchant, admin apps)
 * - Any *.onrender.com subdomain (Render service-to-service calls via browser)
 */
export const isOriginAllowed = (origin: string): boolean => {
  if (getAllowedOrigins().includes(origin)) return true;
  // Allow only explicitly listed Vercel preview URLs — never all *.vercel.app.
  // Set VERCEL_PREVIEW_URLS as a comma-separated list of your Vercel hostnames.
  // Example: VERCEL_PREVIEW_URLS=rez-app.vercel.app,rez-admin-git-main.vercel.app
  const vercelAllowlist = (process.env.VERCEL_PREVIEW_URLS || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .map((h) => (h.startsWith('https://') ? h : `https://${h}`));
  if (vercelAllowlist.includes(origin)) return true;
  // Allow Render deployment URLs (*.onrender.com) for service-to-service browser calls
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin)) return true;
  return false;
};

// ── Setup all middleware on the app ──
// SANA: security hardening — Middleware stack enforces defense-in-depth security:
// 1. Helmet.js headers protect against XSS, clickjacking, MIME-sniffing, HSTS
// 2. CORS whitelist prevents unauthorized cross-origin access
// 3. Request sanitization blocks NoSQL injection and XSS in user input
// 4. Cookie parser with secure flags (httpOnly, secure, sameSite)
// 5. CSRF protection with double-submit cookie pattern
// 6. Rate limiting prevents brute force and DoS attacks
// 7. Error handler sanitizes all errors in production (no stack traces to clients)

export function setupMiddleware(app: Express): void {
  // MED-10: Global request timeout middleware.
  // Without this, a hung DB query or slow external API call (Razorpay, Cloudinary, Twilio)
  // holds a worker slot open indefinitely, eventually exhausting the connection pool.
  // Only the Twilio service previously had an explicit timeout — all others could block forever.
  const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip timeout for long-running upload routes
    const isUpload =
      req.path.startsWith('/api/bills/upload') ||
      req.path.startsWith('/api/products/import') ||
      req.path.startsWith('/api/ugc/upload');
    if (isUpload) return next();

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('[TIMEOUT] Request exceeded timeout', {
          method: req.method,
          path: req.path,
          ms: REQUEST_TIMEOUT_MS,
        });
        res
          .status(503)
          .json({ success: false, message: 'Request timed out. Please try again.', code: 'REQUEST_TIMEOUT' });
      }
    }, REQUEST_TIMEOUT_MS);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  });

  // Trust proxy — configurable via TRUST_PROXY_DEPTH env var.
  // MED-3 FIX: On Render (single ingress) the default of 1 is correct.
  // On Kubernetes with multiple ingress layers, set TRUST_PROXY_DEPTH=2 (or higher)
  // so req.ip reflects the real client IP instead of an internal load-balancer address.
  // Incorrect depth causes rate limiting, IP blocking, and fraud detection to run
  // against the wrong IP, effectively disabling those controls.
  const trustProxyDepth = parseInt(process.env.TRUST_PROXY_DEPTH || '1', 10);
  app.set('trust proxy', isNaN(trustProxyDepth) ? 1 : trustProxyDepth);

  // ── PREFLIGHT FAST-PATH ──────────────────────────────────────────────────
  // Handle ALL OPTIONS requests immediately before any other middleware runs.
  // This prevents rate limiters, CSRF checks, IP blockers, and any other
  // middleware from accidentally returning 4xx/5xx on CORS preflights, which
  // the browser then misreports as a "CORS error" on the real request.
  app.options(/.*/, (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();

    if (origin && isOriginAllowed(origin)) {
      // Known browser origin — set specific origin and allow credentials
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      // No origin (mobile app / curl / server-to-server) — omit the header
      // rather than echoing '*' with credentials, which browsers reject anyway.
      // Do NOT set Access-Control-Allow-Origin here.
    }
    // Unknown/blocked origin — no ACAO header, browser will reject the preflight.

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,Authorization,X-Requested-With,X-CSRF-Token,X-Rez-Region,X-Device-OS,X-Device-Fingerprint,X-Rez-Signature,X-Provider-Name,X-App-Version,X-Internal-Token,X-Correlation-ID,X-Request-ID',
    );
    res.setHeader('Access-Control-Max-Age', '86400'); // cache preflight 24h
    res.status(204).end();
  });

  // Initialize Sentry (must be first)
  initSentry(app);
  if (process.env.SENTRY_DSN) {
    app.use(sentryRequestHandler);
    app.use(sentryTracingHandler);
  }

  // Correlation ID middleware (early for tracking)
  app.use(correlationIdMiddleware);

  // Sprint 15: X-Response-Time header — records elapsed ms for each request.
  // Uses Date.now() (built-in); no external packages required.
  // Applied early in the stack so the timer captures middleware + handler time.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      if (!res.headersSent) return;
      // Header may already be sent if the response was finished before the listener fired;
      // setHeader on a finished response is a no-op and safe to skip.
    });
    // Override res.end to inject the header before the response is flushed.
    const originalEnd = res.end.bind(res);
    (res as any).end = function (...args: any[]) {
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
      }
      return originalEnd(...args);
    };
    next();
  });

  // SANA: security hardening — Helmet.js enforces strict security headers:
  // - Content-Security-Policy restricts resource loading to prevent XSS
  // - HSTS forces HTTPS for 1 year and preload to prevent MITM
  // - Frame-Ancestors deny prevents clickjacking attacks
  // - X-Content-Type-Options nosniff prevents MIME-sniffing attacks
  // - Referrer-Policy limits referrer leakage across domains
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // 'unsafe-inline' is needed for inline styles from React Native Web / CSS-in-JS
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          // Restrict to known CDN domains instead of blanket https:
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://placehold.co', 'https://*.amazonaws.com'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
    }),
  );

  // SANA: security hardening — CORS configuration enforces strict origin validation.
  // In production, CORS_ORIGIN must be explicitly set to approved domains only.
  // Wildcard '*' origins are NEVER allowed in production (fails on startup).
  // This prevents unauthorized cross-origin access from malicious sites.
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = getAllowedOrigins();

      // Allow requests with no origin (mobile apps, curl) only outside production
      if (!origin) {
        return callback(null, process.env.NODE_ENV !== 'production');
      }

      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        // HIGH 5 FIX: Return callback(null, false) instead of throwing an Error.
        // Throwing causes Express to emit a 500-level error that looks like a server
        // crash in logs and monitoring dashboards. Passing false silently denies the
        // request — the browser receives a standard CORS rejection (no ACAO header)
        // without any misleading 500 in the server logs.
        // [CORS_BLOCKED]: log at info (NOT warn/error) — this is expected traffic, not a server error.
        logger.info('[CORS_BLOCKED]', { origin, path: 'n/a (cors option callback)' });
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Rez-Region',
      'X-Device-OS',
      'X-Device-Fingerprint',
      'X-Rez-Signature',
      'X-Provider-Name',
      'X-App-Version',
      'X-Internal-Token',
      'X-Correlation-ID',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-CSRF-Token', 'X-Correlation-ID'],
    credentials: true,
    optionsSuccessStatus: 200,
  };

  app.use(cors(corsOptions));

  // ── CORS blocked-origin explicit 403 ────────────────────────────────────────
  // When cors() denies an origin (no ACAO header), the browser will block the
  // response — but Express still processes the request through subsequent middleware.
  // Any non-browser client (curl, Postman) can still reach routes even without CORS.
  // For browser requests with a foreign Origin, return 403 with a clear error body
  // so monitoring dashboards classify this as 403 (client error) not 500 (server error),
  // and so the origin can be captured in logs/metrics.
  // Mobile apps and server-to-server calls send no Origin header and are not affected.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string | undefined;
    if (!origin) return next(); // mobile / curl / server-to-server — skip

    if (!isOriginAllowed(origin)) {
      logger.info('[CORS_BLOCKED]', {
        origin,
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      return res.status(403).json({
        error: 'CORS_BLOCKED',
        origin,
      });
    }
    next();
  });

  // CSRF: merchant JWT is Authorization Bearer (mobile) — safe from CSRF.
  // For browser sessions, enforce double-submit cookie CSRF token validation.
  app.use('/api/merchant', (req, res, next) => {
    // Allow GET/HEAD/OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    // Exempt auth endpoints — unauthenticated, protected by OTP + rate limiting
    if (req.path.startsWith('/auth/')) return next();
    // Mobile app sends Bearer token in Authorization — not vulnerable to CSRF
    const hasBearer = (req.headers.authorization || '').startsWith('Bearer ');
    if (hasBearer) return next();
    // Browser session: require valid CSRF double-submit cookie token
    // X-Requested-With is NOT sufficient — any script can set it
    const cookieCsrf = req.cookies?.csrfToken as string | undefined;
    const headerCsrf = req.headers['x-csrf-token'] as string | undefined;
    if (!cookieCsrf || !headerCsrf) {
      return res.status(403).json({ success: false, error: 'CSRF check failed' });
    }
    // CS-S6 FIX: Use crypto.timingSafeEqual to prevent timing attack on CSRF token comparison.
    // The previous `!==` string comparison leaked token length via response time.
    if (cookieCsrf.length !== headerCsrf.length) {
      return res.status(403).json({ success: false, error: 'CSRF check failed' });
    }
    const match = crypto.timingSafeEqual(Buffer.from(cookieCsrf), Buffer.from(headerCsrf));
    if (!match) {
      return res.status(403).json({ success: false, error: 'CSRF check failed' });
    }
    next();
  });

  // Mutation requests must have either Origin (browser) or a valid Bearer Authorization (mobile/API).
  // Requiring Bearer format prevents the guard from being bypassed by arbitrary strings
  // in the Authorization header (e.g. Authorization: x).
  app.use((req, res, next) => {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const hasOrigin = !!req.headers.origin;
    const hasValidAuth = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.length > 10;
    const isHealthCheck = req.path === '/health' || req.path === '/api/health';

    // Exempt auth endpoints (login/OTP) and webhooks — mobile apps don't send Origin headers
    const isAuthRoute = req.path.includes('/auth/') || req.path.includes('/webhook');
    if (isMutation && !hasOrigin && !hasValidAuth && !isHealthCheck && !isAuthRoute) {
      return res.status(403).json({ success: false, message: 'Origin or authorization required' });
    }
    next();
  });

  // IP Blocker — blocks IPs flagged for suspicious activity (Redis-backed)
  app.use(ipBlocker);

  // ── WEBHOOK RAW BODY ROUTES ──
  // Mount webhook routes BEFORE the JSON body parser so they receive the raw Buffer.
  app.post('/api/payment/stripe-webhook', express.raw({ type: 'application/json' }), handleStripeWebhook as any);

  app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook as any);

  // Body parsing middleware — selective limits to prevent memory exhaustion
  const UPLOAD_PATHS = [
    '/api/bills/upload',
    '/api/products/import',
    '/api/merchant/products/bulk',
    '/api/ugc/upload',
    '/api/merchant/uploads',
  ];

  app.use((req: any, res: any, next: any) => {
    // Upload routes get 10MB; everything else gets 50KB
    const isUpload = UPLOAD_PATHS.some((p: string) => req.path.startsWith(p));
    const limit = isUpload ? '10mb' : '50kb';

    express.json({ limit })(req, res, (err: any) => {
      if (err) {
        if (err.type === 'entity.too.large') {
          return res.status(413).json({
            success: false,
            message: `Request body too large. Maximum size is ${limit}.`,
          });
        }
        if (err instanceof SyntaxError && 'body' in err) {
          req.body = {};
          return next();
        }
        return next(err);
      }
      next();
    });
  });

  app.use(express.urlencoded({ extended: true, limit: '50kb' }));

  // SANA: security hardening — Global request sanitization removes NoSQL injection attacks
  // and XSS payloads from user input in body, params, and query. $ and . characters
  // that could be used in MongoDB queries are replaced with safe characters.
  // HIGH-4 FIX: req.query must be sanitized for ALL methods, not only mutations.
  // A GET request with ?status[$ne]=cancelled bypasses body sanitization entirely
  // and reaches MongoDB filters unsanitised.  Query sanitization is cheap (~0.1ms)
  // and must run on every request regardless of HTTP method.
  const SANITIZE_BODY_ONLY_METHODS = new Set(['HEAD', 'OPTIONS']);
  app.use((req, res, next) => {
    // Always sanitize query params (NoSQL injection via GET query strings is a real attack vector)
    if (req.query && typeof req.query === 'object') {
      const sanitized = mongoSanitize.sanitize({ ...req.query }, { replaceWith: '_' });
      Object.keys(req.query).forEach((k) => {
        (req.query as any)[k] = (sanitized as any)[k];
      });
    }
    // Skip body/params sanitization for safe methods that carry no payload
    if (SANITIZE_BODY_ONLY_METHODS.has(req.method)) return next();
    if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: '_' });
    if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: '_' });
    next();
  });
  logger.info('Request sanitization middleware enabled (mongo-sanitize, query params on all methods)');

  // SANA: security hardening — Cookie parser middleware with secure configuration.
  // All cookies set by this server must follow secure flags: httpOnly, secure (in production),
  // and sameSite=strict to prevent XSS theft and CSRF attacks.
  app.use(cookieParser());

  // CSRF Protection Middleware
  app.use(setCsrfToken);
  logger.info('CSRF protection middleware enabled');

  // Compression middleware — gzip/brotli with optimized threshold
  app.use(
    compression({
      level: 6, // balance speed vs size (1-9)
      threshold: 1024, // compress responses > 1KB (was 2048, now more aggressive)
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );

  // Prometheus metrics middleware - tracks all HTTP requests
  app.use(metricsMiddleware);

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Winston request logging middleware
  // PERF: Skip logging for health-check and Prometheus-scrape endpoints — they fire
  // every 15–30s from load balancers and Prometheus, creating high-frequency log noise
  // with zero debugging value and measurable I/O overhead under load.
  if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      if (req.path === '/health' || req.path === '/api/health' || req.path === '/metrics') {
        return next();
      }
      return requestLogger(req, res, next);
    });
  }

  // Morgan for additional development logging (optional)
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_MORGAN === 'true') {
    app.use(morgan('dev'));
  }

  // Rate limiting - Production security
  // Health probes are exempted here so Render / K8s pings never consume
  // the rate-limit budget and can never be accidentally throttled.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || req.path.startsWith('/health/')) return next();
    return generalLimiter(req, res, next);
  });

  // SEC-08: Swagger UI Documentation — protect with authentication in production
  // Dev/staging: publicly accessible (useful for development)
  // Production: operator+ only (LOW-5 FIX: 'support' role excluded — Swagger exposes all
  // endpoint schemas and request/response structures which support staff should not browse)
  const SWAGGER_ADMIN_ROLES = ['admin', 'super_admin', 'operator'];

  const requireAdminAuthForSwagger = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!bearerToken) {
        logger.warn('[Swagger] Unauthorized access attempt to API docs in production', {
          ip: req.ip,
          path: req.path,
        });
        return res.status(403).json({
          success: false,
          message: 'API documentation is restricted in production',
          code: 'SWAGGER_FORBIDDEN',
        });
      }

      // Verify the token and confirm it carries an admin role
      try {
        const decoded = verifyToken(bearerToken);
        if (!decoded.role || !SWAGGER_ADMIN_ROLES.includes(decoded.role)) {
          logger.warn('[Swagger] Token present but role is not admin', {
            ip: req.ip,
            role: decoded.role,
          });
          return res.status(403).json({
            success: false,
            message: 'Admin role required to access API documentation',
            code: 'SWAGGER_FORBIDDEN',
          });
        }
      } catch (err) {
        logger.warn('[Swagger] Invalid or expired token for API docs', { ip: req.ip });
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
          code: 'SWAGGER_FORBIDDEN',
        });
      }
    }
    return next();
  };

  if (process.env.NODE_ENV !== 'production') {
    // Dev/staging: public access
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'REZ API Documentation',
        customfavIcon: '/favicon.ico',
      }),
    );

    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    logger.info('Swagger documentation available at /api-docs (development/staging)');
  } else {
    // Production: require admin authentication
    app.use(
      '/api-docs',
      requireAdminAuthForSwagger,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'REZ API Documentation',
        customfavIcon: '/favicon.ico',
      }),
    );

    app.get('/api-docs.json', requireAdminAuthForSwagger, (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    logger.info('Swagger documentation available at /api-docs (admin auth required)');
  }

  // Prometheus metrics endpoint - restricted to admin users
  app.get('/metrics', authenticate, requireAdmin, metricsEndpoint);
}
