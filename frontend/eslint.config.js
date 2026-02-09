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
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
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
})
