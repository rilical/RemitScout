import { defineConfig } from '@playwright/test'

// Use a dedicated port for Playwright to avoid accidentally reusing `nuxt dev` on :3000.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3002'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      // Playwright runs with `cwd` set to the frontend package; don't double `-C frontend`.
      // `nuxi preview` does not support `--host`; it binds to all interfaces by default.
        command: 'pnpm run build && E2E_MOCK_API=1 pnpm exec nuxi preview -p 3002',
        port: 3002,
        reuseExistingServer: false,
        // `pnpm run build` is the slow part; allow enough time for cold caches.
        timeout: 10 * 60 * 1000,
      },
})
