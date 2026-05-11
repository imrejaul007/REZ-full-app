// @ts-nocheck
import * as crypto from 'crypto';
import { logger } from './logger';

/**
 * Environment Variable Validation Utility
 * Ensures all required environment variables are present and valid
 * Prevents server startup with missing or invalid configuration
 */

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_MERCHANT_SECRET: string;
  FRONTEND_URL: string;
  BCRYPT_ROUNDS: number;
}

// Required environment variables — union of all required vars across both validators.
// BUG-046: REDIS_URL is required in all environments (not just production).
// Caching, rate-limiting, and distributed locking all depend on Redis.
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_MERCHANT_SECRET',
  'JWT_ADMIN_SECRET', // required — admin tokens must use separate secret
  'OTP_HMAC_SECRET', // required — OTPs must be HMAC'd not plaintext
  'INTERNAL_SERVICE_TOKEN', // required — inter-service auth
  'INTERNAL_SERVICE_KEY', // required — outbound service-to-service auth headers
  'FRONTEND_URL',
  'REDIS_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  // ENCRYPTION_KEY protects all PII at rest (bank accounts, PANs).
  // Must be a 64-char hex string (32 bytes): node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  'ENCRYPTION_KEY',
  // GAMIFICATION_SERVICE_URL must be set so there is no hardcoded URL fallback in source.
  'GAMIFICATION_SERVICE_URL',
  // TOTP_ENCRYPTION_KEY is required in production — adminTotpService throws on first TOTP use without it.
  // Generate: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
  'TOTP_ENCRYPTION_KEY',
];

// Service-to-service URLs — required when the feature is used, but missing URL
// should not crash the entire backend (feature degrades gracefully, not hard fail).
// Set these in Render env vars for production:
//   MARKETING_SERVICE_URL=https://rez-marketing-service.onrender.com

// Recommended environment variables (warn if missing)
const RECOMMENDED_ENV_VARS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER', // or TWILIO_SENDER_ID — one of these is required for OTP delivery
  'SENDGRID_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SENTRY_DSN',
  'PUBLIC_URL',
  'MERCHANT_FRONTEND_URL',
  'CASHBACK_INSTANT_CREDIT',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'MARKETING_SERVICE_URL', // warn if missing — broadcasts will fail but backend stays up
  'GAMIFICATION_SERVICE_URL', // warn if missing — QR check-in gamification visits will be skipped
  'REZ_OTA_WEBHOOK_SECRET', // warn if missing — hotel OTA booking coin credits will fail with 500
  'REZ_COIN_TO_RUPEE_RATE', // warn if missing — defaults to 1 (1 coin = ₹1) but should be explicit
];

// Environment-specific validation rules
// CORS_ORIGIN moved to recommended — FRONTEND_URL is the fallback in getAllowedOrigins().
// Hard-failing here prevented startup when only FRONTEND_URL was set, which is a valid config.
const PRODUCTION_REQUIRED: string[] = [];

/**
 * Detailed environment validation — JWT strength checks, Razorpay contextual
 * rules, and production-specific guardrails.
 *
 * This is an internal helper called by validateEnv(). It is not exported
 * directly; use validateEnv() (or the validateEnvironment alias) instead.
 */
function runDetailedValidation(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach((varName) => {
    if (!process.env[varName] || process.env[varName]?.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Validate JWT secrets are not default values
  if (
    process.env.JWT_SECRET === 'your-fallback-secret' ||
    process.env.JWT_SECRET === 'your-super-secret-jwt-key-here'
  ) {
    errors.push('JWT_SECRET must be changed from default value');
  }

  if (process.env.JWT_MERCHANT_SECRET === 'your-merchant-secret-here-change-in-production') {
    errors.push('JWT_MERCHANT_SECRET must be changed from default value');
  }

  if (
    process.env.JWT_REFRESH_SECRET === 'your-fallback-refresh-secret' ||
    process.env.JWT_REFRESH_SECRET === 'your-refresh-token-secret'
  ) {
    errors.push('JWT_REFRESH_SECRET must be changed from default value');
  }

  // Validate JWT secret strength (minimum 32 characters)
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long for security');
  }

  if (process.env.JWT_MERCHANT_SECRET && process.env.JWT_MERCHANT_SECRET.length < 32) {
    errors.push('JWT_MERCHANT_SECRET must be at least 32 characters long for security');
  }

  // Validate MongoDB URI format
  if (
    process.env.MONGODB_URI &&
    !process.env.MONGODB_URI.startsWith('mongodb://') &&
    !process.env.MONGODB_URI.startsWith('mongodb+srv://')
  ) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }

  // Validate PORT
  const port = parseInt(process.env.PORT || '5000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  // Validate BCRYPT_ROUNDS — set a safe default so callers reading the env var directly also get 12
  if (!process.env.BCRYPT_ROUNDS || process.env.BCRYPT_ROUNDS.trim() === '') {
    process.env.BCRYPT_ROUNDS = '12';
  }
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS, 10);
  if (isNaN(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
    warnings.push('BCRYPT_ROUNDS should be between 10-15 (recommended: 12)');
  }

  // Validate Razorpay credentials are not placeholder values
  const razorpayPlaceholders = [
    'rzp_test_your_razorpay_key_id',
    'your_razorpay_key_secret',
    'your_key_id',
    'your_key_secret',
    'dummy_secret_for_dev', // Explicit dev placeholder that passes length checks but is invalid
    'REPLACE_WITH_RAZORPAY_KEY_SECRET',
  ];
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.RAZORPAY_KEY_ID || razorpayPlaceholders.includes(process.env.RAZORPAY_KEY_ID)) {
      warnings.push(
        'RAZORPAY_KEY_ID is missing or set to a placeholder — Razorpay payments will not work until configured',
      );
    } else if (process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_') && process.env.ALLOW_TEST_RAZORPAY !== 'true') {
      warnings.push(
        'WARNING: Razorpay test keys detected in production. Set ALLOW_TEST_RAZORPAY=true to allow temporarily, or switch to live keys.',
      );
    }
    if (!process.env.RAZORPAY_KEY_SECRET || razorpayPlaceholders.includes(process.env.RAZORPAY_KEY_SECRET)) {
      warnings.push(
        'RAZORPAY_KEY_SECRET is missing or set to a placeholder — Razorpay payments will not work until configured',
      );
    }

    // RAZORPAY_WEBHOOK_SECRET is required whenever Razorpay keys are configured.
    // Without it the webhook handler cannot verify HMAC signatures and any
    // attacker can forge arbitrary payment events.
    const razorpayKeysPresent =
      process.env.RAZORPAY_KEY_ID &&
      !razorpayPlaceholders.includes(process.env.RAZORPAY_KEY_ID) &&
      process.env.RAZORPAY_KEY_SECRET &&
      !razorpayPlaceholders.includes(process.env.RAZORPAY_KEY_SECRET);

    if (razorpayKeysPresent) {
      if (!process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET.trim() === '') {
        const usingTestKeys =
          process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') || process.env.ALLOW_TEST_RAZORPAY === 'true';
        if (usingTestKeys) {
          // Downgrade to warning when running with test keys — webhook HMAC verification
          // won't be enforced until live keys are configured.
          warnings.push(
            'RAZORPAY_WEBHOOK_SECRET is not set. Webhook signature verification is disabled. ' +
              'Set this before switching to live Razorpay keys.',
          );
        } else {
          errors.push(
            'RAZORPAY_WEBHOOK_SECRET is required in production when Razorpay keys are configured. ' +
              'Set this to the webhook secret shown in the Razorpay Dashboard under Settings → Webhooks.',
          );
        }
      }
    }
  }

  // Production-specific validation
  if (process.env.NODE_ENV === 'production') {
    PRODUCTION_REQUIRED.forEach((varName) => {
      if (!process.env[varName]) {
        errors.push(`Missing production-required variable: ${varName}`);
      }
    });

    // Ensure HTTPS in production
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
      warnings.push('FRONTEND_URL should use HTTPS in production');
    }

    // Warn if CORS_ORIGIN is missing — getAllowedOrigins() falls back to FRONTEND_URL
    // so this is non-fatal, but for multi-origin deployments CORS_ORIGIN should be set.
    if (!process.env.CORS_ORIGIN) {
      warnings.push(
        'CORS_ORIGIN is not set. CORS will fall back to FRONTEND_URL / MERCHANT_FRONTEND_URL. ' +
          'Set CORS_ORIGIN to a comma-separated list of allowed origins if you have multiple front-end domains.',
      );
    }

    // Ensure rate limiting is not disabled in production — hard fail
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      throw new Error('FATAL: DISABLE_RATE_LIMIT=true is not allowed in production. Rate limiting must be enabled.');
    }

    // TOTP enforcement: warn in production when disabled, but allow it during initial setup
    if (process.env.REQUIRE_ADMIN_TOTP === 'false') {
      warnings.push(
        'REQUIRE_ADMIN_TOTP=false — admin two-factor authentication is disabled. ' +
          'Re-enable TOTP after enrolling admin accounts.',
      );
    }

    // LOW-3 FIX: LOG_OTP_FOR_TESTING is deprecated — the codebase now uses EXPOSE_DEV_OTP.
    // Guard against any residual use of the old flag in production.
    if (process.env.LOG_OTP_FOR_TESTING === 'true') {
      process.env.LOG_OTP_FOR_TESTING = 'false';
      warnings.push(
        'LOG_OTP_FOR_TESTING is deprecated and was set to true — automatically overridden to false. Use EXPOSE_DEV_OTP=true in non-production environments instead.',
      );
    }
    // SMS_TEST_MODE returns OTP in the API response body — exposing OTP codes to any
    // caller in production is a critical security vulnerability. Hard-exit so the
    // server never starts with this misconfiguration in production.
    if (process.env.SMS_TEST_MODE === 'true') {
      logger.error(
        '[FATAL] SMS_TEST_MODE=true is not allowed in production. OTP codes would be exposed in API responses.',
      );
      process.exit(1);
    }

    // EXPOSE_DEV_OTP logs OTP to server logs only (not API response) — safer than SMS_TEST_MODE.
    // Allow in production during pre-launch testing; warn so it is not forgotten.
    if (process.env.EXPOSE_DEV_OTP === 'true') {
      warnings.push('EXPOSE_DEV_OTP=true — OTPs are logged to server logs. Remove before public launch.');
    }

    // BUG-073 FIX: In production, JWT_ADMIN_SECRET must be set AND must differ
    // from JWT_SECRET.  A shared or absent admin secret collapses the privilege
    // boundary between user and admin authentication surfaces — hard-fail so
    // the server never starts with this misconfiguration.
    if (!process.env.JWT_ADMIN_SECRET || process.env.JWT_ADMIN_SECRET.trim() === '') {
      errors.push(
        'FATAL: JWT_ADMIN_SECRET is not set in production. Admin tokens require a dedicated secret separate from JWT_SECRET.',
      );
    } else if (process.env.JWT_ADMIN_SECRET === process.env.JWT_SECRET) {
      errors.push(
        'FATAL: JWT_ADMIN_SECRET must not equal JWT_SECRET in production. Use a separate, independently generated secret for admin token isolation.',
      );
    }

    // Warn if PUBLIC_URL is missing — invoice and shipping label URLs will be broken
    if (!process.env.PUBLIC_URL) {
      warnings.push(
        'PUBLIC_URL is not set. Generated invoice and shipping label download links will point to localhost.',
      );
    }

    // Warn if MERCHANT_FRONTEND_URL is missing — merchant email links will be broken
    if (!process.env.MERCHANT_FRONTEND_URL) {
      warnings.push(
        'MERCHANT_FRONTEND_URL is not set. Merchant onboarding and password reset emails will point to localhost.',
      );
    }

    // Warn on AUTO_CREATE_INDEXES=true in production
    if (process.env.AUTO_CREATE_INDEXES === 'true') {
      warnings.push(
        'AUTO_CREATE_INDEXES=true in production may cause slow startup. Run db:indexes separately instead.',
      );
    }
  }

  // Warn in non-production if JWT_ADMIN_SECRET is missing — it will be a fatal error in production
  if (process.env.NODE_ENV !== 'production' && !process.env.JWT_ADMIN_SECRET) {
    warnings.push(
      'JWT_ADMIN_SECRET is not set. It is required in production — set it now to avoid startup failures on deployment.',
    );
  }

  // Check recommended variables
  RECOMMENDED_ENV_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      warnings.push(`Recommended environment variable missing: ${varName}`);
    }
  });

  // If Twilio credentials are present, ensure a sender (phone or sender ID) is also set.
  // Without it, SMSService.isConfigured() returns false and all OTP flows silently fail.
  const hasTwilioCreds = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
  const hasTwilioSender = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_SENDER_ID;
  if (hasTwilioCreds && !hasTwilioSender) {
    errors.push(
      'TWILIO_PHONE_NUMBER (or TWILIO_SENDER_ID for alphanumeric sender) is required when Twilio credentials are set. ' +
        'Without this, SMSService.isConfigured() returns false and OTP delivery silently fails.',
    );
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('\n⚠️  Environment Configuration Warnings:');
    warnings.forEach((warning) => logger.warn(`   - ${warning}`));
    logger.warn('');
  }

  // Throw if any errors
  if (errors.length > 0) {
    logger.error('\n❌ Environment Configuration Errors:');
    errors.forEach((error) => logger.error(`   - ${error}`));
    logger.error('\nPlease fix the above errors before starting the server.\n');
    throw new Error('Environment validation failed');
  }

  // Return validated config
  const config: EnvConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: port,
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_MERCHANT_SECRET: process.env.JWT_MERCHANT_SECRET!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    BCRYPT_ROUNDS: bcryptRounds,
  };

  logger.info('✅ Environment validation passed');
  logger.info(`   Environment: ${config.NODE_ENV}`);
  logger.info(`   Port: ${config.PORT}`);
  logger.info(`   Database: ${config.MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);

  return config;
}

/**
 * Check if sensitive data is exposed in environment
 */
export function checkForExposedSecrets(): void {
  // In production, block DEBUG_MODE — it exposes stack traces and secrets
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG_MODE === 'true') {
    logger.error('FATAL: DEBUG_MODE cannot be enabled in production. Shutting down.');
    process.exit(1);
  }

  // Check .env file is in .gitignore (runtime check not possible, rely on deployment checklist)
  logger.info('ℹ️  Ensure .env files are in .gitignore and never committed to version control');
}

/**
 * Generate secure random secret
 * Useful for generating new JWT secrets
 */
export function generateSecureSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Mask sensitive environment variable for logging
 */
export function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) return '***';
  return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
}

/**
 * validateEnv — Merged startup validator.
 *
 * Validates the union of all required env vars from both the original
 * validateEnvironment() and the Sprint 13 validateEnv() lists, so a single
 * call at server startup covers every required variable.
 *
 * - Logs [ENV ERROR] for each missing required var.
 * - Exits the process in production if any required vars are missing.
 * - Logs [ENV WARN] for recommended vars (never exits).
 * - Also delegates to runDetailedValidation() for JWT strength checks,
 *   Razorpay contextual validation, and production-specific rules.
 */
export function validateEnv(): void {
  const missing: string[] = [];

  // Additional recommended vars from the Sprint 13 list that are not already
  // in RECOMMENDED_ENV_VARS (defined above).
  const extraRecommended: string[] = [
    'WALLET_BALANCE_ENCRYPTION_KEY', // missing → wallet balance at-rest encryption disabled
    'RENDEZ_WEBHOOK_SECRET', // missing → Rendez webhook HMAC verification skipped
    'ADBAZAAR_INTERNAL_KEY', // missing → AdBazaar internal API calls unauthenticated
    'ADBAZAAR_WEBHOOK_SECRET', // missing → AdBazaar webhook HMAC verification skipped
    'GIFT_CARD_ENCRYPTION_KEY', // missing → gift card codes encrypted with a temporary ephemeral key (dev only; required in production)
  ];

  // Check the merged REQUIRED_ENV_VARS list (union of both old lists)
  for (const v of REQUIRED_ENV_VARS) {
    if (!process.env[v] || process.env[v]!.trim() === '') {
      missing.push(v);
      logger.error(`[ENV ERROR] Missing required env var: ${v}`);
    }
  }

  // Warn for extra recommended vars not covered by RECOMMENDED_ENV_VARS
  for (const v of extraRecommended) {
    if (!process.env[v] || process.env[v]!.trim() === '') {
      logger.warn(`[ENV WARN] Missing recommended env var: ${v}`);
    }
  }

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    logger.error(`[ENV ERROR] ${missing.length} required env var(s) missing — exiting`);
    process.exit(1);
  }

  // Run detailed JWT strength, Razorpay, and production-specific validation.
  // This may throw in production — let the error propagate to the caller.
  runDetailedValidation();
}

/**
 * validateEnvironment — alias for validateEnv().
 * Retained so existing call sites (server.ts, etc.) continue to work unchanged.
 * Both functions now validate the same merged set of required variables.
 *
 * @deprecated Use validateEnv() directly. This alias will be removed in a future cleanup.
 */
export { validateEnv as validateEnvironment };

export default {
  validateEnvironment: validateEnv,
  validateEnv,
  checkForExposedSecrets,
  generateSecureSecret,
  maskSecret,
};
