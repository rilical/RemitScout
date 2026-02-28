import { test, expect } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const authEmail = process.env.E2E_AUTH_EMAIL || process.env.PLAYWRIGHT_AUTH_EMAIL || ''
const authPassword = process.env.E2E_AUTH_PASSWORD || process.env.PLAYWRIGHT_AUTH_PASSWORD || ''
const isRemoteTarget = /^https?:\/\//.test(baseUrl)
const canRun = isRemoteTarget && Boolean(authEmail && authPassword)

test.describe('auth session persistence', () => {
  test.skip(!canRun, 'Requires PLAYWRIGHT_BASE_URL + E2E_AUTH_EMAIL + E2E_AUTH_PASSWORD')

  test('stays signed in after dashboard reload', async ({ page }) => {
    await page.goto('/sign-in?redirect=/dashboard')

    await page.getByRole('textbox', { name: /email/i }).fill(authEmail)
    await page.getByRole('textbox', { name: /password/i }).fill(authPassword)

    await Promise.all([
      page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 30000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ])

    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 30000 })

    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30000 })
    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 30000 })
  })
})
