import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Internal service authentication middleware
export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Missing internal service token',
    });
    return;
  }

  const validTokens = Object.values(config.internalServiceTokens);
  if (!validTokens.includes(token)) {
    res.status(403).json({
      success: false,
      error: 'Invalid internal service token',
    });
    return;
  }

  next();
}

// Rate limiting middleware (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(
  maxRequests: number = 100,
  windowMs: number = 60000
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = requestCounts.get(key);

    if (record && now < record.resetTime) {
      if (record.count >= maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
        return;
      }
      record.count++;
    } else {
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    }

    next();
  };
}

// Error handling middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.message,
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  // Basic sanitization - in production, use a more robust library
  const sanitizeString = (str: unknown): string => {
    if (typeof str !== 'string') return str as string;
    return str.replace(/[<>]/g, '');
  };

  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  next();
}

// JWT verification middleware placeholder
export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'No authorization header',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization format',
    });
    return;
  }

  const token = parts[1];

  // In production, verify JWT using jsonwebtoken
  // For now, we'll add a placeholder for the decoded user
  (req as Request & { user?: { userId: string } }).user = {
    userId: token, // Placeholder - actual implementation would decode JWT
  };

  next();
}
