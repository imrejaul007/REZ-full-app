/**
 * Jest Configuration Setup for Integration Tests
 * Provides common mocks, utilities, and test infrastructure for all services
 */

// Environment setup
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = String(process.env.JEST_WORKER_ID || 1);

// Test timeouts
const DEFAULT_TIMEOUT = 10000;
const LONG_TIMEOUT = 30000;

// Mock configuration
const mockConfig = {
  database: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    name: process.env.TEST_DB_NAME || 'test_db',
    user: process.env.TEST_DB_USER || 'test_user',
    password: process.env.TEST_DB_PASSWORD || 'test_password',
  },
  redis: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
  },
  kafka: {
    brokers: (process.env.TEST_KAFKA_BROKERS || 'localhost:9092').split(','),
  },
  api: {
    baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
    timeout: 5000,
  },
};

// Database connection mock
const createMockDbConnection = () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: jest.fn(),
  }),
  end: jest.fn().mockResolvedValue(undefined),
});

// Redis client mock
const createMockRedisClient = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  hget: jest.fn().mockResolvedValue(null),
  hset: jest.fn().mockResolvedValue(1),
  hgetall: jest.fn().mockResolvedValue({}),
  lpush: jest.fn().mockResolvedValue(1),
  rpop: jest.fn().mockResolvedValue(null),
  incr: jest.fn().mockResolvedValue(1),
  decr: jest.fn().mockResolvedValue(0),
  quit: jest.fn().mockResolvedValue('OK'),
});

// HTTP client mock
const createMockHttpClient = () => ({
  get: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  post: jest.fn().mockResolvedValue({ data: {}, status: 201 }),
  put: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  patch: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
  delete: jest.fn().mockResolvedValue({ data: {}, status: 204 }),
});

// Event emitter mock for Kafka/messaging
const createMockEventEmitter = () => {
  const listeners = new Map();

  return {
    emit: jest.fn((event: string, data: unknown) => {
      const eventListeners = listeners.get(event) || [];
      eventListeners.forEach((listener: (data: unknown) => void) => listener(data));
      return true;
    }),
    on: jest.fn((event: string, listener: (data: unknown) => void) => {
      const eventListeners = listeners.get(event) || [];
      eventListeners.push(listener);
      listeners.set(event, eventListeners);
    }),
    off: jest.fn((event: string, listener: (data: unknown) => void) => {
      const eventListeners = listeners.get(event) || [];
      const index = eventListeners.indexOf(listener);
      if (index > -1) eventListeners.splice(index, 1);
    }),
    removeAllListeners: jest.fn((event?: string) => {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    }),
  };
};

// Logger mock
const createMockLogger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

// Helper functions
const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async <T>(
  fn: () => Promise<T>,
  options: { retries: number; delay: number } = { retries: 3, delay: 1000 }
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < options.retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < options.retries - 1) {
        await waitFor(options.delay);
      }
    }
  }

  throw lastError!;
};

const generateTestId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createTimestamp = (daysAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Cleanup utilities
const testCleanup = async () => {
  // Add service-specific cleanup here
  jest.clearAllMocks();
};

// Export all utilities and mocks
export {
  DEFAULT_TIMEOUT,
  LONG_TIMEOUT,
  mockConfig,
  createMockDbConnection,
  createMockRedisClient,
  createMockHttpClient,
  createMockEventEmitter,
  createMockLogger,
  waitFor,
  retry,
  generateTestId,
  createTimestamp,
  testCleanup,
};

// Extend Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(received: number, floor: number, ceiling: number): R;
      toHaveBeenCalledAfter(mockFn: jest.Mock): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
    };
  },
  toHaveBeenCalledAfter(mockFn: jest.Mock) {
    const mockCalls = (expect.getState().current as { mock?: { calls: Array<[unknown]> } }).mock?.calls || [];
    const otherCalls = mockFn.mock?.calls || [];
    const pass = mockCalls.length > 0 && otherCalls.length > 0 && mockCalls.length > otherCalls.length;
    return {
      pass,
      message: () => `expected ${mockFn.getMockName()} to have been called after ${mockFn.getMockName()}`,
    };
  },
});

// Global test hooks
beforeAll(async () => {
  // Setup test environment
});

afterAll(async () => {
  // Cleanup test environment
});

afterEach(async () => {
  // Clear all mocks between tests
  jest.clearAllMocks();
});
