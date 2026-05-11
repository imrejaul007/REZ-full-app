module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
        target: 'es2020',
        esModuleInterop: true,
        allowJs: true,
        strict: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react-native/(.*)$': '<rootDir>/__mocks__/react-native.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-secure-store|expo-constants|@react-native-async-storage)/)',
  ],
  setupFiles: ['<rootDir>/__tests__/globals.ts'],
  testTimeout: 15000,
  verbose: true,
  clearMocks: true,
};
