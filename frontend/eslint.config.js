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
}).overrideRules({
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
