import jwt from 'jsonwebtoken';
import type { AuthenticatedUser, AuthenticatedRequest } from '../types/index.js';

// RABTUL: Use centralized auth service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET || 'rez-websocket-hub-secret-key-change-in-production';

export class JWTAuthError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'JWTAuthError';
  }
}

export function generateToken(user: { id: string; username: string; email?: string }): string {
  // Generate token locally for WebSocket connections
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function verifyToken(token: string): Promise<AuthenticatedUser> {
  // RABTUL: Try auth service first for centralized verification
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.user) {
        return {
          id: result.user.id,
          username: result.user.phone || result.user.id,
          role: result.user.role || 'user',
        } as AuthenticatedUser;
      }
    }
  } catch (error) {
    console.warn('[WebSocket Auth] RABTUL auth service unavailable, using local verification');
  }

  // Fallback to local verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new JWTAuthError('Token has expired', 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new JWTAuthError('Invalid token', 'INVALID_TOKEN');
    }
    throw new JWTAuthError('Token verification failed', 'VERIFICATION_FAILED');
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new JWTAuthError('No authorization header provided', 'MISSING_HEADER');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new JWTAuthError('Invalid authorization header format', 'INVALID_FORMAT');
  }

  return parts[1];
}

export async function authenticateRequest(req: AuthenticatedRequest): Promise<AuthenticatedUser> {
  const token = extractTokenFromHeader(req.headers.authorization);
  return verifyToken(token);
}

export async function wsAuthenticate(token: string): Promise<AuthenticatedUser> {
  return verifyToken(token);
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: { statusCode: number; end: (data?: string) => void },
  next: (err?: Error) => void
): Promise<void> {
  try {
    const user = await authenticateRequest(req);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof JWTAuthError) {
      res.statusCode = 401;
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: Date.now(),
      }));
      return;
    }
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: 'Internal authentication error',
      timestamp: Date.now(),
    }));
  }
}

export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: { statusCode: number; end: (data?: string) => void },
  next: (err?: Error) => void
): void {
  try {
    if (req.headers.authorization) {
      const user = authenticateRequest(req);
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}
