import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import gdprRoutes from './routes/gdpr.routes';
import { privacyPolicyService } from './services/privacyPolicyService';
import { erasureService } from './services/erasureService';

const app = express();
const PORT = 4021;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'GDPR Compliance Service',
    version: '1.0.0',
    description: 'Comprehensive GDPR compliance solution with consent management, data erasure, and portability features',
    endpoints: {
      health: 'GET /api/health',
      requests: {
        create: 'POST /api/requests',
        get: 'GET /api/requests/:id',
        getByUser: 'GET /api/requests/user/:userId',
        update: 'PATCH /api/requests/:id'
      },
      consents: {
        create: 'POST /api/consents',
        batchUpdate: 'POST /api/consents/batch',
        getUserConsents: 'GET /api/consents/user/:userId',
        withdraw: 'DELETE /api/consents/:userId/:consentType',
        getActiveBanner: 'GET /api/consents/banner/active',
        createBanner: 'POST /api/consents/banner',
        getBanners: 'GET /api/consents/banner'
      },
      erasure: {
        request: 'POST /api/erasure/request',
        process: 'POST /api/erasure/process/:requestId',
        verify: 'POST /api/erasure/verify/:requestId'
      },
      export: {
        generate: 'POST /api/export/:userId',
        get: 'GET /api/export/:exportId'
      },
      privacyPolicy: {
        getActive: 'GET /api/privacy-policy/active',
        getById: 'GET /api/privacy-policy/:id',
        create: 'POST /api/privacy-policy',
        publish: 'POST /api/privacy-policy/:id/publish',
        accept: 'POST /api/privacy-policy/:id/accept/:userId',
        userStatus: 'GET /api/privacy-policy/user/:userId/status'
      },
      audit: {
        getUserHistory: 'GET /api/audit/user/:userId',
        export: 'GET /api/audit/export'
      },
      stats: 'GET /api/stats'
    }
  });
});

app.use('/api', gdprRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

app.use((err: ErrorWithStatus, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  console.error(`[ERROR] ${status}: ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
    code: err.code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

async function initializeServices(): Promise<void> {
  console.log('[INIT] Starting GDPR Compliance Service initialization...');

  try {
    const existingPolicy = await privacyPolicyService.findActive();
    if (!existingPolicy) {
      console.log('[INIT] No active privacy policy found. Creating default policy...');
      const defaultPolicy = await privacyPolicyService.createDefaultPolicy();
      await privacyPolicyService.publish(defaultPolicy.id);
      console.log('[INIT] Default privacy policy created and published.');
    } else {
      console.log(`[INIT] Found active privacy policy: ${existingPolicy.version}`);
    }
  } catch (error) {
    console.error('[INIT] Warning: Failed to initialize privacy policy:', error);
  }

  try {
    erasureService.storeUserData('demo_user_001', {
      userId: 'demo_user_001',
      profile: {
        id: 'demo_user_001',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        phone: '+1-555-0123',
        address: '123 Demo Street, Demo City',
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: new Date().toISOString()
      },
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'light',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      activity: [
        { action: 'login', timestamp: '2024-01-15T10:00:00Z', ip: '192.168.1.1' },
        { action: 'update_profile', timestamp: '2024-01-16T14:30:00Z' },
        { action: 'view_dashboard', timestamp: '2024-01-17T09:15:00Z' }
      ],
      transactions: [
        { id: 'txn_001', amount: 99.99, currency: 'USD', status: 'completed', date: '2024-01-10' },
        { id: 'txn_002', amount: 149.50, currency: 'USD', status: 'completed', date: '2024-01-12' }
      ],
      communications: [
        { id: 'msg_001', from: 'support@example.com', subject: 'Welcome!', date: '2024-01-01' },
        { id: 'msg_002', from: 'marketing@example.com', subject: 'Special Offer', date: '2024-01-15' }
      ],
      metadata: {
        accountType: 'premium',
        referralSource: 'google',
        tags: ['early-adopter', 'beta-tester']
      }
    });
    console.log('[INIT] Demo user data initialized for testing.');
  } catch (error) {
    console.error('[INIT] Warning: Failed to initialize demo data:', error);
  }

  console.log('[INIT] GDPR Compliance Service initialization complete.');
}

function startServer(): void {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('GDPR Compliance Service');
    console.log('='.repeat(60));
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API base URL: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(60));
    console.log('\nAvailable endpoints:');
    console.log('  POST   /api/requests              - Create data request');
    console.log('  GET    /api/requests/:id          - Get request by ID');
    console.log('  GET    /api/requests/user/:id     - Get user requests');
    console.log('  POST   /api/consents             - Grant/deny consent');
    console.log('  POST   /api/consents/batch       - Batch consent update');
    console.log('  GET    /api/consents/user/:id    - Get user consents');
    console.log('  DELETE /api/consents/:uid/:type  - Withdraw consent');
    console.log('  POST   /api/erasure/request      - Request data erasure');
    console.log('  POST   /api/erasure/process/:id - Process erasure');
    console.log('  POST   /api/export/:userId       - Export user data');
    console.log('  GET    /api/privacy-policy/active - Get active policy');
    console.log('  POST   /api/privacy-policy       - Create policy');
    console.log('  GET    /api/stats                - Get statistics');
    console.log('='.repeat(60));
  });
}

async function main(): Promise<void> {
  await initializeServices();
  startServer();
}

main().catch((error) => {
  console.error('[FATAL] Failed to start server:', error);
  process.exit(1);
});

export default app;
