/**
 * REZ Payment Correctness Service
 * Ledger, idempotency, and fraud shield with full security hardening
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Services
import { ledger, LedgerSystem } from './ledger';
import { fraudShield, FraudShield } from './fraudShield';
import { idempotency, IdempotencySystem } from './idempotency';

// ============================================================================
// Configuration
// ============================================================================

interface PaymentCorrectnessConfig {
  port?: number;
  redisUrl?: string;
}

// ============================================================================
// Security Middleware
// ============================================================================

// Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 100;

// Get service tokens
function getServiceTokens(): Record<string, string> {
  const tokensJson = process.env.INTERNAL_SERVICE_TOKENS_JSON;
  if (!tokensJson) return {};
  try {
    return JSON.parse(tokensJson);
  } catch {
    console.error('[AUTH] Failed to parse INTERNAL_SERVICE_TOKENS_JSON');
    return {};
  }
}

const SERVICE_TOKENS = getServiceTokens();

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  // Skip auth for health checks
  if (req.path === '/health' || req.path === '/ready') {
    return next();
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Token required' });
    return;
  }

  const isValid = Object.values(SERVICE_TOKENS).some(t => timingSafeEqual(t, token));
  if (!isValid) {
    console.warn(`[AUTH] Invalid token from ${req.ip} for ${req.path}`);
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    return;
  }

  next();
}

// Rate limiting middleware
function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = `ratelimit:${req.ip || 'unknown'}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitStore.set(key, record);
  }

  record.count++;

  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX - record.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

  if (record.count > RATE_LIMIT_MAX) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  next();
}

// Request ID middleware
function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) ||
    `pc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  res.setHeader('X-Request-Id', requestId);
  (req as any).requestId = requestId;
  next();
}

// Error handler
function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.error(`[${errorId}] Error:`, err.message, err.stack);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    errorId,
  });
}

// ============================================================================
// API Types
// ============================================================================

interface PaymentRequest {
  idempotencyKey: string;
  userId: string;
  merchantId: string;
  amount: number;
  cashbackPercent?: number;
  coinPercent?: number;
  phone?: string;
  ip?: string;
  deviceFingerprint?: string;
}

interface FraudCheckRequest {
  userId: string;
  amount: number;
  cashbackAmount?: number;
  phone?: string;
  ip?: string;
  deviceFingerprint?: string;
}

// ============================================================================
// API Routes
// ============================================================================

function createRoutes(app: Express): void {
  // Health checks
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'payment-correctness',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', (_req, res) => {
    res.json({
      status: 'ready',
      checks: {
        ledger: true,
        fraudShield: true,
        idempotency: true,
      },
    });
  });

  // ========================================================================
  // Payment Endpoints
  // ========================================================================

  // Process payment
  app.post('/api/payments', authMiddleware, async (req: Request, res: Response) => {
    try {
      const body: PaymentRequest = req.body;
      const requestId = (req as any).requestId;

      // Validate required fields
      if (!body.idempotencyKey || !body.userId || !body.merchantId || !body.amount) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      // Check fraud
      const fraudCheck = fraudShield.check({
        userId: body.userId,
        amount: body.amount,
        cashbackAmount: body.cashbackPercent ? (body.amount * body.cashbackPercent / 100) : undefined,
        phone: body.phone,
        ip: body.ip || req.ip,
        deviceFingerprint: body.deviceFingerprint,
      });

      if (!fraudCheck.passed) {
        console.warn(`[FRAUD] Blocked: ${fraudCheck.reason}`, { requestId, userId: body.userId });
        res.status(403).json({
          success: false,
          error: 'Transaction blocked',
          reason: fraudCheck.reason,
          severity: fraudCheck.severity,
        });
        return;
      }

      // Process payment through ledger
      const tx = ledger.processPayment({
        idempotencyKey: body.idempotencyKey,
        userId: body.userId,
        merchantId: body.merchantId,
        amount: body.amount,
        cashbackPercent: body.cashbackPercent,
        coinPercent: body.coinPercent,
      });

      res.status(200).json({
        success: true,
        transaction: tx,
        requestId,
      });
    } catch (error) {
      console.error('[PAYMENT] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment processing failed',
      });
    }
  });

  // Get transaction status
  app.get('/api/payments/:idempotencyKey', authMiddleware, (req: Request, res: Response) => {
    const { idempotencyKey } = req.params;

    const tx = ledger.getTransaction(idempotencyKey);
    if (!tx) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
      return;
    }

    res.json({
      success: true,
      transaction: tx,
    });
  });

  // ========================================================================
  // Fraud Check Endpoints
  // ========================================================================

  // Pre-flight fraud check
  app.post('/api/fraud/check', authMiddleware, (req: Request, res: Response) => {
    try {
      const body: FraudCheckRequest = req.body;

      const check = fraudShield.check({
        userId: body.userId,
        amount: body.amount,
        cashbackAmount: body.cashbackAmount,
        phone: body.phone,
        ip: body.ip || req.ip,
        deviceFingerprint: body.deviceFingerprint,
      });

      res.json({
        success: true,
        check,
      });
    } catch (error) {
      console.error('[FRAUD] Check error:', error);
      res.status(500).json({
        success: false,
        error: 'Fraud check failed',
      });
    }
  });

  // Get user risk profile
  app.get('/api/fraud/user/:userId', authMiddleware, (req: Request, res: Response) => {
    const { userId } = req.params;

    const risk = fraudShield.getUserRisk(userId);
    if (!risk) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      risk,
    });
  });

  // ========================================================================
  // Ledger Endpoints
  // ========================================================================

  // Get account balance
  app.get('/api/ledger/accounts/:type/:entityId', authMiddleware, (req: Request, res: Response) => {
    const { type, entityId } = req.params;

    const account = ledger.getAccount(type as any, entityId);
    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
      });
      return;
    }

    res.json({
      success: true,
      account: {
        id: account.id,
        type: account.type,
        entityId: account.entityId,
        balance: account.balance,
        currency: account.currency,
      },
    });
  });

  // Get ledger entries
  app.get('/api/ledger/entries', authMiddleware, (req: Request, res: Response) => {
    const { transactionId, accountType, entityId } = req.query;

    const entries = ledger.getEntries({
      transactionId: transactionId as string,
      accountType: accountType as any,
      entityId: entityId as string,
    });

    res.json({
      success: true,
      entries,
      count: entries.length,
    });
  });

  // ========================================================================
  // Idempotency Endpoints
  // ========================================================================

  // Check idempotency status
  app.get('/api/idempotency/:key', authMiddleware, (req: Request, res: Response) => {
    const { key } = req.params;

    const isProcessed = idempotency.isProcessed(key);
    const isProcessing = idempotency.isProcessing(key);

    res.json({
      success: true,
      key,
      status: isProcessed ? 'COMPLETED' : isProcessing ? 'PROCESSING' : 'NOT_FOUND',
    });
  });

  // ========================================================================
  // Metrics
  // ========================================================================

  app.get('/api/stats', authMiddleware, (_req, res) => {
    res.json({
      success: true,
      stats: {
        ledger: ledger.getStats(),
        fraudShield: fraudShield.getStats(),
        idempotency: idempotency.getStats(),
      },
    });
  });
}

// ============================================================================
// Main Application
// ============================================================================

class PaymentCorrectnessService {
  private app: Express;
  private config: PaymentCorrectnessConfig;

  constructor(config: PaymentCorrectnessConfig = {}) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    createRoutes(this.app);
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // Request ID
    this.app.use(requestIdMiddleware);

    // Rate limiting
    this.app.use(rateLimitMiddleware);

    // Body parsing
    this.app.use(express.json({ limit: '1mb' }));

    // Logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      const requestId = (req as any).requestId;
      console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`);
      next();
    });

    // Error handler
    this.app.use(errorHandler);
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      const port = this.config.port || parseInt(process.env.PORT || '4020');

      this.app.listen(port, () => {
        console.log(`\n🔒 Payment Correctness Service started on port ${port}`);
        console.log(`   Health:  http://localhost:${port}/health`);
        console.log(`   Ready:   http://localhost:${port}/ready`);
        console.log(`   API:     http://localhost:${port}/api\n`);
        resolve();
      });
    });
  }
}

// ============================================================================
// Export & Run
// ============================================================================

export { PaymentCorrectnessService };

// Run if executed directly
if (require.main === module) {
  const service = new PaymentCorrectnessService({
    port: parseInt(process.env.PORT || '4020'),
  });
  service.start();
}
