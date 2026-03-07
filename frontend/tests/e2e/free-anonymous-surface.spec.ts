import { test, expect } from '@playwright/test'

test.describe('free and anonymous surface audit', () => {
  test('redirects signed-out dashboard access to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in\?redirect=\/dashboard/)
  })

  test('auth-gates corridor alert creation for signed-out users', async ({ page }) => {
    await page.goto('/send-money/united-states-to-philippines')

    const alertButton = page.getByTestId('corridor-hero-alert-button')
    await expect(alertButton).toBeVisible({ timeout: 20000 })
    await expect(alertButton).toBeEnabled()
    await alertButton.click()
    await expect(page.getByRole('dialog')).toContainText(/sign in to set alerts/i)
  })

  test('does not expose dead Pulse share or export controls to signed-out users', async ({ page }) => {
    await page.goto('/pulse/charts/all-in-cost?corridor=usd-php&corridor_id=US-PH-USD-PHP&amount=500')

    await expect(page).toHaveURL(/\/pulse\/charts\/all-in-cost/)
    await expect(page.getByText(/Enterprise feature\. Contact sales for access to Pulse charts\./)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Share' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Export CSV' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Compliance PDF' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Embed Snapshot' })).toHaveCount(0)
  })
})
