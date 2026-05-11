import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { errorResponse, errors } from '../utils/response';

function resolveScopedTokens(): Record<string, string> | null {
  try {
    const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
    if (!raw || raw.trim() === '') return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const callerService = req.headers['x-internal-service'] as string | undefined;

  // SECURITY FIX: Fail closed when no token provided — no auth bypass
  if (!token || token.length === 0) {
    return errorResponse(res, errors.authTokenMissing({ message: 'Missing internal token' }));
  }

  const scopedTokens = resolveScopedTokens();
  const legacyToken = process.env.INTERNAL_SERVICE_TOKEN;

  // SECURITY FIX (PAY-HMAC-001): Fail closed when neither auth mechanism is configured.
  // Previously fell back to 'fallback' literal string as HMAC key — trivially guessable.
  if (!scopedTokens && !legacyToken) {
    return errorResponse(res, errors.authServiceUnavailable({ message: 'Internal auth not configured — set INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN' }));
  }

  let expected: string | undefined;
  if (scopedTokens && callerService) {
    expected = scopedTokens[callerService];
  } else if (legacyToken) {
    expected = legacyToken;
  }

  // SECURITY FIX: Verify expected token is configured for this caller/service combination
  if (!expected) {
    return errorResponse(res, errors.authTokenInvalid({ message: 'No internal token configured for this service' }));
  }

  // Aligned with order service pattern: Use the configured HMAC key — never fall back to a default or empty string
  const hmacKey = Buffer.from(legacyToken || JSON.stringify(scopedTokens), 'utf8');
  const tokenHmac = crypto.createHmac('sha256', hmacKey).update(token).digest();
  const expectedHmac = crypto.createHmac('sha256', hmacKey).update(expected).digest();

  // Length check before timing-safe compare to prevent TypeError
  const isValid = tokenHmac.length === expectedHmac.length &&
    crypto.timingSafeEqual(tokenHmac, expectedHmac);

  if (!isValid) {
    return errorResponse(res, errors.authTokenInvalid());
  }

  next();
}
