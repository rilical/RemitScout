import { defineConfig } from '@playwright/test'

// Use a dedicated port for Playwright to avoid accidentally reusing `nuxt dev` on :3000.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3002'
const localServerMode = process.env.PLAYWRIGHT_LOCAL_SERVER_MODE || 'dev'
const localWorkers = process.env.PLAYWRIGHT_BASE_URL ? undefined : 1

const localWebServerCommand
  = localServerMode === 'preview'
    ? 'LOCAL_E2E_PREVIEW=1 NUXT_PUBLIC_PULSE_ENABLED=1 NUXT_BUILD_TYPECHECK=0 pnpm run build && LOCAL_E2E_PREVIEW=1 NUXT_PUBLIC_PULSE_ENABLED=1 E2E_MOCK_API=1 pnpm exec nuxi preview -p 3002'
    : 'NUXT_PUBLIC_PULSE_ENABLED=1 E2E_MOCK_API=1 pnpm exec nuxi dev -p 3002 --host 127.0.0.1'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  workers: localWorkers,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      // Default to `nuxi dev` locally so dynamic routes such as `/pulse/charts/:id`
      // are exercised instead of disappearing behind prerender-only preview output.
      // Set `PLAYWRIGHT_LOCAL_SERVER_MODE=preview` when you explicitly want the
      // build + static preview path.
        command: localWebServerCommand,
        port: 3002,
        reuseExistingServer: false,
        // `nuxt dev` cold starts slowly and preview mode may build first.
        timeout: 10 * 60 * 1000,
      },
})
