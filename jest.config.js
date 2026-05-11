/** @type {import('jest').Config} */
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
  // Test coverage thresholds - fail build if coverage drops below these limits
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
