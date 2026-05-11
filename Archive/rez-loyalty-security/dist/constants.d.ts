/**
 * Security Constants for REZ Loyalty System
 *
 * Centralized security configuration values used across the loyalty platform.
 */
export declare const AUTH: {
    readonly JWT: {
        readonly ACCESS_TOKEN_EXPIRY: "1h";
        readonly REFRESH_TOKEN_EXPIRY: "7d";
        readonly ALGORITHM: "HS256";
        readonly ISSUER: "rez-loyalty-system";
        readonly AUDIENCE: "rez-api";
    };
    readonly PASSWORD: {
        readonly MIN_LENGTH: 8;
        readonly MAX_LENGTH: 128;
        readonly REQUIRE_UPPERCASE: true;
        readonly REQUIRE_LOWERCASE: true;
        readonly REQUIRE_NUMBER: true;
        readonly REQUIRE_SPECIAL: true;
        readonly MAX_BREACHED_CHECKS: 0;
    };
    readonly SESSION: {
        readonly MAX_DURATION: 86400000;
        readonly EXTEND_ON_ACTIVITY: true;
        readonly ABSOLUTE_TIMEOUT: 604800000;
    };
    readonly LOCKOUT: {
        readonly MAX_ATTEMPTS: 5;
        readonly LOCKOUT_DURATION: 900000;
        readonly INCREASE_DURATION_ON_REPEAT: true;
    };
};
export declare const API: {
    readonly MAX_BODY_SIZE: "10mb";
    readonly MAX_QUERY_PARAMS: 50;
    readonly MAX_HEADERS: 50;
    readonly REQUEST_TIMEOUT: 30000;
    readonly IDLE_TIMEOUT: 120000;
    readonly MAX_HEADER_SIZE: 8192;
    readonly MAX_URI_LENGTH: 8192;
    readonly MAX_FILE_SIZE: number;
    readonly MAX_FILES: 5;
    readonly MAX_RESPONSE_SIZE: number;
    readonly PAGINATION_MAX_LIMIT: 100;
    readonly PAGINATION_DEFAULT_LIMIT: 20;
};
export declare const RATE_LIMITS: {
    readonly WINDOW: {
        readonly MINUTE: 60000;
        readonly MINUTE_15: 900000;
        readonly HOUR: 3600000;
        readonly DAY: 86400000;
    };
    readonly DEFAULTS: {
        readonly READ: 100;
        readonly WRITE: 30;
        readonly DELETE: 10;
    };
    readonly BURST: {
        readonly ALLOWED: true;
        readonly MULTIPLIER: 2;
    };
    readonly SKIP_PATTERNS: readonly ["/health", "/ready", "/metrics", "/favicon.ico"];
};
export declare const CRYPTO: {
    readonly HASH_ALGORITHM: "sha256";
    readonly HMAC_ALGORITHM: "sha256";
    readonly PBKDF2_ITERATIONS: 100000;
    readonly SALT_LENGTH: 32;
    readonly ENCRYPTION_ALGORITHM: "aes-256-gcm";
    readonly KEY_LENGTH: 32;
    readonly IV_LENGTH: 16;
    readonly AUTH_TAG_LENGTH: 16;
    readonly RANDOM_BYTES_LENGTH: 32;
    readonly TOKEN_LENGTH: 32;
    readonly TOTP_ISSUER: "REZ-Loyalty";
    readonly TOTP_WINDOW: 1;
    readonly TOTP_PERIOD: 30;
};
export declare const VALIDATION: {
    readonly USER_INPUT: {
        readonly MAX_TEXT_LENGTH: 10000;
        readonly MAX_ARRAY_LENGTH: 100;
        readonly MAX_OBJECT_DEPTH: 10;
        readonly MAX_OBJECT_KEYS: 50;
    };
    readonly FIELD_LENGTHS: {
        readonly ID: 24;
        readonly EMAIL: 255;
        readonly PHONE: 20;
        readonly NAME_MIN: 2;
        readonly NAME_MAX: 100;
        readonly DESCRIPTION_MAX: 500;
    };
    readonly NUMBER_RANGES: {
        readonly POINTS_MIN: -100000;
        readonly POINTS_MAX: 1000000;
        readonly AMOUNT_MIN: 0;
        readonly AMOUNT_MAX: 10000000;
        readonly QUANTITY_MIN: 1;
        readonly QUANTITY_MAX: 1000;
    };
    readonly PATTERNS: {
        readonly EMAIL: RegExp;
        readonly PHONE: RegExp;
        readonly OBJECT_ID: RegExp;
        readonly ALPHANUMERIC: RegExp;
        readonly UUID: RegExp;
    };
};
export declare const COOKIE: {
    readonly SECURE: boolean;
    readonly HTTP_ONLY: true;
    readonly SAME_SITE: "strict";
    readonly PATH: "/";
    readonly DOMAIN: string | undefined;
    readonly MAX_AGE: 86400000;
};
export declare const CORS: {
    readonly ALLOWED_ORIGINS: string[];
    readonly ALLOWED_METHODS: readonly ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
    readonly ALLOWED_HEADERS: readonly ["Content-Type", "Authorization", "X-Request-ID", "X-Correlation-ID"];
    readonly MAX_AGE: 86400;
};
export declare const HEADERS: {
    readonly REQUIRED: readonly ["X-Content-Type-Options", "X-Frame-Options", "Strict-Transport-Security"];
    readonly RECOMMENDED: readonly ["X-XSS-Protection", "Content-Security-Policy", "X-Permitted-Cross-Domain-Policies", "Referrer-Policy", "Permissions-Policy"];
    readonly REMOVE: readonly ["X-Powered-By", "Server", "X-AspNet-Version", "X-AspNetMvc-Version"];
};
export declare const AUDIT: {
    readonly LOG_LEVELS: {
        readonly COIN_TRANSACTION: "high";
        readonly TIER_CHANGE: "high";
        readonly ADMIN_ACTION: "high";
        readonly AUTH_FAILURE: "medium";
        readonly RATE_LIMIT: "low";
        readonly DATA_ACCESS: "low";
    };
    readonly RETENTION_DAYS: 365;
    readonly BATCH_SIZE: 100;
    readonly FLUSH_INTERVAL: 5000;
};
export declare const LOYALTY: {
    readonly POINTS: {
        readonly MIN_TRANSACTION: 1;
        readonly MAX_TRANSACTION: 100000;
        readonly EXPIRY_DAYS: 365;
        readonly ROUNDING_MODE: "nearest";
    };
    readonly TIERS: readonly ["bronze", "silver", "gold", "platinum", "diamond"];
    readonly TIER_THRESHOLDS: {
        readonly bronze: 0;
        readonly silver: 1000;
        readonly gold: 5000;
        readonly platinum: 25000;
        readonly diamond: 100000;
    };
    readonly STREAKS: {
        readonly MAX_CONSECUTIVE_DAYS: 365;
        readonly GRACE_PERIOD_HOURS: 24;
        readonly RESET_ON_INACTIVITY_DAYS: 30;
    };
    readonly REWARDS: {
        readonly MIN_REDEMPTION: 100;
        readonly MAX_DAILY_REDEMPTIONS: 10;
        readonly VOUCHER_VALIDITY_DAYS: 90;
    };
};
export declare const ENV: {
    readonly IS_PRODUCTION: boolean;
    readonly IS_DEVELOPMENT: boolean;
    readonly IS_TEST: boolean;
    readonly IS_SECURE: boolean;
};
/**
 * Get tier from points
 */
export declare function getTierFromPoints(points: number): string;
/**
 * Get points required for next tier
 */
export declare function getNextTierThreshold(currentPoints: number): number | null;
/**
 * Check if value is within allowed range
 */
export declare function isInRange(value: number, min: number, max: number): boolean;
/**
 * Sanitize string for logging
 */
export declare function sanitizeForLogging(value: string): string;
//# sourceMappingURL=constants.d.ts.map