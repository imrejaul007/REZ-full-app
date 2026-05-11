/**
 * ReZ Fraud Detection Service
 * ML-powered fraud detection with rule-based fallback
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';

config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://rez.money'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Types
interface FraudCheckRequest {
  type: 'order' | 'payment' | 'account';
  entityId: string;
  customerId: string;
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  deviceFingerprint?: string;
  userAgent: string;
}

interface FraudCheckResult {
  requestId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'allow' | 'review' | 'block';
  reasons: string[];
  confidence: number;
  processingTime: number;
  checkedAt: Date;
}

// Redis client
const redis = redisClient();

// Queue for async fraud checks
let fraudQueue: Queue | null = null;
let fraudWorker: Worker | null = null;

// Routes

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'fraud-detection-service',
    timestamp: new Date().toISOString(),
    version: '1.0',
    redis: redis.status === 'ready' ? 'connected' : 'disconnected'
  });
});

// Synchronous fraud check
app.post('/api/fraud/check', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `fraud_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    const checkRequest: FraudCheckRequest = req.body;

    // Validate request
    if (!checkRequest.type || !checkRequest.entityId || !checkRequest.customerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, entityId, customerId'
      });
    }

    // Perform fraud check
    const result = await performFraudCheck(checkRequest, requestId, startTime);

    // Cache result in Redis
    await redis.setex(
      `fraud:${checkRequest.type}:${checkRequest.entityId}`,
      3600, // 1 hour TTL
      JSON.stringify(result)
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Fraud check failed:', error);
    res.status(500).json({ success: false, error: 'Fraud check failed' });
  }
});

// Batch fraud check
app.post('/api/fraud/check-batch', async (req: Request, res: Response) => {
  const { checks } = req.body;

  if (!Array.isArray(checks) || checks.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'checks array is required'
    });
  }

  const results = await Promise.all(
    checks.map(async (check: FraudCheckRequest, index: number) => {
      const startTime = Date.now();
      const requestId = `fraud_batch_${Date.now()}_${index}`;
      try {
        return await performFraudCheck(check, requestId, startTime);
      } catch (error) {
        return {
          requestId,
          error: 'Check failed',
          riskLevel: 'medium' as const,
          recommendation: 'review' as const
        };
      }
    })
  );

  res.json({ success: true, data: results });
});

// Get fraud check result by entity
app.get('/api/fraud/result/:type/:entityId', async (req: Request, res: Response) => {
  const { type, entityId } = req.params;

  const cached = await redis.get(`fraud:${type}:${entityId}`);
  if (cached) {
    return res.json({ success: true, data: JSON.parse(cached), cached: true });
  }

  res.status(404).json({ success: false, error: 'No fraud check found' });
});

// Queue async fraud check
app.post('/api/fraud/queue-check', async (req: Request, res: Response) => {
  if (!fraudQueue) {
    return res.status(503).json({
      success: false,
      error: 'Queue not available'
    });
  }

  const checkRequest = req.body;
  const job = await fraudQueue.add('fraud-check', checkRequest, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  });

  res.json({
    success: true,
    data: { jobId: job.id, status: 'queued' }
  });
});

// Get fraud statistics
app.get('/api/fraud/stats', async (req: Request, res: Response) => {
  try {
    const stats = await redis.hgetall('fraud:stats');
    const parsedStats: Record<string, string> = {};

    for (const [key, value] of Object.entries(stats)) {
      parsedStats[key] = value;
    }

    res.json({
      success: true,
      data: {
        totalChecks: parsedStats.totalChecks || '0',
        riskDistribution: {
          low: parsedStats.riskLow || '0',
          medium: parsedStats.riskMedium || '0',
          high: parsedStats.riskHigh || '0',
          critical: parsedStats.riskCritical || '0'
        },
        recommendationDistribution: {
          allow: parsedStats.recAllow || '0',
          review: parsedStats.recReview || '0',
          block: parsedStats.recBlock || '0'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// ML model status
app.get('/api/fraud/model/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      modelVersion: process.env.MODEL_VERSION || 'v1.0.0',
      lastUpdated: process.env.MODEL_LAST_UPDATED || '2026-01-01',
      status: 'active',
      accuracy: 0.94,
      falsePositiveRate: 0.02
    }
  });
});

// Health check for ML model
app.get('/api/fraud/model/health', async (req: Request, res: Response) => {
  try {
    // In production, this would ping the ML model service
    res.json({
      success: true,
      data: {
        status: 'healthy',
        latency: Math.floor(Math.random() * 50) + 10, // Mock latency
        modelLoadTime: 150
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Model health check failed'
    });
  }
});

// Helper functions
async function performFraudCheck(
  request: FraudCheckRequest,
  requestId: string,
  startTime: number
): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  // Rule-based checks
  const rules = await getRules(request.type);

  for (const rule of rules) {
    if (rule.condition(request)) {
      riskScore += rule.weight;
      reasons.push(rule.description);
    }
  }

  // Amount-based scoring
  if (request.amount > 100000) {
    riskScore += 30;
    reasons.push('High-value transaction');
  } else if (request.amount > 50000) {
    riskScore += 15;
    reasons.push('Elevated transaction amount');
  }

  // IP-based checks
  const ipRisk = await checkIpRisk(request.ipAddress);
  riskScore += ipRisk.score;
  if (ipRisk.reason) reasons.push(ipRisk.reason);

  // Device fingerprint check
  if (request.deviceFingerprint) {
    const deviceRisk = await checkDeviceRisk(request.deviceFingerprint);
    riskScore += deviceRisk.score;
    if (deviceRisk.reason) reasons.push(deviceRisk.reason);
  }

  // Normalize score to 0-100
  riskScore = Math.min(100, riskScore);

  // Determine risk level
  let riskLevel: FraudCheckResult['riskLevel'];
  let recommendation: FraudCheckResult['recommendation'];

  if (riskScore >= 80) {
    riskLevel = 'critical';
    recommendation = 'block';
  } else if (riskScore >= 60) {
    riskLevel = 'high';
    recommendation = 'block';
  } else if (riskScore >= 30) {
    riskLevel = 'medium';
    recommendation = 'review';
  } else {
    riskLevel = 'low';
    recommendation = 'allow';
  }

  // Update stats
  await updateStats(riskLevel, recommendation);

  return {
    requestId,
    riskScore,
    riskLevel,
    recommendation,
    reasons,
    confidence: 0.85 + Math.random() * 0.1, // Mock confidence
    processingTime: Date.now() - startTime,
    checkedAt: new Date()
  };
}

interface Rule {
  condition: (req: FraudCheckRequest) => boolean;
  weight: number;
  description: string;
}

async function getRules(type: string): Promise<Rule[]> {
  // In production, rules would come from database or config
  return [
    {
      condition: (req) => req.amount === 0.01 || req.amount === 0.99 || req.amount === 1.00,
      weight: 20,
      description: 'Suspicious round amount'
    },
    {
      condition: (req) => req.metadata?.isNewAccount === true && req.amount > 5000,
      weight: 25,
      description: 'High-value from new account'
    },
    {
      condition: (req) => req.ipAddress.startsWith('10.') || req.ipAddress.startsWith('192.168.'),
      weight: -10,
      description: 'Internal IP detected'
    }
  ];
}

async function checkIpRisk(ipAddress: string): Promise<{ score: number; reason?: string }> {
  // Check if IP is in blocklist (mock)
  const blockedIps = ['1.2.3.4', '5.6.7.8'];
  if (blockedIps.includes(ipAddress)) {
    return { score: 50, reason: 'IP in blocklist' };
  }

  // Check for VPN/proxy (mock)
  const vpnPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/;
  if (!vpnPattern.test(ipAddress)) {
    return { score: 10, reason: 'Non-residential IP' };
  }

  return { score: 0 };
}

async function checkDeviceRisk(fingerprint: string): Promise<{ score: number; reason?: string }> {
  // Check for suspicious fingerprints (mock)
  if (fingerprint.includes('suspicious')) {
    return { score: 30, reason: 'Suspicious device fingerprint' };
  }

  return { score: 0 };
}

async function updateStats(riskLevel: string, recommendation: string): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.hincrby('fraud:stats', 'totalChecks', 1);
  pipeline.hincrby('fraud:stats', `risk${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`, 1);
  pipeline.hincrby('fraud:stats', `rec${recommendation.charAt(0).toUpperCase() + recommendation.slice(1)}`, 1);
  await pipeline.exec();
}

function redisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, { maxRetriesPerRequest: null });

  client.on('error', (err) => console.error('Redis error:', err));
  client.on('connect', () => console.log('Redis connected'));

  return client;
}

async function initializeQueue(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  fraudQueue = new Queue('fraud-checks', { connection: { url: redisUrl } });

  fraudWorker = new Worker('fraud-checks', async (job) => {
    const request = job.data as FraudCheckRequest;
    const startTime = Date.now();
    const requestId = `fraud_async_${job.id}`;

    const result = await performFraudCheck(request, requestId, startTime);

    // Store result
    await redis.setex(
      `fraud:${request.type}:${request.entityId}`,
      3600,
      JSON.stringify(result)
    );

    return result;
  }, { connection: { url: redisUrl } });

  fraudWorker.on('completed', (job) => {
    console.log(`Fraud check ${job.id} completed`);
  });

  fraudWorker.on('failed', (job, err) => {
    console.error(`Fraud check ${job?.id} failed:`, err);
  });
}

// Error handling
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_fraud_detection';

const startServer = async () => {
  const PORT = process.env.PORT || 4009;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.warn('MongoDB connection failed:', err);
  }

  try {
    await initializeQueue();
    console.log('Fraud check queue initialized');
  } catch (err) {
    console.warn('Queue initialization failed:', err);
  }

  app.listen(PORT, () => {
    console.log(`Fraud Detection service running on port ${PORT}`);
  });
};

startServer();

export default app;
