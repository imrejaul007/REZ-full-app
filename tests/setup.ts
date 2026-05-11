/**
 * Jest test setup file
 * Global mocks and configuration for all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.JWT_ADMIN_SECRET = 'test-jwt-admin-secret-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing';
process.env.RAZORPAY_KEY_ID = 'test_razorpay_key_id';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_key_secret';
process.env.WALLET_SERVICE_URL = 'http://localhost:4001';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-service-token';

// Mock console.error to reduce noise in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Allow certain error patterns through
    const message = args[0]?.toString() || '';
    if (
      message.includes('Warning:') ||
      message.includes('Jest did not exit') ||
      message.includes('UnhandledPromiseRejection')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Increase timeout for slow tests
jest.setTimeout(30000);

// Global afterEach to clean up
afterEach(() => {
  jest.clearAllMocks();
});
