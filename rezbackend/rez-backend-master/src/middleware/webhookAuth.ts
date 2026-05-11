/**
 * Webhook Authentication Middleware
 *
 * Authenticates incoming webhooks from brands/affiliate networks
 * using API keys and optional HMAC signature verification.
 */

import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { MallBrand } from '../models/MallBrand';
import redisService from '../services/redisService';
import { logger } from '../config/logger';

// Environment variable for master webhook key
// SECURITY: Master key MUST always come from environment variable.
// No hardcoded fallback — use demoWebhookAuth middleware for dev/test endpoints.
const MASTER_WEBHOOK_KEY = process.env.MALL_WEBHOOK_MASTER_KEY;

/**
 * Webhook Authentication Middleware
 *
 * Checks for API key in headers:
 * - x-api-key: The API key for authentication
 * - x-webhook-signature: Optional HMAC signature for payload verification
 * - x-brand-id: Optional brand ID for brand-specific key validation
 */
export const webhookAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const signature = req.headers['x-webhook-signature'] as string;
    const brandId = req.headers['x-brand-id'] as string;

    // Check if API key is provided
    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key is required',
        error: 'Missing x-api-key header',
      });
      return;
    }

    // Check master key first (for testing/demo)
    // SECURITY: Master key only works if explicitly set (not in production without env var)
    // REZ-029 fix: Use crypto.timingSafeEqual for constant-time comparison.
    if (MASTER_WEBHOOK_KEY) {
      // BAK-CROSS-013 FIX: Ensure both buffers are identical length before timingSafeEqual.
      // Empty apiKey padded to key length could match empty key if both are blank.
      // Require both to be non-empty and of equal length; use fixed-length HMAC
      // digest comparison so timingSafeEqual never receives mismatched-length buffers.
      const apiKeyBuf = Buffer.from(apiKey || '');
      const masterBuf = Buffer.from(MASTER_WEBHOOK_KEY || '');
      if (apiKeyBuf.length === masterBuf.length && apiKeyBuf.length > 0) {
        const masterMatch = crypto.timingSafeEqual(apiKeyBuf, masterBuf);
        if (masterMatch) {
          logger.info('[WEBHOOK] Authenticated with master key');
          (req as any).webhookAuth = {
            type: 'master',
            brandId: null,
          };
          next();
          return;
        }
      }
    }

    // If brand ID is provided, validate brand-specific key
    if (brandId) {
      const brand = await MallBrand.findById(brandId).select('webhookConfig name');

      if (!brand) {
        res.status(401).json({
          success: false,
          message: 'Invalid brand ID',
        });
        return;
      }

      const webhookConfig = (brand as any).webhookConfig;

      if (!webhookConfig || !webhookConfig.apiKey) {
        res.status(401).json({
          success: false,
          message: 'Brand does not have webhook configuration',
        });
        return;
      }

      // Validate API key using constant-time comparison to prevent timing attacks
      // BAK-CROSS-013 FIX: Use HMAC-digest comparison so both sides are always 32 bytes.
      // The previous padEnd(64) approach risked leaking length via timing variance
      // from buffer creation, and padding nulls could accidentally match short keys.
      const keyHash = crypto.createHmac('sha256', apiKey).digest();
      const expectedHash = crypto.createHmac('sha256', webhookConfig.apiKey).digest();
      const keyMatches = crypto.timingSafeEqual(keyHash, expectedHash);
      const lengthMatches = apiKey.length === webhookConfig.apiKey.length;
      if (!keyMatches || !lengthMatches) {
        res.status(401).json({
          success: false,
          message: 'Invalid API key for this brand',
        });
        return;
      }

      // S-14: Validate HMAC signature — mandatory in ALL environments (no dev bypass)
      if (!webhookConfig.secretKey) {
        logger.error(`⚠️ [WEBHOOK] Brand ${brand.name} has no secret key configured`);
        res.status(401).json({
          success: false,
          message: 'Brand webhook signature not configured',
        });
        return;
      }
      if (!signature) {
        res.status(401).json({
          success: false,
          message: 'Webhook signature required (x-webhook-signature header)',
        });
        return;
      }

      const isValidSignature = verifySignature(req.body, signature, webhookConfig.secretKey);

      if (!isValidSignature) {
        res.status(401).json({
          success: false,
          message: 'Invalid webhook signature',
        });
        return;
      }

      logger.info(`🔑 [WEBHOOK] Authenticated for brand: ${brand.name}`);
      (req as any).webhookAuth = {
        type: 'brand',
        brandId: brand._id,
        brandName: brand.name,
      };
      next();
      return;
    }

    // Generic API key validation (check against all brands)
    const brand = await MallBrand.findOne({
      'webhookConfig.apiKey': apiKey,
      isActive: true,
    }).select('name webhookConfig');

    if (brand) {
      const webhookConfig = (brand as any).webhookConfig;

      // S-14: Validate HMAC signature — mandatory in ALL environments (no dev bypass)
      if (!webhookConfig.secretKey) {
        logger.error(`⚠️ [WEBHOOK] Brand ${brand.name} has no secret key configured`);
        res.status(401).json({
          success: false,
          message: 'Brand webhook signature not configured',
        });
        return;
      }
      if (!signature) {
        res.status(401).json({
          success: false,
          message: 'Webhook signature required (x-webhook-signature header)',
        });
        return;
      }

      const isValidSignatureBrand = verifySignature(req.body, signature, webhookConfig.secretKey);

      if (!isValidSignatureBrand) {
        res.status(401).json({
          success: false,
          message: 'Invalid webhook signature',
        });
        return;
      }

      logger.info(`🔑 [WEBHOOK] Authenticated for brand: ${brand.name}`);
      (req as any).webhookAuth = {
        type: 'brand',
        brandId: brand._id,
        brandName: brand.name,
      };
      next();
      return;
    }

    // No valid authentication found
    res.status(401).json({
      success: false,
      message: 'Invalid API key',
    });
  } catch (error) {
    logger.error('❌ [WEBHOOK] Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Verify HMAC signature
 */
function verifySignature(payload: any, signature: string, secretKey: string): boolean {
  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const expectedSignature = crypto.createHmac('sha256', secretKey).update(payloadString).digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    // BAK-CROSS-013 FIX: Ensure equal-length buffers before calling timingSafeEqual.
    // Buffer.from() on mismatched-length strings throws TypeError, which would
    // leak error-type information and crash the request rather than return false.
    const sigBuf = Buffer.from(signature || '');
    const expBuf = Buffer.from(expectedSignature || '');
    if (sigBuf.length !== expBuf.length) return false;
    try {
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  } catch (error) {
    logger.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Rate limiting for webhooks (Redis-backed for multi-instance support)
 * Tracks webhook calls per IP/brand to prevent abuse.
 * Falls back to allowing requests if Redis is unavailable.
 */
export const webhookRateLimit = (maxRequests: number = 100, windowSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const brandId = (req as any).webhookAuth?.brandId || 'unknown';
    const key = `webhook_rate:${req.ip}:${brandId}`;

    try {
      // Atomic INCR + EXPIRE via Lua script (no race condition)
      const count = await redisService.atomicIncr(key, windowSeconds);

      // Redis unavailable (returns null) — allow request through
      if (count === null) {
        next();
        return;
      }

      if (count > maxRequests) {
        res.status(429).json({
          success: false,
          message: 'Too many webhook requests',
          retryAfter: windowSeconds,
        });
        return;
      }
    } catch (error) {
      // Redis error — allow request through (fail open for webhooks)
      logger.warn('⚠️ [WEBHOOK] Rate limit check failed, allowing request:', error);
    }

    next();
  };
};

/**
 * Demo/Test webhook auth (allows any request in development)
 * SECURITY: Demo routes are COMPLETELY BLOCKED in production
 */
export const demoWebhookAuth = (req: Request, res: Response, next: NextFunction): void => {
  // SECURITY: Block demo routes entirely in production
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({
      success: false,
      message: 'Not found',
    });
    return;
  }

  // In development/test, allow all requests to demo endpoints
  (req as any).webhookAuth = {
    type: 'demo',
    brandId: null,
  };
  next();
};

export default webhookAuth;
