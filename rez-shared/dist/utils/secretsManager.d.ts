/**
 * Secrets Manager
 *
 * Manages sensitive credentials and secrets.
 * Supports both environment variables and AWS Secrets Manager.
 *
 * Usage:
 * ```typescript
 * const secrets = new SecretsManager();
 * const apiKey = await secrets.get('razorpay-api-key');
 * secrets.validateRequired(['razorpay-api-key', 'razorpay-secret']);
 * ```
 */
import type Redis from 'ioredis';
export type SecretSource = 'env' | 'aws' | 'vault';
/**
 * Base secrets manager
 */
export declare class SecretsManager {
    private source;
    private redis?;
    private secretsCache;
    private cacheKey;
    constructor(source?: SecretSource, redis?: Redis);
    /**
     * Get a secret
     */
    get(secretName: string): Promise<string | undefined>;
    /**
     * Get multiple secrets
     */
    getMultiple(secretNames: string[]): Promise<Record<string, string | undefined>>;
    /**
     * Validate that required secrets exist
     */
    validateRequired(requiredSecrets: string[]): Promise<void>;
    /**
     * Rotate a secret (store new value)
     */
    rotate(secretName: string, newValue: string): Promise<void>;
    /**
     * Audit log: log secret access (for compliance)
     */
    logAccess(secretName: string, userId?: string): Promise<void>;
    private getFromEnv;
    private getFromAws;
    private getFromVault;
    private formatEnvName;
    private getFromCache;
    private setInCache;
}
/**
 * Pre-configured secret keys
 */
export declare const SECRET_KEYS: {
    readonly RAZORPAY_KEY_ID: "razorpay-key-id";
    readonly RAZORPAY_KEY_SECRET: "razorpay-key-secret";
    readonly SENDGRID_API_KEY: "sendgrid-api-key";
    readonly SMTP_PASSWORD: "smtp-password";
    readonly TWILIO_AUTH_TOKEN: "twilio-auth-token";
    readonly TWILIO_API_KEY: "twilio-api-key";
    readonly JWT_SECRET: "jwt-secret";
    readonly OAUTH_CLIENT_SECRET: "oauth-client-secret";
    readonly DATABASE_PASSWORD: "database-password";
    readonly REDIS_PASSWORD: "redis-password";
    readonly AWS_ACCESS_KEY_ID: "aws-access-key-id";
    readonly AWS_SECRET_ACCESS_KEY: "aws-secret-access-key";
    readonly STRIPE_SECRET_KEY: "stripe-secret-key";
    readonly PAYPAL_CLIENT_SECRET: "paypal-client-secret";
    readonly GOOGLE_MAPS_API_KEY: "google-maps-api-key";
};
/**
 * Audit secrets on startup
 */
export declare function auditSecrets(secretsManager: SecretsManager, requiredSecrets: string[]): Promise<void>;
/**
 * Check for hardcoded secrets in environment (for debugging)
 */
export declare function scanForHardcodedSecrets(): void;
