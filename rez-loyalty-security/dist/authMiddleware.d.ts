/**
 * Authentication Middleware for REZ Loyalty System
 *
 * Handles JWT validation, internal service tokens, and API key authentication.
 * Supports both user-facing and service-to-service authentication.
 */
import { Request, Response, NextFunction } from 'express';
export interface JWTPayload {
    sub: string;
    role: UserRole;
    type: 'access' | 'refresh';
    iat: number;
    exp: number;
    iss?: string;
    jti?: string;
}
export type UserRole = 'user' | 'premium' | 'admin' | 'service' | 'system';
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
    serviceId?: string;
    isInternal: boolean;
}
export interface TokenValidationResult {
    valid: boolean;
    payload?: JWTPayload;
    error?: string;
}
export interface ServiceTokenConfig {
    serviceId: string;
    secret: string;
    permissions: string[];
}
/**
 * Initialize service tokens from environment
 */
export declare function initializeServiceTokens(tokens: Record<string, string>): void;
/**
 * Validate JWT token and extract payload
 */
export declare function validateJWT(token: string): TokenValidationResult;
/**
 * Generate a new JWT token
 */
export declare function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
/**
 * Validate internal service token using HMAC
 */
export declare function validateServiceToken(serviceId: string, timestamp: string, signature: string): TokenValidationResult;
/**
 * Generate a service token for outbound requests
 */
export declare function generateServiceToken(serviceId: string): {
    token: string;
    expiresAt: number;
};
/**
 * Validate API key
 */
export declare function validateApiKey(apiKey: string): TokenValidationResult;
/**
 * Main authentication middleware
 * Supports JWT, service tokens, and API keys
 */
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Require specific roles
 */
export declare function requireRole(...allowedRoles: UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Require specific service permissions
 */
export declare function requirePermission(...permissions: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - doesn't fail if no token present
 */
export declare function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
/**
 * Extract user ID from request
 */
export declare function getUserId(req: AuthenticatedRequest): string | null;
/**
 * Check if request is from internal service
 */
export declare function isInternalRequest(req: AuthenticatedRequest): boolean;
/**
 * Create auth header for outbound requests
 */
export declare function createAuthHeader(token: string): Record<string, string>;
/**
 * Create service token header for outbound requests
 */
export declare function createServiceAuthHeader(serviceId: string): Record<string, string>;
//# sourceMappingURL=authMiddleware.d.ts.map