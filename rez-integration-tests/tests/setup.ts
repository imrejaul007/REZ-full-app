// Test environment setup
// This file is run before all tests

import { TEST_TIMEOUT } from './shared/utils';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = String(process.env.JEST_WORKER_ID || 1);

// Global test timeout
jest.setTimeout(TEST_TIMEOUT);

// Global beforeAll hook
beforeAll(async () => {
  console.log('Starting REZ Integration Tests...');
  console.log(`Node Environment: ${process.env.NODE_ENV}`);
  console.log(`Jest Worker: ${process.env.JEST_WORKER_ID}`);
});

// Global afterAll hook
afterAll(async () => {
  console.log('Completed REZ Integration Tests');
});

// Mock external services if needed
// Uncomment below to mock external HTTP calls
// jest.mock('node-fetch', () => jest.fn());

// Increase console log timeout for debugging
if (process.env.DEBUG) {
  jest.spyOn(console, 'log').mockImplementation((...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]`, ...args);
  });
}

// Suppress console.error in tests unless DEBUG is set
if (!process.env.DEBUG) {
  jest.spyOn(console, 'error').mockImplementation(() => {});
}

// Global test counters
let testCounter = { passed: 0, failed: 0, skipped: 0 };

// Track test results
afterEach(() => {
  // This runs after each test
});

// Track overall results
afterAll(() => {
  console.log('\n--- Test Summary ---');
  console.log(`Passed: ${testCounter.passed}`);
  console.log(`Failed: ${testCounter.failed}`);
  console.log(`Skipped: ${testCounter.skipped}`);
});

// Add custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toContainObject(received: unknown[], expected: Record<string, unknown>) {
    const subset = expected;
    const found = received.some((item) => {
      return Object.keys(subset).every((key) => item[key] === subset[key]);
    });
    return {
      message: () =>
        `expected array to contain object ${JSON.stringify(expected)}`,
      pass: found,
    };
  },
  toHaveStatus(received: { status: number }, expected: number) {
    const pass = received.status === expected;
    return {
      message: () => `expected status ${expected}, got ${received.status}`,
      pass,
    };
  },
  toMatchResponseSchema(
    received: Record<string, unknown>,
    schema: Record<string, unknown>
  ) {
    const keys = Object.keys(schema);
    const missingKeys = keys.filter((key) => !(key in received));
    const pass = missingKeys.length === 0;
    return {
      message: () =>
        `response missing keys: ${missingKeys.join(', ')}`,
      pass,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toContainObject(expected: Record<string, unknown>): R;
      toHaveStatus(expected: number): R;
      toMatchResponseSchema(schema: Record<string, unknown>): R;
    }
  }
}

// Clean up after each test file
afterEach(() => {
  jest.clearAllMocks();
});

// Export setup configuration
export const testConfig = {
  timeout: TEST_TIMEOUT,
  retries: process.env.CI ? 2 : 0,
  parallel: !process.env.CI,
  verbose: true,
};

export default testConfig;
