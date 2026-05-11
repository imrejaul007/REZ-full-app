/**
 * Security Constants for REZ Loyalty System
 *
 * Centralized security configuration values used across the loyalty platform.
 */

// ============================================================================
// Authentication Constants
// ============================================================================

export const AUTH = {
  // JWT Configuration
  JWT: {
    ACCESS_TOKEN_EXPIRY: '1h',
    REFRESH_TOKEN_EXPIRY: '7d',
    ALGORITHM: 'HS256',
    ISSUER: 'rez-loyalty-system',
    AUDIENCE: 'rez-api',
  },

  // Password Policy
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
    MAX_BREACHED_CHECKS: 0, // Disable breached password check in development
  },

  // Session Configuration
  SESSION: {
    MAX_DURATION: 86400000,      // 24 hours in ms
    EXTEND_ON_ACTIVITY: true,
    ABSOLUTE_TIMEOUT: 604800000, // 7 days
  },

  // Lockout Configuration
  LOCKOUT: {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900000,     // 15 minutes
    INCREASE_DURATION_ON_REPEAT: true,
  },
} as const;

// ============================================================================
// API Security Constants
// ============================================================================

export const API = {
  // Request Limits
  MAX_BODY_SIZE: '10mb',
  MAX_QUERY_PARAMS: 50,
  MAX_HEADERS: 50,

  // Timeout Configuration
  REQUEST_TIMEOUT: 30000,         // 30 seconds
  IDLE_TIMEOUT: 120000,           // 2 minutes

  // Header Limits
  MAX_HEADER_SIZE: 8192,          // 8KB
  MAX_URI_LENGTH: 8192,           // 8KB

  // Upload Limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,

  // Response Limits
  MAX_RESPONSE_SIZE: 5 * 1024 * 1024, // 5MB
  PAGINATION_MAX_LIMIT: 100,
  PAGINATION_DEFAULT_LIMIT: 20,
} as const;

// ============================================================================
// Rate Limiting Constants
// ============================================================================

export const RATE_LIMITS = {
  // Window sizes (in ms)
  WINDOW: {
    MINUTE: 60000,
    MINUTE_15: 900000,
    HOUR: 3600000,
    DAY: 86400000,
  },

  // Per-endpoint defaults
  DEFAULTS: {
    READ: 100,
    WRITE: 30,
    DELETE: 10,
  },

  // Burst settings
  BURST: {
    ALLOWED: true,
    MULTIPLIER: 2,
  },

  // Skip patterns (for health checks, etc.)
  SKIP_PATTERNS: [
    '/health',
    '/ready',
    '/metrics',
    '/favicon.ico',
  ],
} as const;

// ============================================================================
// Cryptography Constants
// ============================================================================

export const CRYPTO = {
  // Hashing
  HASH_ALGORITHM: 'sha256',
  HMAC_ALGORITHM: 'sha256',

  // Key Derivation
  PBKDF2_ITERATIONS: 100000,
  SALT_LENGTH: 32,

  // Encryption
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  AUTH_TAG_LENGTH: 16,

  // Random Generation
  RANDOM_BYTES_LENGTH: 32,
  TOKEN_LENGTH: 32,

  // Time-based tokens
  TOTP_ISSUER: 'REZ-Loyalty',
  TOTP_WINDOW: 1, // Allow 1 step before/after
  TOTP_PERIOD: 30,
} as const;

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  // User Input Limits
  USER_INPUT: {
    MAX_TEXT_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 100,
    MAX_OBJECT_DEPTH: 10,
    MAX_OBJECT_KEYS: 50,
  },

  // Field Lengths
  FIELD_LENGTHS: {
    ID: 24,
    EMAIL: 255,
    PHONE: 20,
    NAME_MIN: 2,
    NAME_MAX: 100,
    DESCRIPTION_MAX: 500,
  },

  // Number Ranges
  NUMBER_RANGES: {
    POINTS_MIN: -100000,
    POINTS_MAX: 1000000,
    AMOUNT_MIN: 0,
    AMOUNT_MAX: 10000000,
    QUANTITY_MIN: 1,
    QUANTITY_MAX: 1000,
  },

  // Pattern Validation
  PATTERNS: {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    OBJECT_ID: /^[a-f\d]{24}$/i,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
} as const;

// ============================================================================
// Cookie Security Constants
// ============================================================================

export const COOKIE = {
  SECURE: process.env.NODE_ENV === 'production',
  HTTP_ONLY: true,
  SAME_SITE: 'strict' as const,
  PATH: '/',
  DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  MAX_AGE: 86400000, // 24 hours
} as const;

// ============================================================================
// CORS Constants
// ============================================================================

export const CORS = {
  ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
    'https://rez-app.com',
    'https://admin.rez-app.com',
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Correlation-ID',
  ],
  MAX_AGE: 86400, // 24 hours
} as const;

// ============================================================================
// Security Headers Constants
// ============================================================================

export const HEADERS = {
  // Required headers
  REQUIRED: [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Strict-Transport-Security',
  ],

  // Recommended headers
  RECOMMENDED: [
    'X-XSS-Protection',
    'Content-Security-Policy',
    'X-Permitted-Cross-Domain-Policies',
    'Referrer-Policy',
    'Permissions-Policy',
  ],

  // Headers to remove
  REMOVE: [
    'X-Powered-By',
    'Server',
    'X-AspNet-Version',
    'X-AspNetMvc-Version',
  ],
} as const;

// ============================================================================
// Audit Constants
// ============================================================================

export const AUDIT = {
  // Events to log
  LOG_LEVELS: {
    COIN_TRANSACTION: 'high',
    TIER_CHANGE: 'high',
    ADMIN_ACTION: 'high',
    AUTH_FAILURE: 'medium',
    RATE_LIMIT: 'low',
    DATA_ACCESS: 'low',
  },

  // Retention
  RETENTION_DAYS: 365,

  // Batch processing
  BATCH_SIZE: 100,
  FLUSH_INTERVAL: 5000,
} as const;

// ============================================================================
// Loyalty-Specific Constants
// ============================================================================

export const LOYALTY = {
  // Points
  POINTS: {
    MIN_TRANSACTION: 1,
    MAX_TRANSACTION: 100000,
    EXPIRY_DAYS: 365,
    ROUNDING_MODE: 'nearest',
  },

  // Tiers
  TIERS: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const,
  TIER_THRESHOLDS: {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 25000,
    diamond: 100000,
  },

  // Streaks
  STREAKS: {
    MAX_CONSECUTIVE_DAYS: 365,
    GRACE_PERIOD_HOURS: 24,
    RESET_ON_INACTIVITY_DAYS: 30,
  },

  // Rewards
  REWARDS: {
    MIN_REDEMPTION: 100,
    MAX_DAILY_REDEMPTIONS: 10,
    VOUCHER_VALIDITY_DAYS: 90,
  },
} as const;

// ============================================================================
// Environment Detection
// ============================================================================

export const ENV = {
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  IS_SECURE: process.env.HTTPS === 'true' || process.env.NODE_ENV === 'production',
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get tier from points
 */
export function getTierFromPoints(points: number): string {
  const tiers = LOYALTY.TIER_THRESHOLDS;
  if (points >= tiers.diamond) return 'diamond';
  if (points >= tiers.platinum) return 'platinum';
  if (points >= tiers.gold) return 'gold';
  if (points >= tiers.silver) return 'silver';
  return 'bronze';
}

/**
 * Get points required for next tier
 */
export function getNextTierThreshold(currentPoints: number): number | null {
  const tiers = LOYALTY.TIERS;
  const thresholds = LOYALTY.TIER_THRESHOLDS;

  for (const tier of tiers) {
    if (thresholds[tier] > currentPoints) {
      return thresholds[tier];
    }
  }

  return null; // Already at highest tier
}

/**
 * Check if value is within allowed range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Sanitize string for logging
 */
export function sanitizeForLogging(value: string): string {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /api[_-]?key/i,
    /authorization/i,
    /credit[_-]?card/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(value)) {
      return '[REDACTED]';
    }
  }

  return value;
}
