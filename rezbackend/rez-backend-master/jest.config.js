module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/__tests__/**',
    '!src/server.ts',
    '!src/scripts/**',
    '!src/config/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    // Prevent ioredis from opening real connections during tests.
    // BullMQ workers/queues are mocked per-test; this stops the shared
    // bullmq-connection module from spawning a real Redis client at module load.
    '^ioredis$': '<rootDir>/src/__tests__/mocks/ioredis.ts',
    // Mock uuid to avoid ESM issues
    '^uuid$': '<rootDir>/src/__tests__/mocks/uuid.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 60000,
  verbose: true,
  forceExit: true,
  // Run tests serially (1 worker). With 60+ suites each spinning up a
  // MongoMemoryServer instance, parallel workers exhaust memory and trigger
  // 10 s startup timeouts. One worker at a time prevents OOM crashes.
  // NOTE: the npm test script also passes --runInBand to run in the main process.
  maxWorkers: 1,
  // Restart the worker when idle memory exceeds 4 GB. Prevents cumulative heap
  // growth across test suites from OOMing the jest worker.
  workerIdleMemoryLimit: '4096mb',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

