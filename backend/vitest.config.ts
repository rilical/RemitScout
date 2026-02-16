import { defineConfig } from 'vitest/config'
import path from 'node:path'

const includeProviderFixtures = process.env.RUN_PROVIDER_FIXTURES === '1'
const enforceCoverage = process.env.ENFORCE_COVERAGE === '1'

// Coverage target timeline (starting Feb 12, 2026):
// Reach statements 50%, branches 40%, functions 50%, lines 50% within 3 months.
export default defineConfig({
  test: {
    allowOnly: !process.env.CI,
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
      all: true,
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
            // Starting thresholds (raise every sprint as coverage improves).
            statements: 20,
            branches: 15,
            functions: 25,
            lines: 20,
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
