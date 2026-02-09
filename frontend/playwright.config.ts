import { defineConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Playwright runs with `cwd` set to the frontend package; don't double `-C frontend`.
        command: 'pnpm run build && pnpm run preview --port 3000',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        // `pnpm run build` is the slow part; allow enough time for cold caches.
        timeout: 10 * 60 * 1000,
      },
})
