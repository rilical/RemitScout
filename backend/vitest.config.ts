import { defineConfig } from 'vitest/config'
import path from 'node:path'

const includeProviderFixtures = process.env.RUN_PROVIDER_FIXTURES !== '0'
const enforceCoverage = process.env.ENFORCE_COVERAGE === '1'

// Coverage enforcement policy:
// - CI enforces starter repo-wide thresholds to prevent regressions while broad coverage catches up.
// - Critical-path gates (shared / plane-a / plane-c / billing) are enforced in Codecov flags at 85%+.
export default defineConfig({
  test: {
    allowOnly: !process.env.CI,
    globals: true,
    environment: 'node',
    pool: 'threads',
    setupFiles: ['./tests/setup-env.ts'],
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.stryker-tmp/**',
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
            statements: 30,
            branches: 50,
            functions: 50,
            lines: 30,
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
