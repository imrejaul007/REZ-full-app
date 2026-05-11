/**
 * Unified Internal Service Authentication Middleware
 *
 * OPS-003 FIX: Consolidates internal auth across all services.
 * Replaces 6+ different implementations with a single, audited implementation.
 *
 * Features:
 * - Timing-safe token comparison (prevents timing attacks)
 * - Scoped tokens support (per-service tokens)
 * - Legacy token fallback (DEPRECATED - for migration period only)
 * - IP allowlisting (optional)
 * - Constant-time comparison for all secrets
 *
 * MIGRATION: Replace INTERNAL_SERVICE_TOKEN with INTERNAL_SERVICE_TOKENS_JSON
 * Format: '[{"serviceId":"order-service","token":"secret1"},{"serviceId":"payment-service","token":"secret2"}]'
 */
import { Request, Response, NextFunction } from 'express';
export interface InternalAuthOptions {
    /** JSON array of {serviceId, token} objects */
    scopedTokensJson?: string;
    /** Legacy single token (deprecated, use scopedTokensJson) */
    legacyToken?: string;
    /** Optional HMAC secret for HMAC-based validation */
    hmacSecret?: string;
    /** Optional IP allowlist */
    allowedIps?: string[];
    /** Service ID for this service (for logging) */
    serviceId?: string;
}
export interface ServiceToken {
    serviceId: string;
    token: string;
}
export interface AuthenticatedRequest extends Request {
    serviceId?: string;
    isInternal?: boolean;
}
/**
 * Parse scoped tokens from JSON environment variable.
 */
export declare function parseScopedTokens(json: string): ServiceToken[];
/**
 * Find service token by serviceId.
 */
export declare function findServiceToken(tokens: ServiceToken[], serviceId: string): string | null;
/**
 * Compare two strings in constant time to prevent timing attacks.
 */
export declare function timingSafeEqual(a: string, b: string): boolean;
/**
 * Verify internal service token.
 *
 * Checks in order:
 * 1. Scoped tokens (preferred)
 * 2. Legacy single token (deprecated)
 * 3. HMAC-based validation (if hmacSecret provided)
 */
export declare function verifyInternalToken(token: string | undefined, options: InternalAuthOptions): {
    valid: boolean;
    serviceId?: string;
};
/**
 * Create internal auth middleware for Express.
 *
 * @example
 * ```typescript
 * const authMiddleware = createInternalAuthMiddleware({
 *   scopedTokensJson: process.env.INTERNAL_SERVICE_TOKENS_JSON,
 *   legacyToken: process.env.INTERNAL_SERVICE_TOKEN,
 *   allowedIps: ['10.0.0.0/8'],
 *   serviceId: 'wallet-service',
 * });
 *
 * app.use('/internal', authMiddleware);
 * ```
 */
export declare function createInternalAuthMiddleware(options: InternalAuthOptions): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export interface JwtPayload {
    sub?: string;
    userId?: string;
    merchantId?: string;
    role?: string;
    permissions?: string[];
    iat?: number;
    exp?: number;
}
/**
 * Verify JWT token (for external-facing endpoints).
 * Uses RS256 or HS256 based on configuration.
 */
export declare function verifyJwt(token: string, options: {
    secret?: string;
    publicKey?: string;
    algorithm?: 'RS256' | 'HS256';
}): Promise<JwtPayload | null>;
/**
 * Standard internal auth options from environment.
 */
export declare function createAuthOptionsFromEnv(): InternalAuthOptions;
/**
 * Pre-configured middleware for common use cases.
 */
export declare const internalAuthMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
