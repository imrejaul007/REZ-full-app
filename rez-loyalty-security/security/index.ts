/**
 * REZ Loyalty Security Package
 *
 * Comprehensive security utilities for the REZ Loyalty System.
 *
 * @example
 * ```typescript
 * import {
 *   RATE_LIMITS,
 *   validateOrThrow,
 *   authMiddleware,
 *   logCoinTransaction,
 *   securityHeadersMiddleware,
 *   getCORSConfig,
 *   AUTH,
 * } from '@rez-loyalty/security';
 * ```
 */

// Re-export all modules
export * from './rateLimits';
export * from './inputValidation';
export * from './authMiddleware';
export * from './auditLogger';
export * from './corsConfig';
export * from './helmet';
// Re-export constants with explicit names to avoid RATE_LIMITS conflict
export {
  AUTH,
  API,
  RATE_LIMITS,
  CRYPTO,
  VALIDATION,
  COOKIE,
  CORS,
  HEADERS,
  AUDIT,
  LOYALTY,
  ENV,
  getTierFromPoints,
  getNextTierThreshold,
  isInRange,
  sanitizeForLogging,
} from './constants';
