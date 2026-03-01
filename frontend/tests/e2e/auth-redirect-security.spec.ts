import { test, expect } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const authEmail = process.env.E2E_AUTH_EMAIL || process.env.PLAYWRIGHT_AUTH_EMAIL || ''
const authPassword = process.env.E2E_AUTH_PASSWORD || process.env.PLAYWRIGHT_AUTH_PASSWORD || ''
const isRemoteTarget = /^https?:\/\//.test(baseUrl)
const canRun = isRemoteTarget && Boolean(authEmail && authPassword)

test.describe('auth redirect security', () => {
  test.skip(!canRun, 'Requires PLAYWRIGHT_BASE_URL + E2E_AUTH_EMAIL + E2E_AUTH_PASSWORD')

  test('sign-in ignores absolute external redirect targets', async ({ page }) => {
    await page.goto('/sign-in?redirect=https://evil.example/phish')

    await page.getByRole('textbox', { name: /email/i }).fill(authEmail)
    await page.getByRole('textbox', { name: /password/i }).fill(authPassword)

    await page.getByRole('button', { name: /sign in/i }).click()

    // Accounts with MFA may remain on the sign-in challenge UI.
    // Either way, we must never leave to an external redirect URL.
    await expect(page).not.toHaveURL(/evil\.example/i, { timeout: 30000 })

    const onDashboard = /\/dashboard(?:\?|$)/.test(page.url())
    if (onDashboard) {
      await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30000 })
    }
  })
})
