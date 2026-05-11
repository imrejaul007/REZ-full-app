/**
 * Privacy Middleware
 * DPDP-compliant consent verification for API routes
 */

import { Request, Response, NextFunction } from 'express';
import { ConsentType } from '../models/consent';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      consentChecked?: boolean;
      userConsents?: Record<ConsentType, boolean>;
    }
  }
}

interface ConsentConfig {
  type: ConsentType;
  required: boolean; // If true, denies access without consent
  action: string; // For logging
}

/**
 * Check if user has required consent
 */
export function requireConsent(config: ConsentConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip for internal service calls
    const internalToken = req.headers['x-internal-token'];
    if (internalToken) {
      return next();
    }

    const userId = req.headers['x-user-id'] as string || req.body?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required for consent check'
      });
    }

    try {
      // Import here to avoid circular dependencies
      const { consentService } = await import('../services/consentService');
      const hasConsent = await consentService.hasConsent(userId, config.type);

      if (!hasConsent && config.required) {
        return res.status(403).json({
          success: false,
          error: 'Consent required',
          consentType: config.type,
          action: config.action,
          message: `This action requires your consent for ${config.type.replace('_', ' ')}. Please enable it in Settings > Privacy.`
        });
      }

      // Store consent status for logging
      req.consentChecked = true;
      req.userConsents = req.userConsents || {};
      req.userConsents[config.type] = hasConsent;

      next();
    } catch (error) {
      console.error('Consent check error:', error);
      // Fail open for non-required consents, fail closed for required
      if (config.required) {
        return res.status(500).json({
          success: false,
          error: 'Unable to verify consent'
        });
      }
      next();
    }
  };
}

/**
 * Middleware for location tracking
 */
export const locationTracking = requireConsent({
  type: 'location_tracking',
  required: true,
  action: 'location_tracking'
});

/**
 * Middleware for analytics
 */
export const analytics = requireConsent({
  type: 'analytics',
  required: false, // Can work without analytics
  action: 'analytics_collection'
});

/**
 * Middleware for marketing
 */
export const marketing = requireConsent({
  type: 'marketing',
  required: false, // Can work without marketing
  action: 'marketing_communications'
});

/**
 * Middleware for AI profiling
 */
export const aiProfiling = requireConsent({
  type: 'ai_profiling',
  required: false, // Can work without AI personalization
  action: 'ai_personalization'
});

/**
 * Third party sharing - always required consent
 */
export const thirdPartySharing = requireConsent({
  type: 'third_party_sharing',
  required: true,
  action: 'third_party_data_sharing'
});

/**
 * Strip PII from logs (for GDPR/DPDP compliance)
 */
export function stripPII() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original IP
    const originalIp = req.ip;

    // Replace IP with hashed version for logging
    if (req.ip) {
      const crypto = require('crypto');
      req.headers['x-forwarded-for'] = crypto.createHash('sha256').update(req.ip).digest('hex').substring(0, 16);
    }

    next();
  };
}

/**
 * Add privacy headers
 */
export function addPrivacyHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Privacy-Version', '2.0');
  res.setHeader('X-Data-Retention', '90 days for behavioral, 7 years for transactions');

  // Only add consent header if checked
  if (req.consentChecked) {
    const consents = Object.entries(req.userConsents || {})
      .map(([type, granted]) => `${type}:${granted ? 'granted' : 'denied'}`)
      .join(',');
    res.setHeader('X-Consent-Status', consents);
  }

  next();
}

/**
 * Rate limit data export requests (prevent abuse)
 */
export const exportRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 exports per hour
  message: 'Too many data export requests. Please try again later.'
};

/**
 * Audit log for privacy-sensitive operations
 */
export function auditPrivacyOperation(operation: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const ip = req.ip;

    console.log(JSON.stringify({
      type: 'privacy_audit',
      operation,
      userId: userId ? `${userId.substring(0, 8)}...` : 'anonymous',
      timestamp: new Date().toISOString(),
      consentChecked: req.consentChecked,
      ipHash: ip ? require('crypto').createHash('sha256').update(ip).digest('hex').substring(0, 16) : null
    }));

    next();
  };
}
