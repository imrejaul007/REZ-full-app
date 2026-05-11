# ReZ Full App - Testing Guide

A comprehensive testing strategy covering unit, integration, E2E, API, performance, and security testing.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Unit Testing](#1-unit-testing)
3. [Integration Testing](#2-integration-testing)
4. [End-to-End Testing](#3-end-to-end-testing)
5. [API Testing](#4-api-testing)
6. [Performance Testing](#5-performance-testing)
7. [Security Testing](#6-security-testing)
8. [CI/CD Integration](#7-cicd-integration)
9. [Test Coverage Targets](#8-test-coverage-targets)

---

## Testing Philosophy

### Core Principles

- **Test Pyramid**: Favor many fast unit tests at the base, fewer integration tests in the middle, and minimal E2E tests at the top
- **Shift Left**: Move testing earlier in the development lifecycle
- **Testing Types Matrix**:

| Layer | Speed | Scope | Frequency |
|-------|-------|-------|-----------|
| Unit | < 10ms | Single function/component | Every commit |
| Integration | < 500ms | Service boundaries | Every PR |
| E2E | < 5min | Full user flow | Pre-release |
| API | < 1s | Endpoint contracts | Every PR |
| Performance | < 30min | Load characteristics | Nightly |
| Security | < 15min | Vulnerability scan | Weekly |

---

## 1. Unit Testing

### Framework Recommendations

```typescript
// Node.js/TypeScript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
    globals: true,
    testTimeout: 10000,
  },
});
```

### Unit Testing Standards

**File Naming Convention**:
```
src/
  services/
    userService.ts
    userService.test.ts    // Co-located tests
  utils/
    validator.ts
    validator.spec.ts      // Alternative naming
```

**Test Structure (Arrange-Act-Assert)**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './userService';
import { UserRepository } from '../repositories/userRepository';

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: UserRepository;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as UserRepository;
    userService = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };
      const expectedUser = { id: '1', ...userData, createdAt: new Date() };
      mockRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidData = { email: 'invalid', name: 'Test' };

      await expect(userService.createUser(invalidData))
        .rejects.toThrow('Invalid email format');
    });

    it('should hash password before storing', async () => {
      const dataWithPassword = {
        email: 'test@example.com',
        name: 'Test',
        password: 'plaintext123',
      };

      await userService.createUser(dataWithPassword);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.not.stringMatching('plaintext123'),
        })
      );
    });
  });
});
```

### Mocking Best Practices

```typescript
// Use factory functions for consistent mocks
const createMockUserRepository = (overrides?: Partial<UserRepository>): UserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn(),
  ...overrides,
});

// Mock timers for async tests
describe('DebounceService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce rapid calls', async () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

### Unit Test Checklist

- [ ] Test happy path
- [ ] Test edge cases (empty, null, undefined, zero)
- [ ] Test boundary conditions
- [ ] Test error handling
- [ ] Test async operations with proper awaits
- [ ] Mock external dependencies
- [ ] Keep tests isolated (no shared state)
- [ ] Use descriptive test names (should-when-then pattern)

---

## 2. Integration Testing

### Service Integration Testing

```typescript
// tests/integration/userService.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { UserService } from '../../src/services/userService';
import { MongoUserRepository } from '../../src/repositories/mongoUserRepository';

describe('UserService Integration', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let userService: UserService;
  let userRepository: MongoUserRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test');
    userRepository = new MongoUserRepository(db);
    userService = new UserService(userRepository);
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await db.collection('users').deleteMany({});
  });

  describe('full user lifecycle', () => {
    it('should create, retrieve, update, and delete user', async () => {
      // Create
      const created = await userService.createUser({
        email: 'lifecycle@test.com',
        name: 'Lifecycle User',
      });
      expect(created.id).toBeDefined();

      // Retrieve
      const retrieved = await userService.getUserById(created.id);
      expect(retrieved.email).toBe('lifecycle@test.com');

      // Update
      const updated = await userService.updateUser(created.id, {
        name: 'Updated Name',
      });
      expect(updated.name).toBe('Updated Name');

      // Delete
      await userService.deleteUser(created.id);
      await expect(userService.getUserById(created.id))
        .rejects.toThrow('User not found');
    });
  });
});
```

### API Route Integration Testing

```typescript
// tests/integration/routes/user.routes.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app';
import { createTestDatabase, tearDown } from '../helpers/database';

describe('User Routes Integration', () => {
  const app = createApp();
  const request = supertest(app);
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
  });

  afterAll(async () => {
    await tearDown(db);
  });

  describe('POST /api/users', () => {
    it('should create user and return 201', async () => {
      const response = await request
        .post('/api/users')
        .send({
          email: 'new@example.com',
          name: 'New User',
          password: 'SecurePass123!',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should return 400 for duplicate email', async () => {
      await request.post('/api/users').send({
        email: 'duplicate@example.com',
        name: 'First',
      });

      const response = await request
        .post('/api/users')
        .send({
          email: 'duplicate@example.com',
          name: 'Second',
        })
        .expect(400);

      expect(response.body.code).toBe('DUPLICATE_EMAIL');
    });
  });
});
```

### Database Integration Patterns

```typescript
// tests/helpers/database.ts
import { MongoMemoryServer } from 'mongodb-memory-server';

export interface TestDatabase {
  uri: string;
  connection: MongoClient;
  cleanup: () => Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const mongoServer = await MongoMemoryServer.create();
  const client = new MongoClient(mongoServer.getUri());

  return {
    uri: mongoServer.getUri(),
    connection: client,
    cleanup: async () => {
      await client.close();
      await mongoServer.stop();
    },
  };
}
```

### Integration Test Checklist

- [ ] Use real database (in-memory or containerized)
- [ ] Clean state between tests (beforeEach cleanup)
- [ ] Test data flow between services
- [ ] Verify database constraints and indexes
- [ ] Test transaction handling
- [ ] Verify error propagation across layers

---

## 3. End-to-End Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### E2E Test Structure

```typescript
// tests/e2e/user/user.flows.spec.ts
import { test, expect } from '@playwright/test';
import { generateTestUser } from '../../helpers/factories';
import { UserPage } from '../../pages/UserPage';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

test.describe('User Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('user can register and login', async ({ page }) => {
    const userPage = new UserPage(page);
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Register
    const testUser = generateTestUser();
    await userPage.register(testUser);
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await dashboardPage.logout();
    await expect(page).toHaveURL('/login');

    // Login with same credentials
    await loginPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL('/dashboard');
    await expect(dashboardPage.welcomeMessage).toContainText(testUser.name);
  });

  test('shows validation errors for invalid input', async ({ page }) => {
    const userPage = new UserPage(page);

    await page.goto('/register');
    await userPage.submitForm();

    await expect(userPage.emailError).toBeVisible();
    await expect(userPage.emailError).toContainText('Email is required');
  });
});
```

### Page Object Model

```typescript
// tests/e2e/pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  protected async waitForUrl(url: string | RegExp): Promise<void> {
    await this.page.waitForURL(url, { timeout: 10000 });
  }

  protected async waitForElement(selector: string): Promise<Locator> {
    return this.page.locator(selector).first();
  }
}

// tests/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[data-testid="login-email"]');
    this.passwordInput = page.locator('[data-testid="login-password"]');
    this.submitButton = page.locator('[data-testid="login-submit"]');
    this.errorMessage = page.locator('[data-testid="login-error"]');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Critical User Journey Tests

| Priority | Journey | Key Validations |
|----------|---------|-----------------|
| P0 | Sign Up -> Login -> Core Action -> Logout | Full auth flow |
| P0 | Payment Checkout | Stripe integration |
| P1 | Password Reset | Email delivery, token validity |
| P1 | Email Verification | Link access, state update |
| P2 | Social Login (Google) | OAuth callback |
| P2 | Two-Factor Auth | TOTP verification |

### E2E Test Checklist

- [ ] Run on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test responsive layouts (mobile, tablet, desktop)
- [ ] Handle authentication state properly
- [ ] Use test data factories (not hardcoded values)
- [ ] Implement proper wait strategies (not just sleep)
- [ ] Clean up test data after tests
- [ ] Record videos/screenshots on failure
- [ ] Parallelize tests when possible

---

## 4. API Testing

### REST API Testing

```typescript
// tests/api/users.api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp } from '../helpers/app';
import { createTestClient } from '../helpers/client';

describe('Users API', () => {
  const app = createTestApp();
  const client = createTestClient(app);

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const user = await client.users.create({
        email: 'api@example.com',
        name: 'API User',
      });

      const response = await client.get(`/api/users/${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.id,
        email: 'api@example.com',
      });
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await client.get('/api/users/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('POST /api/users', () => {
    it('should validate required fields', async () => {
      const response = await client.post('/api/users', {});

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: 'email' })
      );
    });

    it('should validate email format', async () => {
      const response = await client.post('/api/users', {
        email: 'not-an-email',
        name: 'Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('valid email'),
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        await client.get('/api/users');
      }

      // Next request should be rate limited
      const response = await client.get('/api/users');
      expect(response.status).toBe(429);
      expect(response.headers['retry-after']).toBeDefined();
    });
  });
});
```

### GraphQL API Testing

```typescript
// tests/api/graphql.test.ts
import { describe, it, expect } from 'vitest';
import { createTestClient } from '../helpers/graphql-client';

describe('GraphQL API', () => {
  const client = createTestClient();

  describe('Users Query', () => {
    it('should fetch user with all fields', async () => {
      const response = await client.query(`
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            email
            name
            createdAt
            profile {
              avatar
              bio
            }
          }
        }
      `, { variables: { id: '123' } });

      expect(response.errors).toBeUndefined();
      expect(response.data.user).toMatchObject({
        id: '123',
        email: expect.stringMatching(/@/),
      });
    });

    it('should handle mutations', async () => {
      const response = await client.mutation(`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            email
          }
        }
      `, {
        variables: {
          input: {
            email: 'graphql@example.com',
            name: 'GraphQL User',
          },
        },
      });

      expect(response.data.createUser.id).toBeDefined();
    });
  });
});
```

### API Contract Testing (Pact)

```typescript
// tests/contracts/user-consumer.pact.spec.ts
import { Pact } from '@pact-foundation/pact';
import { describe, it, expect } from 'vitest';

const provider = new Pact({
  consumer: 'web-app',
  provider: 'user-service',
});

describe('User Service Contract', () => {
  afterAll(() => provider.finalize());

  describe('GET /users/:id', () => {
    it('returns user with required fields', async () => {
      await provider.addInteraction({
        state: 'user with id 123 exists',
        uponReceiving: 'a request for user 123',
        withRequest: {
          method: 'GET',
          path: '/users/123',
          headers: { Accept: 'application/json' },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: 123,
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      });

      const response = await fetch('http://localhost:8080/users/123', {
        headers: { Accept: 'application/json' },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchSnapshot();
    });
  });
});
```

### API Test Checklist

- [ ] Test all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [ ] Validate request headers and body
- [ ] Verify response status codes
- [ ] Check response body structure and types
- [ ] Test authentication/authorization
- [ ] Test rate limiting
- [ ] Test pagination for list endpoints
- [ ] Test sorting and filtering
- [ ] Verify error response formats
- [ ] Test concurrent requests

---

## 5. Performance Testing

### Load Testing with k6

```javascript
// tests/performance/load.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Stress
    { duration: '5m', target: 200 },   // Steady state
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.05'],             // Custom metric < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.example.com';

export default function () {
  // Simulate realistic user behavior
  const userId = `user-${Math.floor(Math.random() * 10000)}`;

  // API endpoint test
  const apiResponse = http.get(`${BASE_URL}/api/users/${userId}`, {
    tags: { name: 'GetUser' },
  });

  responseTime.add(apiResponse.timings.duration);
  errorRate.add(apiResponse.status !== 200);

  check(apiResponse, {
    'status is 200': (r) => r.status === 200,
    'response has body': (r) => r.body.length > 0,
  });

  // Simulate user think time
  sleep(Math.random() * 3 + 1);
}
```

### Stress Testing Scenarios

```javascript
// tests/performance/stress-scenarios.js
export const stressScenarios = {
  // Sudden traffic spike
  trafficSpike: {
    stages: [{ duration: '30s', target: 1000 }],
    expected: 'Should handle 10x normal traffic',
  },

  // Sustained load
  sustainedLoad: {
    stages: [{ duration: '30m', target: 500 }],
    expected: 'Stable performance over extended period',
  },

  // Database connection exhaustion
  dbConnectionPool: {
    stages: [{ duration: '5m', target: 100 }],
    expected: 'No connection pool exhaustion',
  },

  // Memory leak detection
  memoryLeak: {
    stages: [{ duration: '1h', target: 100 }],
    expected: 'Memory usage stable, no leaks',
  },
};
```

### Lighthouse CI Integration

```yaml
# .lighthouserc.yml
ci:
  collect:
    url:
      - http://localhost:3000/
      - http://localhost:3000/dashboard
      - http://localhost:3000/products
    numberOfRuns: 3
    startServerCommand: npm run start
    startServerReadyPattern: "Server listening"
  assert:
    assertions:
      categories:performance:
        - minScore: 0.9
      categories:accessibility:
        - minScore: 0.9
      categories:best-practices:
        - minScore: 0.85
      categories:seo:
        - minScore: 0.9
      "first-contentful-paint":
        - maxSaveData: 1000
      "largest-contentful-paint":
        - maxSaveData: 2500
      "cumulative-layout-shift":
        - maxSaveData: 0.1
```

### Performance Test Checklist

- [ ] Define clear SLIs/SLOs before testing
- [ ] Test realistic user scenarios, not just simple endpoints
- [ ] Include database queries in load tests
- [ ] Test with production-like data volumes
- [ ] Monitor server resources (CPU, memory, disk I/O)
- [ ] Test degraded modes (slow database, network latency)
- [ ] Set up alerting for performance regressions
- [ ] Run tests regularly (nightly builds)

---

## 6. Security Testing

### OWASP ZAP Integration

```yaml
# zap-config.yaml
api:
  url: 'http://localhost:3000'
  inc_subdirs: true
context:
  name: 'ReZ App Context'
  include:
    - 'http://localhost:3000/.*'
  exclude:
    - 'http://localhost:3000/logout'
authentication:
  method: 'json'
  parameters:
    loginUrl: 'http://localhost:3000/api/auth/login'
    loginBody: '{"email":"test@example.com","password":"testpassword123"}'
spider:
  maxDepth: 5
  threadCount: 10
activeScan:
  scanOnlyInScope: true
  rules:
    - 'api_s瓷_11'
    - 'api_s瓷_40012'
    - 'api_s瓷_40014'
report:
  format: 'json'
  output: 'zap-report.json'
```

### Security Test Suite

```typescript
// tests/security/auth.security.test.ts
import { describe, it, expect } from 'vitest';
import { createTestClient } from '../helpers/client';

describe('Authentication Security Tests', () => {
  const client = createTestClient();

  describe('Password Security', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'password',
        '12345678',
        'qwerty',
        'aaaaaaaa',
      ];

      for (const password of weakPasswords) {
        const response = await client.post('/api/users', {
          email: 'test@example.com',
          password,
        });

        expect(response.status).toBe(400);
        expect(response.body.errors).toContainEqual(
          expect.objectContaining({
            message: expect.stringContaining('strong'),
          })
        );
      }
    });

    it('should hash passwords, never store plaintext', async () => {
      const response = await client.post('/api/users', {
        email: 'secure@example.com',
        password: 'SecurePass123!',
      });

      // Verify password is not in any response
      const allResponses = await client.get('/api/users');
      expect(allResponses.body).not.toContain('SecurePass123!');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should handle malicious input safely', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        '<script>alert("xss")</script>',
        '{{constructor.constructor("alert(1)")()}}',
      ];

      for (const input of maliciousInputs) {
        const response = await client.get(`/api/users?search=${encodeURIComponent(input)}`);

        // Should not crash and should return empty or error, not data
        expect([200, 400, 404]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should prevent brute force attacks on login', async () => {
      const user = await client.users.create({
        email: 'bruteforce@example.com',
        password: 'Password123!',
      });

      // Attempt many failed logins
      for (let i = 0; i < 20; i++) {
        await client.post('/api/auth/login', {
          email: user.email,
          password: 'wrong-password',
        });
      }

      // Next attempt should be blocked
      const response = await client.post('/api/auth/login', {
        email: user.email,
        password: 'wrong-password',
      });

      expect(response.status).toBe(429);
      expect(response.headers['retry-after']).toBeDefined();
    });
  });

  describe('CORS Configuration', () => {
    it('should not allow arbitrary origins', async () => {
      const response = await client.get('/api/users', {
        headers: {
          origin: 'https://malicious-site.com',
        },
      });

      const allowedOrigins = response.headers['access-control-allow-origin'];
      expect(allowedOrigins).not.toBe('*');
      expect(allowedOrigins).not.toBe('https://malicious-site.com');
    });
  });

  describe('JWT Security', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.test';

      const response = await client.get('/api/users', {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(response.status).toBe(401);
    });

    it('should reject tokens with invalid signature', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjN9.wrong_signature';

      const response = await client.get('/api/users', {
        headers: {
          Authorization: `Bearer ${tamperedToken}`,
        },
      });

      expect(response.status).toBe(401);
    });
  });
});
```

### Content Security Policy Testing

```typescript
// tests/security/csp.test.ts
import { describe, it, expect } from 'vitest';
import { createTestClient } from '../helpers/client';

describe('Content Security Policy', () => {
  const client = createTestClient();

  it('should have CSP headers configured', async () => {
    const response = await client.get('/');

    expect(response.headers['content-security-policy']).toBeDefined();
  });

  it('should prevent inline script execution', async () => {
    // Verify CSP prevents inline scripts
    const response = await client.get('/api/test/xss', {
      headers: {
        'Content-Type': 'text/html',
      },
    });

    // XSS payload should be escaped, not executed
    expect(response.body).not.toContain('<script>alert');
  });
});
```

### Security Test Checklist

- [ ] Test for OWASP Top 10 vulnerabilities
- [ ] Verify all inputs are sanitized
- [ ] Check authentication mechanisms
- [ ] Test authorization boundaries
- [ ] Verify sensitive data encryption
- [ ] Test for information disclosure
- [ ] Check security headers configuration
- [ ] Test for business logic vulnerabilities
- [ ] Verify logging of security events
- [ ] Test rate limiting and throttling

---

## 7. CI/CD Integration

### GitHub Actions Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Fast unit tests - run on every push
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  # Integration tests - run on PR
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run integration tests
        run: npm run test:integration

  # E2E tests - run before merge to main
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # Security scan - weekly or on PR
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # Performance tests - nightly
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4

      - name: Run k6 load test
        uses: grafana/k6-action@v0.2
        with:
          filename: tests/performance/load.test.js
          env: |
            BASE_URL=${{ vars.STAGING_URL }}
```

### Pre-commit Hooks

```yaml
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint
npm run lint

# Run fast unit tests for changed files
npm run test:unit -- --changed

# Check for secrets
git diff --staged | detect-secrets
```

---

## 8. Test Coverage Targets

### Coverage Metrics

| Type | Line Coverage | Branch Coverage | Function Coverage |
|------|---------------|-----------------|-------------------|
| Unit Tests | 80% | 75% | 85% |
| Integration Tests | 60% | 50% | 70% |
| E2E Tests | N/A (UI coverage) | N/A | Critical paths |
| API Tests | 90% | 85% | 95% |

### Coverage Enforcement

```json
// package.json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:coverage:check": "vitest run --coverage && coverage-check"
  },
  "coverage-check": {
    "statements": 80,
    "branches": 75,
    "functions": 85,
    "lines": 80
  }
}
```

### Critical Path Coverage

These business-critical paths must have 100% test coverage:

1. User registration and authentication
2. Payment processing
3. Data export functionality
4. Access control enforcement
5. Password reset flow
6. Critical API endpoints

---

## Test Execution Reference

```bash
# Run all tests
npm test

# Run by type
npm run test:unit          # Unit tests only
npm run test:integration    # Integration tests
npm run test:e2e           # E2E tests
npm run test:api            # API tests
npm run test:security       # Security tests

# With coverage
npm run test:unit -- --coverage

# Watch mode
npm run test:unit -- --watch

# Specific file
npm run test:unit -- src/services/userService.test.ts

# E2E with UI
npm run test:e2e -- --ui

# E2E headed (see browser)
npm run test:e2e -- --headed

# Debug specific test
npm run test:unit -- --testNamePattern="should create user"
```

---

## Appendix: Testing Utilities

### Test Data Factories

```typescript
// tests/helpers/factories.ts
import { faker } from '@faker-js/faker';

export const generateTestUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  password: faker.internet.password({ length: 12 }),
  createdAt: faker.date.past(),
  ...overrides,
});

export const generateTestProduct = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  price: parseFloat(faker.commerce.price()),
  category: faker.commerce.department(),
  inStock: faker.datatype.boolean(),
  ...overrides,
});
```

### Test Timeout Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    timeout: {
      unit: 5000,        // 5 seconds
      integration: 30000, // 30 seconds
      e2e: 120000,       // 2 minutes
    },
  },
});
```

---

## Quick Reference

| Category | When to Run | Duration | Blocker? |
|----------|-------------|----------|----------|
| Unit | Every commit | < 1 min | Yes |
| Integration | Every PR | < 5 min | Yes |
| API Contract | Every PR | < 2 min | Yes |
| E2E | Pre-merge | < 15 min | Yes |
| Security | Weekly + PR | < 10 min | No |
| Performance | Nightly | < 30 min | No |
