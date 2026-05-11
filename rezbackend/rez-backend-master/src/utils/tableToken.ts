/**
 * Table Token Utility
 *
 * Generates short-lived JWT tokens for the /table namespace of Socket.IO.
 * These tokens allow authenticated customers to use the waiter-call feature
 * without requiring a full JWT authentication.
 *
 * Token contains:
 *   - storeSlug: The store the customer is at
 *   - tableNumber: The table number for routing messages
 *   - exp: Expiration timestamp (default: 4 hours)
 *
 * Usage:
 *   1. When order is created, generate a table token and return it
 *   2. Client uses tableToken when connecting to /table namespace
 */

import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';

// Default token expiration: 4 hours (in seconds)
const DEFAULT_EXPIRATION = 4 * 60 * 60;

/**
 * Generate a table token for Socket.IO authentication
 *
 * @param params.storeSlug - The store slug (e.g., 'pizza-palace-downtown')
 * @param params.tableNumber - The customer's table number
 * @param params.expirationSeconds - Token lifetime (default: 4 hours)
 * @returns JWT string or null if TABLE_TOKEN_SECRET not configured
 */
export function generateTableToken(params: {
  storeSlug: string;
  tableNumber: string;
  expirationSeconds?: number;
}): string | null {
  const secret = process.env.TABLE_TOKEN_SECRET;

  if (!secret) {
    logger.error('[TableToken] TABLE_TOKEN_SECRET not configured - cannot generate tokens');
    return null;
  }

  const { storeSlug, tableNumber, expirationSeconds = DEFAULT_EXPIRATION } = params;

  // Validate inputs
  if (!storeSlug || typeof storeSlug !== 'string') {
    throw new Error('Invalid storeSlug');
  }
  if (!tableNumber || typeof tableNumber !== 'string') {
    throw new Error('Invalid tableNumber');
  }

  const payload = {
    storeSlug: storeSlug.slice(0, 50), // Limit length
    tableNumber: tableNumber.slice(0, 20), // Limit length
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expirationSeconds,
  };

  try {
    // CVE-2015-9235 FIX: Pin algorithm to HS256 only
    const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
    logger.debug('[TableToken] Generated token for store:', storeSlug);
    return token;
  } catch (err) {
    logger.error('[TableToken] Failed to generate token:', err);
    return null;
  }
}

/**
 * Verify a table token
 *
 * @param token - The JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyTableToken(token: string): {
  storeSlug: string;
  tableNumber: string;
  exp: number;
} | null {
  const secret = process.env.TABLE_TOKEN_SECRET;

  if (!secret) {
    logger.error('[TableToken] TABLE_TOKEN_SECRET not configured - cannot verify tokens');
    return null;
  }

  try {
    // CVE-2015-9235 FIX: Pin algorithm to HS256 only
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as {
      storeSlug: string;
      tableNumber: string;
      exp: number;
    };
    return decoded;
  } catch (err: any) {
    logger.debug('[TableToken] Token verification failed:', err.message);
    return null;
  }
}

/**
 * Check if a table token is expired
 *
 * @param token - The JWT token to check
 * @returns true if expired or invalid, false if valid
 */
export function isTableTokenExpired(token: string): boolean {
  const decoded = verifyTableToken(token);
  if (!decoded) return true;
  return decoded.exp < Math.floor(Date.now() / 1000);
}
