/**
 * Authentication Middleware for REZ Loyalty System
 *
 * Handles JWT validation, internal service tokens, and API key authentication.
 * Supports both user-facing and service-to-service authentication.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Types
export interface JWTPayload {
  sub: string;           // User ID
  role: UserRole;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  iss?: string;          // Issuer
  jti?: string;          // JWT ID for revocation
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

// Configuration (should come from environment in production)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const API_KEY_HEADER = 'x-api-key';

// Service tokens registry (in production, store in secure vault)
const SERVICE_TOKENS: Map<string, ServiceTokenConfig> = new Map();

/**
 * Initialize service tokens from environment
 */
export function initializeServiceTokens(tokens: Record<string, string>): void {
  for (const [serviceId, secret] of Object.entries(tokens)) {
    SERVICE_TOKENS.set(serviceId, {
      serviceId,
      secret,
      permissions: getServicePermissions(serviceId),
    });
  }
}

/**
 * Get default permissions for a service
 */
function getServicePermissions(serviceId: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'rez-api-gateway': ['read', 'write', 'admin'],
    'rez-profile-service': ['read', 'write'],
    'rez-score-service': ['read', 'write'],
    'rez-decision-service': ['read', 'write', 'decide'],
    'rez-wallet-service': ['read', 'write', 'transaction'],
    'rez-admin-service': ['read', 'write', 'admin', 'delete'],
    'rez-notifications-hub': ['read', 'write'],
    'rez-audit-logging': ['read', 'write', 'audit'],
  };
  return permissionMap[serviceId] || ['read'];
}

// ============================================================================
// JWT Authentication
// ============================================================================

/**
 * Validate JWT token and extract payload
 */
export function validateJWT(token: string): TokenValidationResult {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!payload.sub || !payload.role) {
      return { valid: false, error: 'Invalid token structure' };
    }

    if (payload.type !== 'access') {
      return { valid: false, error: 'Token must be an access token' };
    }

    return { valid: true, payload };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token has expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token signature' };
    }
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Generate a new JWT token
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: payload.type === 'refresh' ? '7d' : '1h',
  });
}

// ============================================================================
// Service Token Authentication
// ============================================================================

/**
 * Validate internal service token using HMAC
 */
export function validateServiceToken(
  serviceId: string,
  timestamp: string,
  signature: string
): TokenValidationResult {
  const serviceConfig = SERVICE_TOKENS.get(serviceId);

  if (!serviceConfig) {
    return { valid: false, error: 'Unknown service' };
  }

  // Check timestamp is within 5 minutes
  const tokenTime = parseInt(timestamp, 10);
  const now = Date.now();
  if (Math.abs(now - tokenTime) > 5 * 60 * 1000) {
    return { valid: false, error: 'Token timestamp expired' };
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', serviceConfig.secret)
    .update(`${serviceId}:${timestamp}`)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { valid: false, error: 'Invalid signature' };
  }

  return {
    valid: true,
    payload: {
      sub: serviceId,
      role: 'service',
      type: 'access',
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + 5 * 60 * 1000) / 1000),
      iss: 'rez-internal',
    },
  };
}

/**
 * Generate a service token for outbound requests
 */
export function generateServiceToken(serviceId: string): { token: string; expiresAt: number } {
  const serviceConfig = SERVICE_TOKENS.get(serviceId);
  if (!serviceConfig) {
    throw new Error(`Service ${serviceId} not registered`);
  }

  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', serviceConfig.secret)
    .update(`${serviceId}:${timestamp}`)
    .digest('hex');

  return {
    token: `${serviceId}:${timestamp}:${signature}`,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };
}

// ============================================================================
// API Key Authentication
// ============================================================================

/**
 * Validate API key
 */
export function validateApiKey(apiKey: string): TokenValidationResult {
  // In production, validate against database or vault
  if (!apiKey || apiKey.length < 32) {
    return { valid: false, error: 'Invalid API key format' };
  }

  // Example: Check against environment-configured keys
  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
  if (!validApiKeys.includes(apiKey)) {
    return { valid: false, error: 'Invalid API key' };
  }

  return {
    valid: true,
    payload: {
      sub: 'api-client',
      role: 'service',
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
    },
  };
}

// ============================================================================
// Express Middleware
// ============================================================================

/**
 * Main authentication middleware
 * Supports JWT, service tokens, and API keys
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers[API_KEY_HEADER] as string | undefined;

  // Try API key first
  if (apiKey) {
    const result = validateApiKey(apiKey);
    if (result.valid) {
      req.user = result.payload;
      req.isInternal = true;
      return next();
    }
  }

  // Try JWT
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = validateJWT(token);
    if (result.valid) {
      req.user = result.payload;
      req.isInternal = false;
      return next();
    }
  }

  // Try service token
  const serviceToken = req.headers['x-service-token'] as string | undefined;
  if (serviceToken) {
    const [serviceId, timestamp, signature] = serviceToken.split(':');
    if (serviceId && timestamp && signature) {
      const result = validateServiceToken(serviceId, timestamp, signature);
      if (result.valid) {
        req.user = result.payload;
        req.serviceId = serviceId;
        req.isInternal = true;
        return next();
      }
    }
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid authentication token required',
  });
}

/**
 * Require specific roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Require specific service permissions
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.serviceId) {
      res.status(403).json({ error: 'Service authentication required' });
      return;
    }

    const serviceConfig = SERVICE_TOKENS.get(req.serviceId);
    if (!serviceConfig) {
      res.status(403).json({ error: 'Unknown service' });
      return;
    }

    const hasAllPermissions = permissions.every((p) =>
      serviceConfig.permissions.includes(p)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Service requires permissions: ${permissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token present
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = validateJWT(token);
    if (result.valid) {
      req.user = result.payload;
    }
  }

  req.isInternal = false;
  next();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract user ID from request
 */
export function getUserId(req: AuthenticatedRequest): string | null {
  return req.user?.sub ?? null;
}

/**
 * Check if request is from internal service
 */
export function isInternalRequest(req: AuthenticatedRequest): boolean {
  return req.isInternal || req.user?.role === 'service' || req.user?.role === 'system';
}

/**
 * Create auth header for outbound requests
 */
export function createAuthHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Create service token header for outbound requests
 */
export function createServiceAuthHeader(serviceId: string): Record<string, string> {
  const { token } = generateServiceToken(serviceId);
  return { 'x-service-token': token };
}
