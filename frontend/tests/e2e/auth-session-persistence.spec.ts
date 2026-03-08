import { test, expect, type Page } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const authEmail = process.env.E2E_AUTH_EMAIL || process.env.PLAYWRIGHT_AUTH_EMAIL || ''
const authPassword = process.env.E2E_AUTH_PASSWORD || process.env.PLAYWRIGHT_AUTH_PASSWORD || ''
const authMfaCode = process.env.E2E_AUTH_MFA_CODE || process.env.PLAYWRIGHT_AUTH_MFA_CODE || ''
const isRemoteTarget = /^https?:\/\//.test(baseUrl)
const canRun = isRemoteTarget && Boolean(authEmail && authPassword)

const completeSignIn = async (page: Page) => {
  await page.goto('/sign-in?redirect=/dashboard')

  await page.getByRole('textbox', { name: /email/i }).fill(authEmail)
  await page.getByRole('textbox', { name: /password/i }).fill(authPassword)
  await page.getByRole('button', { name: /sign in/i }).click()

  const mfaInput = page.getByLabel(/authenticator code/i)
  if (await mfaInput.isVisible().catch(() => false)) {
    if (!authMfaCode) {
      throw new Error(
        'Auth browser smoke requires E2E_AUTH_MFA_CODE when the account prompts for MFA.',
      )
    }

    await mfaInput.fill(authMfaCode)
    await Promise.all([
      page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 30000 }),
      page.getByRole('button', { name: /^verify$/i }).click(),
    ])
    return
  }

  await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 30000 })
}

test.describe('auth session persistence', () => {
  test.skip(!canRun, 'Requires PLAYWRIGHT_BASE_URL + E2E_AUTH_EMAIL + E2E_AUTH_PASSWORD')

  test('stays signed in after reload and sign-out invalidates dashboard access', async ({ page }) => {
    await completeSignIn(page)

    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 30000 })

    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/, { timeout: 30000 })
    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 30000 })

    const userMenuButton = page.locator('.user-menu > button')
    await expect(userMenuButton).toBeVisible({ timeout: 30000 })
    await userMenuButton.click()

    await Promise.all([
      page.waitForURL((url) => !/\/dashboard(?:\?|$)/.test(url.toString()), { timeout: 30000 }),
      page.getByRole('button', { name: /^sign out$/i }).click(),
    ])

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in\?redirect=\/dashboard/, { timeout: 30000 })
  })
})
