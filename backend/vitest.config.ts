import { defineConfig } from 'vitest/config'
import path from 'node:path'

const includeProviderFixtures = process.env.RUN_PROVIDER_FIXTURES === '1'
const enforceCoverage = process.env.ENFORCE_COVERAGE === '1'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      ...(includeProviderFixtures
        ? []
        : [
            '**/tests/*-parse.test.ts',
            '**/tests/*-corridors.test.ts',
            '**/tests/*corridors*.test.ts',
            '**/tests/*-fetch.test.ts',
          ]),
    ],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/scripts/**',
        '**/db/migrations/**',
        '**/shared/config.ts',
      ],
      include: [
        'plane-a/src/**/*.ts',
        'plane-b/src/**/*.ts',
        'plane-c/src/**/*.ts',
        'shared/**/*.ts',
      ],
      thresholds: enforceCoverage
        ? {
            statements: 10,
            branches: 40,
            functions: 20,
            lines: 10,
          }
        : {
            statements: 0,
            branches: 0,
            functions: 0,
            lines: 0,
          },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
