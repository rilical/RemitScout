import { expect, test, type Page } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const authEmail = process.env.E2E_AUTH_EMAIL || process.env.PLAYWRIGHT_AUTH_EMAIL || ''
const authPassword = process.env.E2E_AUTH_PASSWORD || process.env.PLAYWRIGHT_AUTH_PASSWORD || ''
const authMfaCode = process.env.E2E_AUTH_MFA_CODE || process.env.PLAYWRIGHT_AUTH_MFA_CODE || ''
const targetEmail = process.env.E2E_ADMIN_SMOKE_TARGET_EMAIL || 'support@remit-scout.com'
const isRemoteTarget = /^https?:\/\//.test(baseUrl)
const canRun = isRemoteTarget && Boolean(authEmail && authPassword)
const canRunPrivilegedAdminUi = authMfaCode.trim().length > 0
const initialAdminPath = canRunPrivilegedAdminUi ? '/admin/observer' : '/admin/modules'
const initialAdminPathPattern = canRunPrivilegedAdminUi
  ? /\/admin\/observer(?:\?|$)/
  : /\/admin\/modules(?:\?|$)/

const completeSignIn = async (page: Page) => {
  await page.goto(`/sign-in?redirect=${encodeURIComponent(initialAdminPath)}`)

  await page.getByLabel(/email/i).fill(authEmail)
  await page.getByLabel(/password/i).fill(authPassword)
  await page.getByRole('button', { name: /^sign in$/i }).click()

  const mfaInput = page.getByLabel(/authenticator code/i)
  if (await mfaInput.isVisible().catch(() => false)) {
    if (!authMfaCode) {
      throw new Error(
        'Admin browser smoke requires E2E_AUTH_MFA_CODE when the account prompts for MFA.',
      )
    }

    await mfaInput.fill(authMfaCode)
    await Promise.all([
      page.waitForURL(initialAdminPathPattern, { timeout: 30000 }),
      page.getByRole('button', { name: /^verify$/i }).click(),
    ])
    return
  }

  await page.waitForURL(initialAdminPathPattern, { timeout: 30000 })
}

const expectNoAdminLoadFailure = async (page: Page) => {
  await expect(page.locator('body')).not.toContainText(/a database error occurred/i)
  await expect(page.locator('body')).not.toContainText(/failed to load module health/i)
  await expect(page.locator('body')).not.toContainText(/failed to load provider control plane/i)
  await expect(page.locator('body')).not.toContainText(/admin session has been revoked/i)
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/i)
}

const visitObserverPage = async (page: Page) => {
  await expect(page).toHaveURL(/\/admin\/observer(?:\?|$)/, { timeout: 30000 })
  await expect(page.getByText(/operations center/i).first()).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByRole('button', { name: /refresh status/i })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByText(/signal ledger/i).first()).toBeVisible({ timeout: 30000 })
  await expectNoAdminLoadFailure(page)
}

const visitAdminPage = async (
  page: Page,
  path: string,
  heading: RegExp,
  markers: string[],
) => {
  await page.goto(path)
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

  if (!canRunPrivilegedAdminUi) {
    if (/\/account\/security(?:\?|$)/i.test(page.url())) {
      await expect(page.getByRole('heading', { name: /multi-factor authentication/i })).toBeVisible({
        timeout: 10000,
      })
      return 'mfa_required' as const
    }

    if (/\/sign-in(?:\?|$)/i.test(page.url())) {
      return 'session_rejected' as const
    }
  }

  await expect(page.getByRole('heading', { name: heading })).toBeVisible({
    timeout: 30000,
  })
  for (const marker of markers) {
    await expect(page.getByText(new RegExp(marker, 'i')).first()).toBeVisible({ timeout: 30000 })
  }
  await expectNoAdminLoadFailure(page)
  return 'loaded' as const
}

test.describe('admin surface smoke', () => {
  test.skip(!canRun, 'Requires PLAYWRIGHT_BASE_URL + E2E_AUTH_EMAIL + E2E_AUTH_PASSWORD')

  test('bootstraps admin session, verifies admin control planes, and grants then revokes enterprise', async ({
    page,
  }) => {
    await completeSignIn(page)

    if (canRunPrivilegedAdminUi) {
      await visitObserverPage(page)
    }
    else {
      console.log('Skipping privileged admin UI checks: E2E_AUTH_MFA_CODE not configured.')
    }

    const modulesVisit = await visitAdminPage(page, '/admin/modules', /module registry/i, ['registered modules'])
    if (!canRunPrivilegedAdminUi && modulesVisit !== 'loaded') {
      test.skip(true, 'Admin UI smoke requires E2E_AUTH_MFA_CODE when staging routes enforce MFA.')
    }

    await visitAdminPage(page, '/admin/discovery', /provider control plane/i, ['pending discovery reviews', 'operator brief'])
    await visitAdminPage(page, '/admin/analytics', /analytics console/i, ['corridor search trends', 'engagement trend'])
    await visitAdminPage(page, '/admin/gold-exports', /gold exports: indices snapshot/i, ['snapshot rows', 'correction ledger'])
    await visitAdminPage(page, '/admin/audit', /audit log console/i, ['audit events', 'clear all filters'])
    await visitAdminPage(page, '/admin/feature-flags', /feature flags/i, ['effective runtime flags', 'db overrides'])
    await visitAdminPage(page, '/admin/institutional', /institutional client management/i, ['prelaunch workflow', 'create prelaunch client'])
    await visitAdminPage(page, '/admin/ads', /ad inventory/i, ['preview harness', 'inventory list'])

    if (!canRunPrivilegedAdminUi) {
      return
    }

    await page.goto(`/admin/enterprise?email=${encodeURIComponent(targetEmail)}`)
    await expect(page.getByRole('heading', { name: /enterprise account management/i })).toBeVisible(
      { timeout: 30000 },
    )

    const notes = `playwright_admin_surface_${Date.now()}`
    await page.getByLabel(/user email/i).fill(targetEmail)
    await page.getByLabel(/notes/i).fill(notes)
    await page.getByRole('button', { name: /grant enterprise/i }).click()

    await expect(page.getByText(`Enterprise access granted to ${targetEmail}`)).toBeVisible({
      timeout: 30000,
    })

    const table = page.getByRole('table')
    const targetRow = table
      .locator('tr', { has: page.getByText(targetEmail, { exact: true }) })
      .first()
    await expect(targetRow).toBeVisible({ timeout: 30000 })

    page.once('dialog', dialog => dialog.accept())
    await targetRow.getByRole('button', { name: /revoke/i }).click()

    await expect(table.getByText(targetEmail, { exact: true })).toHaveCount(0, { timeout: 30000 })
  })
})
