/**
 * Jest configuration for ReZ ecosystem tests
 * Root-level configuration for tests in tests/unit and tests/integration directories
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
  ],

  // TypeScript configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
    }],
  },

  // Module handling
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@rez/shared-types$': '<rootDir>/packages/shared-types/src/index.ts',
    '^uuid$': '<rootDir>/node_modules/uuid/dist-node/index.js',
  },

  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Run tests in parallel (default behavior)
  maxWorkers: '50%',

  // Detect open handles (useful for debugging)
  detectOpenHandles: true,
  forceExit: true,
};
