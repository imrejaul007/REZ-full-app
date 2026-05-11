import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const expected = process.env.INTERNAL_SERVICE_TOKEN;

  // SECURITY: Fail if expected token not configured
  if (!expected) {
    res.status(503).json({ success: false, error: 'Internal auth not configured' });
    return;
  }

  // SECURITY: Reject blank tokens
  if (!token || token.trim() === '') {
    res.status(403).json({ success: false, error: 'Invalid internal token' });
    return;
  }

  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);

  const isValid =
    tokenBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(tokenBuf, expectedBuf);

  if (!isValid) {
    res.status(403).json({ success: false, error: 'Invalid internal token' });
    return;
  }

  next();
}
