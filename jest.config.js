const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/__tests__/**',
    '!app/**/*.test.{ts,tsx}',
    '!app/**/layout.tsx',
    '!app/**/page.tsx',
    '!**/__tests__/e2e/**',
    '!lib/websocket/server.ts', // WebSocket server requires integration tests
  ],
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '!**/__tests__/e2e/**',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
