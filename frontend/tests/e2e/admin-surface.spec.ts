import { expect, test, type Page } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const authEmail = process.env.E2E_AUTH_EMAIL || process.env.PLAYWRIGHT_AUTH_EMAIL || ''
const authPassword = process.env.E2E_AUTH_PASSWORD || process.env.PLAYWRIGHT_AUTH_PASSWORD || ''
const authMfaCode = process.env.E2E_AUTH_MFA_CODE || process.env.PLAYWRIGHT_AUTH_MFA_CODE || ''
const targetEmail = process.env.E2E_ADMIN_SMOKE_TARGET_EMAIL || 'support@remit-scout.com'
const isRemoteTarget = /^https?:\/\//.test(baseUrl)
const canRun = isRemoteTarget && Boolean(authEmail && authPassword)

const completeSignIn = async (page: Page) => {
  await page.goto('/sign-in?redirect=/admin/observer')

  await page.getByLabel(/email/i).fill(authEmail)
  await page.getByLabel(/password/i).fill(authPassword)
  await page.getByRole('button', { name: /^sign in$/i }).click()

  const mfaInput = page.getByLabel(/authenticator code/i)
  if (await mfaInput.isVisible().catch(() => false)) {
    if (!authMfaCode) {
      throw new Error('Admin browser smoke requires E2E_AUTH_MFA_CODE when the account prompts for MFA.')
    }

    await mfaInput.fill(authMfaCode)
    await Promise.all([
      page.waitForURL(/\/admin\/observer(?:\?|$)/, { timeout: 30000 }),
      page.getByRole('button', { name: /^verify$/i }).click(),
    ])
    return
  }

  await page.waitForURL(/\/admin\/observer(?:\?|$)/, { timeout: 30000 })
}

test.describe('admin surface smoke', () => {
  test.skip(!canRun, 'Requires PLAYWRIGHT_BASE_URL + E2E_AUTH_EMAIL + E2E_AUTH_PASSWORD')

  test('bootstraps admin session, reads observer, and grants then revokes enterprise', async ({ page }) => {
    await completeSignIn(page)

    await expect(page.getByRole('heading', { name: /observer console/i })).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(/operations center/i).first()).toBeVisible({ timeout: 30000 })

    await page.goto(`/admin/enterprise?email=${encodeURIComponent(targetEmail)}`)
    await expect(page.getByRole('heading', { name: /enterprise account management/i })).toBeVisible({ timeout: 30000 })

    const notes = `playwright_admin_surface_${Date.now()}`
    await page.getByLabel(/user email/i).fill(targetEmail)
    await page.getByLabel(/notes/i).fill(notes)
    await page.getByRole('button', { name: /grant enterprise/i }).click()

    await expect(page.getByText(`Enterprise access granted to ${targetEmail}`)).toBeVisible({ timeout: 30000 })

    const table = page.getByRole('table')
    const targetRow = table.locator('tr', { has: page.getByText(targetEmail, { exact: true }) }).first()
    await expect(targetRow).toBeVisible({ timeout: 30000 })

    page.once('dialog', dialog => dialog.accept())
    await targetRow.getByRole('button', { name: /revoke/i }).click()

    await expect(table.getByText(targetEmail, { exact: true })).toHaveCount(0, { timeout: 30000 })
  })
})
