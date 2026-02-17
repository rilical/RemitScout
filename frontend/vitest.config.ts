import path from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const vuePlugin = vue() as any
const enforceCoverage = process.env.ENFORCE_COVERAGE === '1'

export default defineConfig({
  plugins: [vuePlugin],
  test: {
    allowOnly: !process.env.CI,
    pool: 'threads',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/.nuxt/**',
        '**/.output/**',
        '**/coverage/**',
        '**/*.test.ts',
        '**/tests/**',
      ],
      thresholds: enforceCoverage
        ? {
            // Starting thresholds (raise every sprint as coverage improves).
            statements: 10,
            branches: 5,
            functions: 10,
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
      '~': path.resolve(__dirname, '.'),
      '@': path.resolve(__dirname, '.'),
    },
  },
})
