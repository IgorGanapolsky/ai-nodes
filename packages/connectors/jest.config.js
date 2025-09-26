module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@/connectors/(.*)$': '<rootDir>/src/connectors/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/cache/(.*)$': '<rootDir>/src/cache/$1',
    '^@/scrapers/(.*)$': '<rootDir>/src/scrapers/$1',
    '^@/factories/(.*)$': '<rootDir>/src/factories/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(p-retry|retry)/)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};
