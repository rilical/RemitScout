import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import boundaries from 'eslint-plugin-boundaries'

// Flat config replacement for the legacy root `.eslintrc.js`.
// Scope is intentionally focused on `backend/**` (frontend has its own config).
export default [
  {
    ignores: [
      // Ignore the Golden Rule test file in normal lint runs (linted separately in CI).
      'backend/plane-a/ForbiddenImport.test.js',

      // Ignore secrets or local env files.
      'secrets/**',
      '**/*.env',

      // Ignore build output.
      'backend/dist/**',
      'dist/**',
      '**/node_modules/**',
    ],
  },
  {
    files: ['backend/**/*.{js,cjs,mjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      globals: {
        fetch: 'readonly',
        AbortController: 'readonly',
      },
    },
    plugins: {
      boundaries,
      '@typescript-eslint': tsPlugin,
    },
    settings: {
      'boundaries/elements': [
        { pattern: 'backend/plane-a/**', type: 'plane-a' },
        { pattern: 'plane-a/**', type: 'plane-a' },
        { pattern: 'backend/plane-b/**', type: 'plane-b' },
        { pattern: 'plane-b/**', type: 'plane-b' },
        { pattern: 'backend/plane-c/**', type: 'plane-c' },
        { pattern: 'plane-c/**', type: 'plane-c' },
        { pattern: 'backend/scripts/**', type: 'scripts' },
        { pattern: 'scripts/**', type: 'scripts' },
        { pattern: 'backend/tests/**', type: 'tests' },
        { pattern: 'tests/**', type: 'tests' },
        { pattern: 'backend/shared/**', type: 'shared' },
        { pattern: 'shared/**', type: 'shared' },
        { pattern: 'backend/storage/bronze/**', type: 'bronze' },
        { pattern: 'storage/bronze/**', type: 'bronze' },
      ],
      'boundaries/ignore': [
        '**/node_modules/**',
        '**/secrets/**',
      ],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'allow',
        rules: [
          {
            from: ['plane-a'],
            disallow: ['bronze', 'plane-b', 'plane-c'],
          },
          {
            from: ['plane-b'],
            disallow: ['plane-a', 'plane-c'],
          },
          {
            from: ['plane-c'],
            disallow: ['plane-a', 'plane-b'],
          },
          {
            from: ['shared'],
            disallow: ['plane-a', 'plane-b', 'plane-c', 'bronze'],
          },
          // Tests and scripts are allowed to cross-import (explicitly).
          {
            from: ['tests', 'scripts'],
            allow: ['plane-a', 'plane-b', 'plane-c', 'shared', 'bronze', 'tests', 'scripts'],
          },
        ],
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  // Config hygiene guardrail (CS-3.10):
  // In the modules already migrated to `shared/config.ts`, ban direct `process.env`.
  {
    files: [
      'backend/plane-a/src/services/alert-evaluator.ts',
      'backend/plane-a/src/services/alert-notifications.ts',
      'backend/plane-a/src/services/newsletter-email.ts',
      'backend/plane-a/src/routes/providers.ts',
      'backend/plane-a/src/plugins/rate-limit-redis.ts',
      'backend/plane-a/src/plugins/swagger.ts',
      'backend/shared/db.ts',
      'backend/scripts/export-worker.ts',
      'backend/scripts/alert-evaluation-worker.ts',
      'backend/scripts/ops-alerts-queue-worker.ts',
      'backend/scripts/notifications-queue-worker.ts',
      'backend/scripts/fx-rate-refresh-worker.ts',
      'backend/scripts/b2c-refresh-worker.ts',
      'backend/scripts/oanda-rates-sync.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.name='process'][object.property.name='env']",
          message: 'Use backend/shared/config.ts instead of direct process.env access.',
        },
      ],
    },
  },
]
