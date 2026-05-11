// @ts-nocheck
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';

/**
 * Secure client IP extraction
 * Defaults to DENY - X-Forwarded-For is only trusted if TRUST_PROXY=true
 * This prevents IP spoofing attacks via forged X-Forwarded-For headers
 */
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

export function getClientIp(req: Request): string {
  if (TRUST_PROXY) {
    // Only trust X-Forwarded-For when proxy is explicitly configured
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return String(forwarded).split(',')[0].trim();
    }
  }
  // Default: use socket IP, falling back to Express req.ip
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS configuration
export const corsConfig = cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-User-ID',
    'X-Session-ID',
    'X-Client-Version',
    'X-Platform',
  ],
  exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400,
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil((req.rateLimit?.resetTime?.getTime() || Date.now() + 60000) / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  },
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Event capture rate limiter (higher limit for high-volume events)
export const eventRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 events per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by user ID + event type combination
    const userId = req.body?.userId || getClientIp(req);
    return `${userId}:${req.path}`;
  },
});

// User-specific rate limiter
export const userRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.params.userId || req.body?.userId || getClientIp(req);
  },
});

// IP whitelist for internal services
export const internalServiceIPs = process.env.INTERNAL_SERVICE_IPS?.split(',') || [];

export const isInternalService = (req: Request): boolean => {
  if (internalServiceIPs.length === 0) {
    return true; // Allow all if no whitelist configured
  }
  return internalServiceIPs.includes(getClientIp(req));
};

// Request size limiter
export const requestSizeLimiter = (maxSize: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const limit = parseInt(maxSize, 10);

    if (contentLength > limit) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request body too large. Maximum size is ${maxSize}`,
        },
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

export default {
  securityHeaders,
  corsConfig,
  apiRateLimiter,
  strictRateLimiter,
  eventRateLimiter,
  userRateLimiter,
  isInternalService,
  requestSizeLimiter,
  getClientIp,
};
