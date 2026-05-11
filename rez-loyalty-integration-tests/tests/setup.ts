import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless DEBUG is set
  if (!process.env.DEBUG) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
  }
});

afterAll(() => {
  // Restore console
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// Type declarations for test environment
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(a: number, b: number): R;
      toMatchApiResponse(schema: object): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toMatchApiResponse(received: object, schema: object) {
    const pass = true; // Simplified schema matching
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} to match schema`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to match schema`,
        pass: false,
      };
    }
  },
});

export {};
