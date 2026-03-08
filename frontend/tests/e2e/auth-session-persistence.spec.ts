import { test, expect, type Page } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const authEmail = process.env.E2E_AUTH_EMAIL || process.env.PLAYWRIGHT_AUTH_EMAIL || ''
const authPassword = process.env.E2E_AUTH_PASSWORD || process.env.PLAYWRIGHT_AUTH_PASSWORD || ''
const authMfaCode = process.env.E2E_AUTH_MFA_CODE || process.env.PLAYWRIGHT_AUTH_MFA_CODE || ''
const isRemoteTarget = /^https?:\/\//.test(baseUrl)
const canRun = isRemoteTarget && Boolean(authEmail && authPassword)
const dashboardSubtitle = /manage your watchlist, alerts, and transfer history/i

const isDashboardUrl = (url: string | URL) => {
  const parsed = typeof url === 'string' ? new URL(url, baseUrl || 'https://remit-scout.local') : url
  return parsed.pathname === '/dashboard'
}

const waitForDashboard = async (page: Page) => {
  await page.waitForURL(url => isDashboardUrl(url), { timeout: 30000 })
  await expect(page.getByText(dashboardSubtitle)).toBeVisible({ timeout: 30000 })
}

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
      page.waitForURL(url => isDashboardUrl(url), { timeout: 30000 }),
      page.getByRole('button', { name: /^verify$/i }).click(),
    ])
    await expect(page.getByText(dashboardSubtitle)).toBeVisible({ timeout: 30000 })
    return
  }

  await waitForDashboard(page)
}

test.describe('auth session persistence', () => {
  test.skip(!canRun, 'Requires PLAYWRIGHT_BASE_URL + E2E_AUTH_EMAIL + E2E_AUTH_PASSWORD')

  test('stays signed in after reload and sign-out invalidates dashboard access', async ({ page }) => {
    await completeSignIn(page)

    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(dashboardSubtitle)).toBeVisible({ timeout: 30000 })

    await page.reload({ waitUntil: 'domcontentloaded' })

    await waitForDashboard(page)
    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 30000 })

    const userMenuButton = page.locator('.user-menu > button')
    await expect(userMenuButton).toBeVisible({ timeout: 30000 })
    await userMenuButton.click()

    await Promise.all([
      page.waitForURL(url => !isDashboardUrl(url), { timeout: 30000 }),
      page.getByRole('button', { name: /^sign out$/i }).click(),
    ])

    await page.goto('/dashboard')
    await expect(page).toHaveURL(url =>
      url.pathname === '/sign-in' && url.searchParams.get('redirect') === '/dashboard',
    { timeout: 30000 })
  })
})
