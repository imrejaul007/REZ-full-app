# QA Training Guide for ReZ Platform

**Version:** 1.0
**Last Updated:** 2026-05-05
**Scope:** ReZ Full App + Resturistan Backend

---

## Table of Contents

1. [Test Infrastructure](#1-test-infrastructure)
2. [Mock Patterns](#2-mock-patterns)
3. [API Testing Patterns](#3-api-testing-patterns)
4. [Database Testing Patterns](#4-database-testing-patterns)
5. [Critical Test Cases](#5-critical-test-cases)
6. [Edge Cases](#6-edge-cases)
7. [Mock Data Generators](#7-mock-data-generators)
8. [Test Utilities](#8-test-utilities)
9. [Coverage Targets](#9-coverage-targets)
10. [E2E Test Scenarios](#10-e2e-test-scenarios)

---

## 1. Test Infrastructure

### 1.1 Framework Configuration

The ReZ platform uses **Jest** as the primary test runner across most services, with **Vitest** for frontend apps and **Playwright** for E2E tests.

#### Root Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.test.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: [
    '<rootDir>/**/*.ts',
    '!<rootDir>/**/__tests__/**',
    '!<rootDir>/index.ts',
  ],
};
```

#### Service-Level Configuration Pattern
Most services use this pattern:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

#### Vitest Configuration (Frontend Apps)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist'],
    },
  },
});
```

#### Playwright Configuration (rez-now E2E)
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 }, // iPhone 14 - mobile-first
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 1.2 Test Directories

| Pattern | Purpose |
|---------|---------|
| `__tests__/` | Primary test location (Jest convention) |
| `test/` | Alternative test location (Node.js convention) |
| `tests/` | Integration/test setup files |
| `e2e/` | Playwright E2E tests |
| `fixtures/` | Test fixtures and mock data |

### 1.3 Test Dependencies

#### Required Packages (add to package.json devDependencies)
```json
{
  "devDependencies": {
    "jest": "^29.x",
    "ts-jest": "^29.x",
    "@types/jest": "^29.x",
    "@types/node": "^20.x",
    "jest-extended": "^4.x",
    "mongodb-memory-server": "^9.x",
    "supertest": "^6.x",
    "@types/supertest": "^2.x"
  }
}
```

#### For Frontend Tests
```json
{
  "devDependencies": {
    "@playwright/test": "^1.x",
    "vitest": "^1.x",
    "@vitest/coverage-v8": "^1.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x"
  }
}
```

---

## 2. Mock Patterns

### 2.1 Service Mock Pattern (Jest)

**Location:** `__tests__/` or alongside source files

```typescript
// Example: Mocking a service dependency
jest.mock('../src/services/walletIntegration', () => ({
  creditUserWallet: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../src/models/KarmaProfile', () => ({
  KarmaProfile: {
    findById: jest.fn().mockReturnValue({
      lean: () => Promise.resolve(mockProfile),
    }),
    create: jest.fn(),
  },
}));

jest.mock('../src/config/logger', () => ({
  createServiceLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));
```

### 2.2 Middleware Mock Pattern

```typescript
// Mock auth middleware for route tests
const mockRequireAuth = jest.fn((req: Request, _res: Response, next: NextFunction) => {
  req.userId = '507f1f77bcf86cd799439011';
  req.userRole = 'user';
  next();
});

jest.mock('../src/middleware/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...(args as [Request, Response, NextFunction])),
}));

jest.mock('../src/middleware/adminAuth', () => ({
  requireAdminAuth: jest.fn().mockImplementation((req, res, next) => {
    if (req.headers['x-admin'] === 'true') {
      req.userId = 'admin-user-1';
      req.userRole = 'admin';
      next();
    } else {
      res.status(403).json({ success: false, message: 'Admin access required' });
    }
  }),
}));
```

### 2.3 Redis Mock Pattern

```typescript
// Simple Redis mock
const mockRedis = {
  ping: jest.fn().mockResolvedValue('PONG'),
  status: 'ready',
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
};

jest.mock('../src/config/redis', () => ({
  redis: mockRedis,
  getRedisClient: jest.fn().mockReturnValue(mockRedis),
}));
```

### 2.4 Mongoose Model Mock Pattern

```typescript
// Mocking Mongoose models with lean queries
jest.mock('../src/models/Batch', () => {
  const BatchConstructor = function(data: Record<string, unknown>) {
    return {
      ...data,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue(this),
    };
  } as unknown as Record<string, unknown>;

  BatchConstructor.findById = (id: unknown) => ({
    lean: () => mockBatchFindById(id),
  });
  BatchConstructor.findOne = (q: unknown) => ({
    lean: () => mockBatchFindOne(q),
  });
  BatchConstructor.find = (q: unknown) => ({
    lean: () => mockEarnRecordFind(q),
  });
  BatchConstructor.updateMany = mockBatchUpdateMany;

  return { Batch: BatchConstructor, BatchModel: BatchConstructor };
});
```

### 2.5 Config Mock Pattern

```typescript
jest.mock('../config', () => ({
  config: {
    service: { name: 'test-service', port: 3001, env: 'test' },
    mongodb: { uri: 'mongodb://localhost:27017/test' },
    redis: { host: 'localhost', port: 6379 },
  },
  getRedisClient: jest.fn().mockReturnValue(mockRedis),
}));
```

### 2.6 Express App Mock Pattern

```typescript
// For integration tests with supertest
import request from 'supertest';
import express from 'express';

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use('/api/karma', karmaRoutes);
});

it('returns profile data', async () => {
  const res = await request(app)
    .get('/api/karma/user/507f1f77bcf86cd799439011')
    .set('Authorization', 'Bearer valid-token');

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('userId');
});
```

---

## 3. API Testing Patterns

### 3.1 REST API Testing with Supertest

```typescript
import request from 'supertest';
import { Express } from 'express';

describe('Auth API', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          phone: '9876543210',
          role: 'user',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data.user');
      expect(res.body).toHaveProperty('data.token');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          phone: '9876543211',
          role: 'user',
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message', /already exists/i);
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
          phone: '9876543210',
          role: 'user',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });
  });
});
```

### 3.2 Validation Schema Testing

```typescript
// Using Node.js built-in test runner with assert
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('OrderTotalsSchema - rejects negative values', () => {
  const { OrderTotalsSchema } = require('../dist/orderSchemas');

  const result = OrderTotalsSchema.safeParse({
    subtotal: -100,
  });

  assert.equal(result.success, false);
});

test('OrderPaymentSchema - valid payment with all statuses', () => {
  const { OrderPaymentSchema } = require('../dist/orderSchemas');

  const validStatuses = [
    'pending', 'processing', 'completed', 'failed',
    'cancelled', 'expired', 'refund_initiated',
    'refund_processing', 'refunded', 'refund_failed',
  ];

  validStatuses.forEach((status) => {
    const result = OrderPaymentSchema.safeParse({
      method: 'card',
      status,
      amount: 100,
    });
    assert.equal(result.success, true, `Status ${status} should be valid`);
  });
});
```

### 3.3 Error Response Testing

```typescript
test('returns 401 for unauthenticated requests', async () => {
  const res = await request(app)
    .get('/api/karma/user/507f1f77bcf86cd799439011');

  expect(res.status).toBe(401);
  expect(res.body).toHaveProperty('message');
});

test('returns 403 for non-admin users on admin endpoints', async () => {
  const res = await request(app)
    .get('/api/admin/batch/preview')
    .set('Authorization', 'Bearer user-token');

  expect(res.status).toBe(403);
  expect(res.body).toHaveProperty('message', /admin/i);
});
```

---

## 4. Database Testing Patterns

### 4.1 MongoDB Memory Server Setup

```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await ModelName.deleteMany({});
});
```

### 4.2 Model Testing Pattern

```typescript
describe('KarmaProfile Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await KarmaProfile.deleteMany({});
  });

  describe('create', () => {
    it('should create a profile with default values', async () => {
      const profile = await KarmaProfile.create({
        userId: new mongoose.Types.ObjectId(),
        lifetimeKarma: 0,
        activeKarma: 0,
        level: 'L1',
      });

      expect(profile).toBeDefined();
      expect(profile.level).toBe('L1');
      expect(profile.eventsCompleted).toBe(0);
      expect(profile.trustScore).toBe(0);
    });

    it('should enforce required userId', async () => {
      await expect(
        KarmaProfile.create({ lifetimeKarma: 0 })
      ).rejects.toThrow();
    });
  });
});
```

### 4.3 State Machine Validation Testing

```typescript
describe('Payment State Machine', () => {
  it('should allow valid transitions', async () => {
    const payment = await Payment.create({
      paymentId: 'PAY-001',
      status: 'pending',
      amount: 100,
      // ... required fields
    });

    payment.status = 'processing';
    await expect(payment.save()).resolves.toBeDefined();
  });

  it('should reject invalid transitions', async () => {
    const payment = await Payment.create({
      paymentId: 'PAY-002',
      status: 'pending',
      amount: 100,
      // ... required fields
    });

    payment.status = 'refunded'; // Invalid: pending -> refunded
    await expect(payment.save()).rejects.toThrow(/Invalid payment transition/);
  });

  it('should allow terminal state transitions', async () => {
    const payment = await Payment.create({
      paymentId: 'PAY-003',
      status: 'completed',
      amount: 100,
    });

    payment.status = 'refunded'; // valid: completed -> refunded
    await expect(payment.save()).resolves.toBeDefined();
  });
});
```

---

## 5. Critical Test Cases

### 5.1 Payment Flow Tests

#### Payment States
- `pending` - Initial state after payment initiation
- `processing` - Payment gateway processing
- `completed` - Payment successful, wallet credited
- `failed` - Payment failed
- `cancelled` - Payment cancelled by user
- `expired` - Payment timeout
- `refund_initiated` - Refund requested
- `refund_processing` - Refund in progress
- `refunded` - Refund completed
- `refund_failed` - Refund failed
- `partially_refunded` - Partial refund

#### Required Tests

```typescript
describe('Payment Flow - All States', () => {
  // State: pending
  describe('pending -> processing', () => {
    it('should transition from pending to processing', async () => {
      const payment = await createPayment({ status: 'pending' });
      payment.status = 'processing';
      await expect(payment.save()).resolves.toBeDefined();
    });
  });

  // State: processing -> completed
  describe('processing -> completed', () => {
    it('should credit wallet on completion', async () => {
      const payment = await createPayment({ status: 'processing' });
      payment.status = 'completed';

      const mockWalletCredit = jest.spyOn(walletService, 'creditUserWallet');

      await payment.save();

      expect(mockWalletCredit).toHaveBeenCalledWith({
        userId: payment.user.toString(),
        amount: payment.amount,
        sourceId: payment.paymentId,
      });
    });

    it('should not double-credit on duplicate webhook', async () => {
      const payment = await createPayment({ status: 'completed' });

      // Simulate duplicate webhook
      await handleWebhookCaptured(payment.paymentId);

      // Wallet credit should be idempotent
      const credits = await WalletCredit.countDocuments({
        paymentId: payment.paymentId
      });
      expect(credits).toBe(1);
    });
  });

  // State: completed -> refund_initiated
  describe('completed -> refund_initiated', () => {
    it('should allow refund initiation on completed payment', async () => {
      const payment = await createPayment({ status: 'completed' });
      payment.status = 'refund_initiated';
      await expect(payment.save()).resolves.toBeDefined();
    });

    it('should reject refund initiation on pending payment', async () => {
      const payment = await createPayment({ status: 'pending' });
      payment.status = 'refund_initiated';
      await expect(payment.save()).rejects.toThrow();
    });
  });

  // State: refund_initiated -> refunded
  describe('refund_initiated -> refunded', () => {
    it('should process full refund correctly', async () => {
      const payment = await createPayment({
        status: 'refund_initiated',
        amount: 1000,
        refundedAmount: 1000,
      });
      payment.status = 'refunded';
      await expect(payment.save()).resolves.toBeDefined();
    });

    it('should prevent over-refund', async () => {
      const payment = await createPayment({
        status: 'refund_initiated',
        amount: 1000,
        refundedAmount: 1100, // Over refund
      });
      payment.status = 'refunded';
      await expect(payment.save()).rejects.toThrow(/exceeds/i);
    });
  });

  // State: failed
  describe('failed state', () => {
    it('should capture failure reason', async () => {
      const payment = await createPayment({
        status: 'failed',
        failureReason: 'Insufficient funds',
      });
      expect(payment.failureReason).toBe('Insufficient funds');
    });

    it('should not credit wallet on failure', async () => {
      const payment = await createPayment({ status: 'failed' });
      const walletBalance = await getWalletBalance(payment.userId);

      expect(walletBalance).toBe(0);
    });
  });

  // State: expired
  describe('expired state', () => {
    it('should expire pending payments after timeout', async () => {
      const payment = await createPayment({
        status: 'pending',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      });

      await expireOldPayments();

      const expired = await Payment.findOne({ paymentId: payment.paymentId });
      expect(expired.status).toBe('expired');
    });
  });
});
```

### 5.2 Order Flow Tests

#### Order States
- `pending` - Order created
- `placed` - Order confirmed by merchant
- `confirmed` - Payment confirmed
- `preparing` - Merchant preparing
- `ready` - Ready for pickup/delivery
- `dispatched` - Order dispatched
- `out_for_delivery` - In delivery
- `delivered` - Completed
- `cancelled` - Cancelled
- `cancelling` - Cancellation in progress
- `returned` - Order returned
- `refunded` - Refund completed

#### Required Tests

```typescript
describe('Order Flow - All States', () => {
  // Valid state transitions
  describe('Fulfillment Lifecycle', () => {
    const validTransitions = [
      'pending', 'placed', 'confirmed', 'preparing',
      'ready', 'dispatched', 'out_for_delivery', 'delivered'
    ];

    it.each(validTransitions.slice(0, -1))(
      'should allow %s -> next state',
      async (fromStatus) => {
        const order = await createOrder({ status: fromStatus });
        const nextIndex = validTransitions.indexOf(fromStatus) + 1;
        order.status = validTransitions[nextIndex];

        await expect(order.save()).resolves.toBeDefined();
      }
    );

    it('should allow skipping forward states', async () => {
      const order = await createOrder({ status: 'placed' });
      order.status = 'preparing'; // Skip confirmed
      await expect(order.save()).resolves.toBeDefined();
    });

    it('should block backward jumps beyond one step', async () => {
      const order = await createOrder({ status: 'preparing' });
      order.status = 'confirmed'; // Valid backward jump
      await expect(order.save()).resolves.toBeDefined();

      order.status = 'placed'; // Invalid backward jump
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Cancellation Flow', () => {
    it('should allow cancellation from cancelling state', async () => {
      const order = await createOrder({ status: 'cancelling' });
      order.status = 'cancelled';
      await expect(order.save()).resolves.toBeDefined();
    });

    it('should block cancellation from delivered', async () => {
      const order = await createOrder({ status: 'delivered' });
      order.status = 'cancelled';
      await expect(order.save()).rejects.toThrow();
    });

    it('should allow cancellation during fulfillment with reason', async () => {
      const order = await createOrder({ status: 'preparing' });
      order.status = 'cancelling';
      order.cancellationReason = 'Customer requested';
      await expect(order.save()).resolves.toBeDefined();
    });
  });

  describe('Refund Flow', () => {
    it('should allow returned -> refunded', async () => {
      const order = await createOrder({ status: 'returned' });
      order.status = 'refunded';
      await expect(order.save()).resolves.toBeDefined();
    });

    it('should link refund to payment', async () => {
      const order = await createOrder({
        status: 'delivered',
        payment: { status: 'completed' }
      });
      order.status = 'returned';

      await order.save();

      const refund = await Refund.findOne({ orderId: order.orderId });
      expect(refund).toBeDefined();
    });
  });
});
```

### 5.3 Coin Redemption Flow Tests

#### Karma/Coin Lifecycle
- **Earn**: Karma earned from events (L1=25%, L2=50%, L3=75%, L4=100%)
- **Convert**: Karma converted to ReZ Coins (weekly batch)
- **Redeem**: Coins spent at merchants
- **Expire**: Coins have validity period (if applicable)

#### Required Tests

```typescript
describe('Coin Redemption Flow', () => {
  describe('Karma Earning (earn)', () => {
    it('should earn karma for event attendance', async () => {
      const event = await createEvent({ difficulty: 'easy' });
      const user = await createUser();

      const karma = calculateKarmaEarned(event, 4); // 4 hours

      expect(karma).toBeGreaterThan(0);
    });

    it('should apply difficulty multiplier', async () => {
      const easyEvent = createEvent({ difficulty: 'easy', baseKarmaPerHour: 50 });
      const hardEvent = createEvent({ difficulty: 'hard', baseKarmaPerHour: 50 });

      expect(calculateKarmaEarned(hardEvent, 2))
        .toBeGreaterThan(calculateKarmaEarned(easyEvent, 2));
    });

    it('should cap karma at maxKarmaPerEvent', async () => {
      const event = createEvent({ maxKarmaPerEvent: 200 });
      const karma = calculateKarmaEarned(event, 10);

      expect(karma).toBeLessThanOrEqual(200);
    });

    it('should update karma level thresholds', async () => {
      expect(calculateLevel(499)).toBe('L1');
      expect(calculateLevel(500)).toBe('L2');
      expect(calculateLevel(1999)).toBe('L2');
      expect(calculateLevel(2000)).toBe('L3');
      expect(calculateLevel(5000)).toBe('L4');
    });
  });

  describe('Karma Decay', () => {
    it('should apply 20% decay after 30 days inactive', async () => {
      const profile = createProfile({ activeKarma: 1000, lastActivityDaysAgo: 35 });
      const delta = applyDailyDecay(profile);

      expect(delta.activeKarmaChange).toBe(-200);
    });

    it('should apply 40% decay after 45 days inactive', async () => {
      const profile = createProfile({ activeKarma: 1000, lastActivityDaysAgo: 50 });
      const delta = applyDailyDecay(profile);

      expect(delta.activeKarmaChange).toBe(-400);
    });

    it('should apply 70% decay after 60+ days inactive', async () => {
      const profile = createProfile({ activeKarma: 1000, lastActivityDaysAgo: 70 });
      const delta = applyDailyDecay(profile);

      expect(delta.activeKarmaChange).toBe(-700);
    });

    it('should drop level when crossing threshold', async () => {
      const profile = createProfile({
        activeKarma: 600,
        lastActivityDaysAgo: 35,
        level: 'L2',
      });
      const delta = applyDailyDecay(profile);

      expect(delta.levelChange).toBe(true);
      expect(delta.newLevel).toBe('L1');
    });
  });

  describe('Karma to Coin Conversion (convert)', () => {
    it('should convert at L1 rate (25%)', async () => {
      const coins = calculateConversion(1000, 0.25);
      expect(coins).toBe(250);
    });

    it('should convert at L2 rate (50%)', async () => {
      const coins = calculateConversion(1000, 0.5);
      expect(coins).toBe(500);
    });

    it('should apply weekly coin cap (300)', async () => {
      const coins = applyCaps(500, 0); // First week, no previous
      expect(coins).toBe(300);
    });

    it('should reduce cap by already earned coins', async () => {
      const coins = applyCaps(500, 100); // 100 already earned
      expect(coins).toBe(200);
    });

    it('should return 0 when cap exhausted', async () => {
      const coins = applyCaps(100, 300);
      expect(coins).toBe(0);
    });

    it('should floor fractional results', async () => {
      const coins = calculateConversion(333, 0.75);
      expect(coins).toBe(249); // 333 * 0.75 = 249.75 -> 249
    });
  });

  describe('Coin Redemption (redeem)', () => {
    it('should deduct coins on redemption', async () => {
      const user = await createUser({ coinBalance: 500 });
      const order = await createOrder({ total: 100, coinDiscount: 50 });

      await redeemCoins(user.id, order.orderId, 50);

      const updatedUser = await User.findById(user.id);
      expect(updatedUser.coinBalance).toBe(450);
    });

    it('should reject redemption exceeding balance', async () => {
      const user = await createUser({ coinBalance: 30 });

      await expect(redeemCoins(user.id, 'order-123', 50))
        .rejects.toThrow(/insufficient/i);
    });

    it('should record redemption in transaction history', async () => {
      const user = await createUser({ coinBalance: 500 });
      const order = await createOrder({ coinDiscount: 100 });

      await redeemCoins(user.id, order.orderId, 100);

      const tx = await Transaction.findOne({
        userId: user.id,
        type: 'debit',
        source: 'redemption',
      });
      expect(tx.amount).toBe(100);
    });
  });

  describe('Coin Expiration', () => {
    it('should expire coins after validity period', async () => {
      const user = await createUser({
        coinBalance: 100,
        coinExpiry: new Date(Date.now() - 86400000), // 1 day ago
      });

      await processExpiredCoins();

      const expired = await User.findById(user.id);
      expect(expired.coinBalance).toBe(0);
    });

    it('should not expire coins within validity period', async () => {
      const user = await createUser({
        coinBalance: 100,
        coinExpiry: new Date(Date.now() + 86400000), // 1 day from now
      });

      await processExpiredCoins();

      const notExpired = await User.findById(user.id);
      expect(notExpired.coinBalance).toBe(100);
    });
  });
});
```

### 5.4 Auth Flow Tests

#### Auth States/Operations
- `register` - New user registration
- `login` - User login with credentials
- `logout` - Session termination
- `refresh` - Token refresh
- `verify` - OTP verification
- `reset_password` - Password reset

#### Required Tests

```typescript
describe('Auth Flow', () => {
  describe('Registration', () => {
    it('should register new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          phone: '9876543210',
          role: 'user',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('newuser@example.com');
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await createUser({ email: 'existing@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          phone: '9876543210',
          role: 'user',
        });

      expect(res.status).toBe(409);
    });

    it('should hash password before storage', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'hashtest@example.com',
          password: 'MyPassword123!',
          phone: '9876543210',
          role: 'user',
        });

      const user = await User.findOne({ email: 'hashtest@example.com' });
      expect(user.passwordHash).not.toBe('MyPassword123!');
      expect(await bcrypt.compare('MyPassword123!', user.passwordHash)).toBe(true);
    });

    it('should validate password strength', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
          phone: '9876543210',
          role: 'user',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      await createUser({
        email: 'login@example.com',
        passwordHash: await bcrypt.hash('ValidPass123!', 12),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'ValidPass123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await createUser({ email: 'user@example.com' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
    });

    it('should reject inactive user', async () => {
      await createUser({
        email: 'inactive@example.com',
        isActive: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'ValidPass123!',
        });

      expect(res.status).toBe(401);
    });

    it('should record last login timestamp', async () => {
      await createUser({ email: 'lastlogin@example.com' });

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'lastlogin@example.com',
          password: 'ValidPass123!',
        });

      const user = await User.findOne({ email: 'lastlogin@example.com' });
      expect(user.lastLogin).toBeDefined();
    });
  });

  describe('Logout', () => {
    it('should invalidate refresh token', async () => {
      const user = await createUser();
      const refreshToken = generateRefreshToken(user);

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(200);

      // Token should be blacklisted
      const isValid = await verifyRefreshToken(refreshToken);
      expect(isValid).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should issue new access token with valid refresh token', async () => {
      const user = await createUser();
      const { refreshToken } = generateTokens(user);

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken });

      expect(res.status).toBe(401);
    });

    it('should reject blacklisted refresh token', async () => {
      const { refreshToken } = generateTokens(user);
      await blacklistToken(refreshToken);

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
    });
  });

  describe('OTP Verification', () => {
    it('should send OTP to valid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '9876543210' });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('OTP sent');
    });

    it('should verify valid OTP', async () => {
      const otp = '123456';
      await redis.set(`otp:${phone}`, otp, 'EX', 300);

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp: '000000' });

      expect(res.status).toBe(401);
    });

    it('should reject expired OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp: '123456' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('expired');
    });

    it('should limit OTP attempts', async () => {
      // Attempt 6 times with wrong OTP
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .send({ phone: '9876543210', otp: '000000' });
      }

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp: '123456' });

      expect(res.status).toBe(429);
    });
  });
});
```

### 5.5 QR Scan Flow Tests

#### QR Scan States
- `scan` - User scans QR code
- `validate` - Validate QR code authenticity
- `checkin` - Record check-in (if applicable)
- `checkout` - Record check-out (if applicable)
- `calculate` - Calculate karma earned
- `award` - Award karma to user

#### Required Tests

```typescript
describe('QR Scan Flow', () => {
  describe('QR Code Validation', () => {
    it('should validate legitimate QR code', async () => {
      const qrCode = await createQRCode({
        eventId: 'event-123',
        type: 'checkin',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const isValid = await validateQRCode(qrCode.code);
      expect(isValid).toBe(true);
    });

    it('should reject expired QR code', async () => {
      const qrCode = await createQRCode({
        eventId: 'event-123',
        type: 'checkin',
        expiresAt: new Date(Date.now() - 3600000), // Expired
      });

      const isValid = await validateQRCode(qrCode.code);
      expect(isValid).toBe(false);
    });

    it('should reject already-used one-time QR code', async () => {
      const qrCode = await createQRCode({
        eventId: 'event-123',
        type: 'checkin',
        isOneTime: true,
        usedAt: new Date(), // Already used
      });

      const isValid = await validateQRCode(qrCode.code);
      expect(isValid).toBe(false);
    });

    it('should reject invalid QR format', async () => {
      const isValid = await validateQRCode('invalid-qr-code');
      expect(isValid).toBe(false);
    });

    it('should reject QR from different event', async () => {
      const otherEventQR = await createQRCode({
        eventId: 'other-event',
        type: 'checkin',
      });

      const isValid = await validateQRCode(otherEventQR.code, 'event-123');
      expect(isValid).toBe(false);
    });
  });

  describe('Check-In Flow', () => {
    it('should record successful check-in', async () => {
      const event = await createEvent({ status: 'published' });
      const user = await createUser();
      const qrCode = await createQRCode({
        eventId: event._id,
        type: 'checkin',
      });

      await recordCheckIn(user.id, qrCode.code);

      const checkIn = await CheckIn.findOne({
        userId: user.id,
        eventId: event._id,
      });
      expect(checkIn).toBeDefined();
      expect(checkIn.checkInTime).toBeDefined();
    });

    it('should prevent duplicate check-in', async () => {
      const event = await createEvent({ status: 'published' });
      const user = await createUser();
      const qrCode = await createQRCode({
        eventId: event._id,
        type: 'checkin',
      });

      await recordCheckIn(user.id, qrCode.code);

      await expect(recordCheckIn(user.id, qrCode.code))
        .rejects.toThrow(/already checked in/i);
    });

    it('should prevent check-in on unpublished event', async () => {
      const event = await createEvent({ status: 'draft' });
      const qrCode = await createQRCode({
        eventId: event._id,
        type: 'checkin',
      });

      await expect(recordCheckIn(user.id, qrCode.code))
        .rejects.toThrow(/event not available/i);
    });

    it('should validate GPS location', async () => {
      const event = await createEvent({
        gpsRadius: 100, // 100 meters
        location: { lat: 12.9716, lng: 77.5946 },
      });
      const qrCode = await createQRCode({
        eventId: event._id,
        type: 'checkin',
      });

      // User is 200 meters away
      const isValid = await validateGPSLocation(
        { lat: 12.9734, lng: 77.5946 },
        event.location,
        event.gpsRadius
      );
      expect(isValid).toBe(false);
    });
  });

  describe('Check-Out Flow', () => {
    it('should record successful check-out', async () => {
      const event = await createEvent();
      const user = await createUser();
      const qrCode = await createQRCode({
        eventId: event._id,
        type: 'checkout',
      });

      await recordCheckOut(user.id, qrCode.code);

      const checkOut = await CheckOut.findOne({
        userId: user.id,
        eventId: event._id,
      });
      expect(checkOut).toBeDefined();
    });

    it('should require prior check-in for check-out', async () => {
      const event = await createEvent();
      const qrCode = await createQRCode({
        eventId: event._id,
        type: 'checkout',
      });

      await expect(recordCheckOut(user.id, qrCode.code))
        .rejects.toThrow(/must check in first/i);
    });

    it('should calculate karma on check-out', async () => {
      const event = await createEvent({
        baseKarmaPerHour: 50,
        difficulty: 'medium',
        maxKarmaPerEvent: 300,
      });
      const user = await createUser();
      const checkIn = await recordCheckIn(user.id, event.checkInQR);
      const checkOutTime = Date.now() + 4 * 3600000; // 4 hours later

      const karma = await calculateKarmaOnCheckout(user.id, event._id, checkOutTime);

      // 50 * 4 * 1.5 (medium) = 300, capped at max
      expect(karma).toBe(300);
    });
  });

  describe('Karma Award', () => {
    it('should award karma to user profile', async () => {
      const user = await createUser({ activeKarma: 500, level: 'L2' });
      const karma = 100;

      await awardKarma(user.id, karma);

      const updated = await User.findById(user.id);
      expect(updated.activeKarma).toBe(600);
    });

    it('should update level when threshold crossed', async () => {
      const user = await createUser({ activeKarma: 490, level: 'L1' });

      await awardKarma(user.id, 20); // Cross 500 threshold

      const updated = await User.findById(user.id);
      expect(updated.level).toBe('L2');
    });

    it('should record karma history', async () => {
      const user = await createUser();

      await awardKarma(user.id, 50, { source: 'event', eventId: 'event-123' });

      const history = await KarmaHistory.findOne({
        userId: user.id,
        karma: 50,
      });
      expect(history.source).toBe('event');
      expect(history.eventId).toBe('event-123');
    });
  });
});
```

---

## 6. Edge Cases

### 6.1 Payment Edge Cases

```typescript
describe('Payment Edge Cases', () => {
  describe('Concurrency', () => {
    it('should handle concurrent capture attempts (idempotency)', async () => {
      const payment = await createPayment({ status: 'processing' });

      // Simulate two webhook calls arriving simultaneously
      await Promise.allSettled([
        handleWebhookCaptured(payment.paymentId),
        handleWebhookCaptured(payment.paymentId),
      ]);

      // Should only credit once
      const credits = await WalletCredit.countDocuments({
        paymentId: payment.paymentId
      });
      expect(credits).toBe(1);
    });

    it('should handle concurrent refund attempts', async () => {
      const payment = await createPayment({
        status: 'completed',
        amount: 100,
      });

      await Promise.allSettled([
        processRefund(payment.paymentId, 50),
        processRefund(payment.paymentId, 50),
      ]);

      // Should total 100, not 100
      const refundTotal = await Refund.aggregate([{
        $match: { paymentId: payment.paymentId }
      }, {
        $group: { _id: null, total: { $sum: '$amount' } }
      }]);

      expect(refundTotal[0].total).toBeLessThanOrEqual(100);
    });
  });

  describe('Recovery', () => {
    it('should recover from failed wallet credit', async () => {
      const payment = await createPayment({
        status: 'completed',
        walletCredited: false,
        completedAt: new Date(Date.now() - 3600000), // 1 hour ago
      });

      await lostCoinsRecoveryWorker();

      const recovery = await WalletCredit.findOne({
        paymentId: payment.paymentId,
      });
      expect(recovery).toBeDefined();
    });

    it('should not over-credit on recovery', async () => {
      const payment = await createPayment({
        status: 'completed',
        amount: 100,
      });

      // First recovery
      await processWalletCredit(payment);
      // Duplicate recovery attempt
      await processWalletCredit(payment);

      const credits = await WalletCredit.find({ paymentId: payment.paymentId });
      expect(credits.length).toBe(1);
    });
  });

  describe('Gateway Failures', () => {
    it('should handle Razorpay timeout', async () => {
      mockRazorpay.mockTimeout();

      const payment = await createPayment({ status: 'pending' });

      await expect(initiatePayment(payment.paymentId))
        .rejects.toThrow(/timeout/i);
    });

    it('should handle webhook signature validation failure', async () => {
      const invalidSignature = 'invalid-signature';

      await expect(handleWebhook(invalidSignature, payload))
        .rejects.toThrow(/invalid signature/i);
    });

    it('should handle duplicate webhook delivery', async () => {
      const payment = await createPayment({ status: 'processing' });

      await handleWebhookCaptured(payment.paymentId);
      await handleWebhookCaptured(payment.paymentId); // Duplicate

      const updated = await Payment.findById(payment._id);
      expect(updated.status).toBe('completed');
    });
  });
});
```

### 6.2 Order Edge Cases

```typescript
describe('Order Edge Cases', () => {
  it('should handle partial payment failure', async () => {
    const order = await createOrder({
      totals: { total: 100 },
      payment: { status: 'partial' },
    });

    expect(order.status).toBe('pending');
  });

  it('should handle merchant going offline during preparation', async () => {
    const order = await createOrder({ status: 'preparing' });
    await Merchant.updateOne({ _id: order.merchant }, { isOpen: false });

    await expect(processOrderUpdate(order.orderId))
      .resolves.toHaveProperty('warnings');
  });

  it('should handle split delivery (partial items available)', async () => {
    const order = await createOrder({
      items: [
        { itemId: 'item-1', quantity: 2 },
        { itemId: 'item-2', quantity: 1 },
      ],
    });

    const result = await processOrderItems(order.orderId, {
      item-1: { available: 2 },
      item-2: { available: 0 },
    });

    expect(result.partialAvailable).toBe(true);
    expect(result.delayedItems).toContain('item-2');
  });

  it('should handle delivery address change after dispatch', async () => {
    const order = await createOrder({
      status: 'out_for_delivery',
      delivery: { address: 'old-address' },
    });

    await expect(updateDeliveryAddress(order.orderId, 'new-address'))
      .rejects.toThrow(/already dispatched/i);
  });
});
```

### 6.3 Auth Edge Cases

```typescript
describe('Auth Edge Cases', () => {
  it('should handle simultaneous login attempts', async () => {
    const user = await createUser({ password: 'ValidPass123!' });

    await Promise.allSettled([
      request(app).post('/api/auth/login').send({
        email: user.email,
        password: 'ValidPass123!',
      }),
      request(app).post('/api/auth/login').send({
        email: user.email,
        password: 'ValidPass123!',
      }),
    ]);

    // Should have 2 sessions
    const sessions = await Session.find({ userId: user.id });
    expect(sessions.length).toBe(2);
  });

  it('should handle token refresh race condition', async () => {
    const user = await createUser();
    const { refreshToken } = generateTokens(user);

    const results = await Promise.allSettled([
      refreshTokens(refreshToken),
      refreshTokens(refreshToken),
    ]);

    // Both should succeed (idempotent)
    expect(results.every(r => r.status === 'fulfilled')).toBe(true);
  });

  it('should handle Redis unavailable during session validation', async () => {
    mockRedis.status = 'disconnected';

    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    // Should fail gracefully
    expect(res.status).toBe(503);
  });

  it('should handle expired OTP retry limit', async () => {
    // Exceed retry limit
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp: 'wrong' });
    }

    // Lockout period
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9876543210' });

    expect(res.status).toBe(429);
  });
});
```

### 6.4 QR Scan Edge Cases

```typescript
describe('QR Scan Edge Cases', () => {
  it('should handle offline scan (queue for later sync)', async () => {
    const user = await createUser();
    const qrCode = createQRCode({ eventId: 'event-123' });

    mockRedis.status = 'disconnected';

    await expect(recordScanOffline(user.id, qrCode.code))
      .resolves.toHaveProperty('queued', true);
  });

  it('should handle GPS unavailable', async () => {
    const event = await createEvent({ gpsRadius: 100 });

    const result = await validateScan(
      user.id,
      qrCode.code,
      { gpsAvailable: false }
    );

    expect(result.requiresManualApproval).toBe(true);
  });

  it('should handle event capacity reached', async () => {
    const event = await createEvent({
      maxVolunteers: 10,
      confirmedVolunteers: 10,
    });

    await expect(recordCheckIn(user.id, qrCode.code))
      .rejects.toThrow(/capacity reached/i);
  });

  it('should handle scan after event ended', async () => {
    const event = await createEvent({
      status: 'completed',
      endTime: new Date(Date.now() - 3600000),
    });

    await expect(recordCheckIn(user.id, qrCode.code))
      .rejects.toThrow(/event has ended/i);
  });
});
```

---

## 7. Mock Data Generators

### 7.1 User Generator

```typescript
// tests/factories/user.factory.ts
export function createMockUser(overrides = {}) {
  const { Types } = require('mongoose');
  return {
    _id: new Types.ObjectId(),
    email: `user-${Date.now()}@example.com`,
    phone: `9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GQVHKMZN7.Ju', // "password"
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createAdminUser(overrides = {}) {
  return createMockUser({ role: 'admin', ...overrides });
}

export function createMerchantUser(overrides = {}) {
  return createMockUser({ role: 'merchant', ...overrides });
}
```

### 7.2 Payment Generator

```typescript
// tests/factories/payment.factory.ts
export function createMockPayment(overrides = {}) {
  const { Types } = require('mongoose');
  return {
    _id: new Types.ObjectId(),
    paymentId: `pay_${uuidv4()}`,
    orderId: `ord_${uuidv4()}`,
    user: new Types.ObjectId(),
    amount: Math.floor(Math.random() * 10000) + 100, // 100-10100
    currency: 'INR',
    paymentMethod: 'upi',
    purpose: 'order_payment',
    status: 'pending',
    userDetails: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '9876543210',
    },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createCompletedPayment(overrides = {}) {
  return createMockPayment({
    status: 'completed',
    completedAt: new Date(),
    gatewayResponse: {
      gateway: 'razorpay',
      transactionId: `txn_${uuidv4()}`,
      timestamp: new Date(),
    },
    ...overrides,
  });
}
```

### 7.3 Order Generator

```typescript
// tests/factories/order.factory.ts
export function createMockOrder(overrides = {}) {
  const { Types } = require('mongoose');
  return {
    _id: new Types.ObjectId(),
    orderId: `ord_${uuidv4()}`,
    orderNumber: `ORD${Date.now()}`,
    user: new Types.ObjectId(),
    store: new Types.ObjectId(),
    status: 'pending',
    items: [
      {
        itemId: new Types.ObjectId(),
        name: 'Test Item',
        quantity: 1,
        price: 100,
      },
    ],
    totals: {
      subtotal: 100,
      tax: 5,
      discount: 0,
      deliveryFee: 20,
      total: 125,
    },
    payment: {
      method: 'upi',
      status: 'pending',
      amount: 125,
    },
    delivery: {
      type: 'standard',
      address: {
        street: '123 Test St',
        city: 'Bangalore',
        state: 'Karnataka',
        zip: '560001',
      },
    },
    currency: 'INR',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

### 7.4 Karma Profile Generator

```typescript
// tests/factories/karma.factory.ts
export function createMockKarmaProfile(overrides = {}) {
  const { Types } = require('mongoose');
  return {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    lifetimeKarma: 0,
    activeKarma: 0,
    level: 'L1',
    eventsCompleted: 0,
    eventsJoined: 0,
    totalHours: 0,
    trustScore: 0,
    badges: [],
    lastActivityAt: new Date(),
    levelHistory: [],
    conversionHistory: [],
    thisWeekKarmaEarned: 0,
    avgEventDifficulty: 0,
    avgConfidenceScore: 0,
    checkIns: 0,
    approvedCheckIns: 0,
    activityHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createL4KarmaProfile(overrides = {}) {
  return createMockKarmaProfile({
    lifetimeKarma: 10000,
    activeKarma: 6000,
    level: 'L4',
    eventsCompleted: 50,
    trustScore: 95,
    ...overrides,
  });
}
```

### 7.5 Event Generator

```typescript
// tests/factories/event.factory.ts
export function createMockEvent(overrides = {}) {
  const { Types } = require('mongoose');
  return {
    _id: new Types.ObjectId(),
    merchantEventId: `evt_${uuidv4()}`,
    ngoId: new Types.ObjectId(),
    category: 'environment',
    impactUnit: 'trees',
    impactMultiplier: 1.2,
    difficulty: 'easy',
    expectedDurationHours: 4,
    baseKarmaPerHour: 50,
    maxKarmaPerEvent: 400,
    qrCodes: {
      checkIn: `qr_in_${uuidv4()}`,
      checkOut: `qr_out_${uuidv4()}`,
    },
    gpsRadius: 100,
    maxVolunteers: 50,
    confirmedVolunteers: 0,
    status: 'published',
    startTime: new Date(),
    endTime: new Date(Date.now() + 4 * 3600000),
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: 'Test Location',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

---

## 8. Test Utilities

### 8.1 Database Helper

```typescript
// tests/utils/database.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export async function setupTestDatabase() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

export async function teardownTestDatabase() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

export async function clearCollections(...models: mongoose.Model[]) {
  await Promise.all(models.map(model => model.deleteMany({})));
}

export async function seedDatabase(data: Record<string, any[]>) {
  await Promise.all(
    Object.entries(data).map(([model, documents]) =>
      model.create(documents)
    )
  );
}
```

### 8.2 Authentication Helper

```typescript
// tests/utils/auth.ts
import jwt from 'jsonwebtoken';

export function generateTestToken(user: any, type: 'access' | 'refresh' = 'access') {
  const secret = type === 'access'
    ? process.env.JWT_SECRET
    : process.env.JWT_REFRESH_SECRET;

  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    secret!,
    { expiresIn: type === 'access' ? '1h' : '7d' }
  );
}

export function createAuthHeader(user: any) {
  const token = generateTestToken(user);
  return { Authorization: `Bearer ${token}` };
}
```

### 8.3 Redis Helper

```typescript
// tests/utils/redis.ts
const mockRedis = {
  data: new Map(),
  status: 'ready',

  async get(key: string) {
    return this.data.get(key) || null;
  },

  async set(key: string, value: string, ...args: any[]) {
    this.data.set(key, value);
    return 'OK';
  },

  async del(key: string) {
    this.data.delete(key);
    return 1;
  },

  async exists(key: string) {
    return this.data.has(key) ? 1 : 0;
  },

  async expire(key: string, seconds: number) {
    if (this.data.has(key)) return 1;
    return 0;
  },

  async keys(pattern: string) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.data.keys()).filter(k => regex.test(k));
  },

  async flushall() {
    this.data.clear();
  },
};

export { mockRedis };
```

### 8.4 Assertion Helpers

```typescript
// tests/utils/assertions.ts
import 'jest-extended';

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
    };
  },

  toHaveDateCloseTo(received: Date, expected: Date, toleranceMs: number = 1000) {
    const diff = Math.abs(received.getTime() - expected.getTime());
    const pass = diff <= toleranceMs;
    return {
      pass,
      message: () => `expected ${received.toISOString()} to be within ${toleranceMs}ms of ${expected.toISOString()}`,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveDateCloseTo(expected: Date, toleranceMs?: number): R;
    }
  }
}
```

---

## 9. Coverage Targets

### 9.1 Coverage Requirements by Module

| Module | Line Coverage | Branch Coverage | Critical Paths |
|--------|---------------|-----------------|----------------|
| **rez-auth-service** | 90% | 85% | Register, Login, Logout, Token Refresh, OTP |
| **rez-payment-service** | 95% | 90% | All state transitions, Refunds, Webhooks |
| **rez-order-service** | 90% | 85% | Order lifecycle, State machine |
| **rez-wallet-service** | 90% | 85% | Credit/Debit, Balance checks |
| **rez-karma-service** | 95% | 90% | Karma calculation, Level thresholds, Caps |
| **rez-event-platform** | 85% | 80% | QR validation, Check-in/out |
| **Frontend Apps** | 80% | 75% | User interactions, State management |

### 9.2 Critical Path Coverage

Every service must have 100% coverage on:
- All state machine transitions
- Error handling branches
- Authentication/authorization checks
- Input validation
- Idempotency guards

### 9.3 Coverage Enforcement

```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Enforce coverage thresholds
  run: |
    npx jest-coverage-check \
      --line-coverage 90 \
      --branch-coverage 85 \
      --fail-on-miss
```

---

## 10. E2E Test Scenarios

### 10.1 Payment E2E Scenarios

```typescript
// e2e/payment-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Payment Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsTestUser(page);
  });

  test('complete payment flow - happy path', async ({ page }) => {
    // Navigate to store
    await page.goto('/store/test-merchant');
    await expect(page.getByText('Test Merchant')).toBeVisible();

    // Add items to cart
    await page.getByRole('button', { name: 'Add Espresso' }).click();
    await expect(page.locator('.cart-badge')).toHaveText('1');

    // Proceed to checkout
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByText('Total: ₹150').isVisible();

    // Select payment method
    await page.getByLabel('UPI').check();

    // Initiate payment
    await page.getByRole('button', { name: 'Pay ₹150' }).click();

    // Complete UPI auth (mock)
    await page.getByText('Payment Processing').waitFor({ state: 'visible' });

    // Verify success
    await expect(page.getByText('Payment Successful')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Order #ORD-')).toBeVisible();
  });

  test('payment failure handling', async ({ page }) => {
    await page.goto('/store/test-merchant');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();

    // Simulate payment failure
    await page.getByLabel('UPI').check();
    await page.getByRole('button', { name: 'Pay' }).click();

    // Mock UPI app unavailable
    await page.evaluate(() => {
      window.simulateUPIFailure();
    });

    await expect(page.getByText('Payment Failed')).toBeVisible();
    await expect(page.getByText('Please try again')).toBeVisible();

    // Should allow retry
    await page.getByRole('button', { name: 'Try Again' }).isVisible();
  });

  test('wallet balance deduction on payment', async ({ page }) => {
    // Get initial balance
    await page.goto('/wallet');
    const initialBalance = await page.locator('[data-testid="coin-balance"]').textContent();

    // Make payment using coins
    await page.goto('/store/test-merchant');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();

    // Select coin payment
    await page.getByLabel('Use ReZ Coins').check();
    await page.getByRole('button', { name: 'Pay with Coins' }).click();

    // Verify balance deducted
    await page.goto('/wallet');
    const newBalance = await page.locator('[data-testid="coin-balance"]').textContent();
    expect(parseInt(newBalance!)).toBeLessThan(parseInt(initialBalance!));
  });
});
```

### 10.2 Order E2E Scenarios

```typescript
// e2e/order-tracking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order Tracking E2E', () => {
  test('order lifecycle - merchant prepares and delivers', async ({ page }) => {
    // Create order
    const order = await createTestOrder();

    // Consumer: view order in app
    await loginAsConsumer(page);
    await page.goto(`/orders/${order.orderId}`);
    await expect(page.getByText('Order Placed')).toBeVisible();

    // Merchant: confirm order
    await loginAsMerchant(page, order.storeId);
    await page.goto(`/merchant/orders/${order.orderId}`);
    await page.getByRole('button', { name: 'Accept Order' }).click();
    await expect(page.getByText('Preparing')).toBeVisible();

    // Merchant: mark ready
    await page.getByRole('button', { name: 'Mark Ready' }).click();
    await expect(page.getByText('Ready for Pickup')).toBeVisible();

    // Consumer: see updated status
    await loginAsConsumer(page);
    await page.goto(`/orders/${order.orderId}`);
    await expect(page.getByText('Ready for Pickup')).toBeVisible();

    // Mark delivered
    await page.getByRole('button', { name: 'Confirm Pickup' }).click();
    await expect(page.getByText('Delivered')).toBeVisible();
  });

  test('order cancellation flow', async ({ page }) => {
    const order = await createTestOrder({ status: 'preparing' });

    await loginAsConsumer(page);
    await page.goto(`/orders/${order.orderId}`);
    await page.getByRole('button', { name: 'Cancel Order' }).click();

    // Confirm cancellation
    await page.getByText('Cancellation Reason').waitFor({ state: 'visible' });
    await page.locator('select').selectOption('Changed my mind');
    await page.getByRole('button', { name: 'Confirm Cancellation' }).click();

    await expect(page.getByText('Cancelling')).toBeVisible();
    await expect(page.getByText('Order Cancelled')).toBeVisible({ timeout: 10000 });
  });
});
```

### 10.3 Auth E2E Scenarios

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('register -> login -> logout flow', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.getByLabel('Email').fill(`test${Date.now()}@example.com`);
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByLabel('Confirm Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Account Created')).toBeVisible();
    await expect(page.getByText('Welcome')).toBeVisible();

    // Verify logged in state
    await expect(page.getByText('My Account')).toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByText('Login')).toBeVisible();

    // Login with new credentials
    await page.getByLabel('Email').fill(`test${Date.now()}@example.com`);
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('OTP verification flow', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Phone').fill('9876543210');
    await page.getByRole('button', { name: 'Send OTP' }).click();

    // Enter OTP
    await page.getByLabel('Enter OTP').waitFor({ state: 'visible' });
    await page.locator('.otp-input').first().fill('1');
    await page.locator('.otp-input').nth(1).fill('2');
    await page.locator('.otp-input').nth(2).fill('3');
    await page.locator('.otp-input').nth(3).fill('4');
    await page.locator('.otp-input').nth(4).fill('5');
    await page.locator('.otp-input').nth(5).fill('6');

    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('session persistence across page refresh', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/account');

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page.getByText('My Account')).toBeVisible();
  });
});
```

### 10.4 QR Scan E2E Scenarios

```typescript
// e2e/qr-scan.spec.ts
import { test, expect } from '@playwright/test';

test.describe('QR Scan E2E', () => {
  test('event check-in and check-out flow', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);

    await loginAsTestUser(page);
    await page.goto('/events/test-event');

    // Open QR scanner
    await page.getByRole('button', { name: 'Scan QR' }).click();

    // Simulate QR code detection (mock camera feed)
    await page.evaluate(() => {
      // In real test, would use Playwright camera mocking
      window.simulateQRDetection('event:test-event:checkin');
    });

    // Should detect check-in QR
    await expect(page.getByText('Check In Successful')).toBeVisible();
    await expect(page.getByText('Volunteering Started')).toBeVisible();

    // Complete event - scan check-out
    await page.getByRole('button', { name: 'Scan Check-Out' }).click();
    await page.evaluate(() => {
      window.simulateQRDetection('event:test-event:checkout');
    });

    await expect(page.getByText('Check Out Successful')).toBeVisible();
    await expect(page.getByText(/You earned \d+ karma/)).toBeVisible();
  });

  test('wallet scan-pay flow', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/scan');

    // Scan merchant QR
    await page.evaluate(() => {
      window.simulateQRDetection('merchant:test-merchant:pay');
    });

    await expect(page.getByText('Pay to Test Merchant')).toBeVisible();

    // Enter amount
    await page.getByLabel('Amount').fill('150');
    await page.getByRole('button', { name: 'Pay ₹150' }).click();

    // Confirm payment
    await expect(page.getByText('Payment Successful')).toBeVisible();
  });
});
```

---

## Appendix: Running Tests

### Local Development
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern="payment-flow"

# Run in watch mode
npm run test:watch
```

### E2E Tests
```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run specific E2E test
npx playwright test e2e/auth-flow.spec.ts

# UI mode for debugging
npx playwright test --ui
```

### CI/CD
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
```

---

*Document Version: 1.0 | Last Updated: 2026-05-05*
