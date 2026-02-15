import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    stylistic: true,
    tooling: false,
  },
  dirs: {
    src: ['./playgrounds', './'],
  },
}).override('nuxt/vue/rules', {
  rules: {
    'vue/multi-word-component-names': 'off',
    // Enforced via the runtime-only override below so server/scripts can still log.
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
}).append({
  name: 'frontend/no-console-runtime',
  files: [
    'app.vue',
    'components/**/*.{ts,vue}',
    'composables/**/*.ts',
    'domains/**/*.{ts,vue}',
    'layouts/**/*.vue',
    'middleware/**/*.{ts,js}',
    'pages/**/*.vue',
    'plugins/**/*.{ts,js}',
    'shared/**/*.{ts,vue}',
    'stores/**/*.{ts,js}',
    'types/**/*.{ts,js}',
    'utils/**/*.{ts,js}',
  ],
  rules: {
    'no-console': ['error', { allow: ['warn'] }],
  },
}).append({
  name: 'phase2/no-$fetch-in-composables',
  files: [
    'composables/**/*.ts',
  ],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: 'CallExpression[callee.name=\'$fetch\']',
      message: 'Do not call `$fetch` directly in composables. Use `useApi().request()` (see `composables/useApi.ts`).',
    }],
  },
}).append({
  name: 'phase2/no-$fetch-in-useApi',
  files: [
    'composables/useApi.ts',
  ],
  rules: {
    'no-restricted-syntax': 'off',
  },
}).append({
  name: 'phase2/no-process-env-client',
  files: [
    '**/*.vue',
    'composables/**/*.ts',
    'plugins/**/*.{ts,js}',
  ],
  rules: {
    'no-restricted-properties': ['error', {
      object: 'process',
      property: 'env',
      message: 'Use `useRuntimeConfig()` instead of `process.env` in client code.',
    }],
  },
}).append({
  name: 'phase2/icon-discipline',
  files: [
    'pages/dashboard.vue',
    'pages/plus.vue',
    'pages/pulse.vue',
    'domains/**/*.{ts,vue}',
  ],
  rules: {
    // Phase 2 rule: callers must use the shared Icon wrapper (not direct heroicon imports).
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@heroicons/vue/**'],
          message: 'Use `~/ui/Icon` (Icon wrapper) instead of importing heroicons directly.',
        },
      ],
    }],
  },
}).append({
  name: 'phase2/domain-purity',
  files: [
    'domains/*/domain/**/*.{ts,vue}',
  ],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: 'vue', message: 'Domain layer must be framework-agnostic (no Vue imports).' },
        { name: 'nuxt/app', message: 'Domain layer must be framework-agnostic (no Nuxt imports).' },
        { name: 'nuxt', message: 'Domain layer must be framework-agnostic (no Nuxt imports).' },
        { name: '#imports', message: 'Domain layer must be framework-agnostic (no Nuxt auto-imports).' },
      ],
      patterns: [
        { group: ['~/pages/**', '~/components/**', '~/composables/**', '~/server/**', '~/lib/**'], message: 'Domain layer must not depend on app/UI/infrastructure modules.' },
      ],
    }],
  },
}).append({
  name: 'phase2/pulse-ui-boundaries',
  files: [
    'domains/pulse/ui/**/*.{ts,vue}',
  ],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: '~/lib/pulseApi', message: 'Pulse UI must not import `~/lib/pulseApi` directly. Use `domains/pulse/infrastructure`.' },
      ],
    }],
  },
}).append({
  name: 'phase2/legacy-dashboard-tabs',
  files: [
    'domains/dashboard/ui/DashboardSignedIn.vue',
  ],
  rules: {
    // Legacy file: disable tab-related rules to keep the gate unblocked.
    // Remove this override when DashboardSignedIn is refactored.
    '@stylistic/no-tabs': 'off',
    '@stylistic/no-mixed-spaces-and-tabs': 'off',
  },
}).append({
  name: 'scripts/relaxed',
  files: ['scripts/**/*.mjs'],
  rules: {
    '@stylistic/arrow-parens': 'off',
  },
}).append({
  name: 'generated/ignore',
  ignores: [
    'shared/lib/api/**',
    'tmp/**',
  ],
}).append({
  name: 'frontend/color-tokens',
  files: ['**/*.vue'],
  rules: {
    'no-restricted-syntax': ['warn', {
      message: 'Replace raw Tailwind color classes with semantic tokens (brand/neutral/primary/success/warning/danger/accent/rs-*).',
      selector: 'VAttribute[key.name.name=\'class\'][value.value.type=\'VLiteral\'][value.value.value=/\\b(?:hover:|focus:|active:|sm:|md:|lg:|xl:)?(?:text-|bg-|border-|from-|to-|via-|ring-|placeholder-|outline-|shadow-|divide-)?(?:slate|gray|zinc|stone|blue|sky|cyan|teal|indigo|violet|purple|fuchsia|pink|rose|red|orange|amber|yellow|lime|green|emerald)-\\d{2,3}\\b/]',
    }],
  },
})
.overrideRules({
  // The current codebase still contains explicit `any` and intentionally-unused values.
  // Treat these as warnings so `pnpm lint` stays usable while we incrementally tighten.
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': 'warn',
  'vue/no-unused-vars': 'warn',
  // Formatting is handled by Prettier in this repo; keep ESLint focused on correctness.
  '@stylistic/indent': 'off',
  'vue/html-indent': 'off',
  'vue/script-indent': 'off',
  'vue/singleline-html-element-content-newline': 'off',

  // Lightweight import sorting (avoid strict ordering churn).
  'sort-imports': ['warn', { ignoreCase: false, ignoreDeclarationSort: true, ignoreMemberSort: false, allowSeparatedGroups: true }],
})
