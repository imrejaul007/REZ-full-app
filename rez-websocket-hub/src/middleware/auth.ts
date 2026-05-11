import jwt from 'jsonwebtoken';
import type { AuthenticatedUser, AuthenticatedRequest } from '../types/index.js';

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

export function verifyToken(token: string): AuthenticatedUser {
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

export function authenticateRequest(req: AuthenticatedRequest): AuthenticatedUser {
  const token = extractTokenFromHeader(req.headers.authorization);
  return verifyToken(token);
}

export function wsAuthenticate(token: string): AuthenticatedUser {
  return verifyToken(token);
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: { statusCode: number; end: (data?: string) => void },
  next: (err?: Error) => void
): void {
  try {
    const user = authenticateRequest(req);
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
