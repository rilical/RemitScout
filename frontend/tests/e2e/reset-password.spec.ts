import { test, expect } from '@playwright/test'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const canRun = /^https?:\/\//.test(baseUrl)

test.describe('reset password flow', () => {
  test.skip(!canRun, 'Requires PLAYWRIGHT_BASE_URL')

  const user = {
    id: 'mock-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'user@example.com',
    phone: '',
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    identities: [],
  }

  const makeSession = () => ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor((Date.now() + 3600 * 1000) / 1000),
    user,
  })

  test('completes recovery flow with a valid reset token', async ({ page }) => {
    await page.route('**/auth/v1/**', async (route) => {
      const url = new URL(route.request().url())
      const method = route.request().method().toUpperCase()

      if (url.pathname.endsWith('/auth/v1/verify')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(makeSession()),
        })
      }

      if (url.pathname.endsWith('/auth/v1/user')) {
        if (method === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ user }),
          })
        }

        if (method === 'PUT') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ user }),
          })
        }
      }

      if (url.pathname.endsWith('/auth/v1/token')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(makeSession()),
        })
      }

      return route.continue()
    })

    await page.goto('/reset-password?token_hash=valid-token-hash')

    const missingConfig = await page.getByText('Supabase is not configured.').isVisible({ timeout: 2000 }).catch(() => false)
    if (missingConfig) {
      test.skip(true, 'Supabase not configured in this environment')
    }

    await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Update password' })).toBeDisabled()

    await page.getByLabel('New password').fill('StrongPassw0rd!')
    await page.getByLabel('Confirm password').fill('StrongPassw0rd!')

    await expect(page.getByRole('button', { name: 'Update password' })).toBeEnabled()
    await page.getByRole('button', { name: 'Update password' }).click()

    await expect(page.getByText('Password updated')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('You can now sign in with your new password.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to sign in' })).toBeVisible()
    await page.getByRole('link', { name: 'Go to sign in' }).click()
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
