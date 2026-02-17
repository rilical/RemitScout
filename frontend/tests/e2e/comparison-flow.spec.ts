import { test, expect } from '@playwright/test'

test('comparison flow: corridor page renders mocked provider rows', async ({ page }) => {
  await page.goto('/send-money/us-to-gt')

  // Core corridor surface should render even when API is mocked.
  await expect(page.getByRole('button', { name: /add to watchlist/i }).first()).toBeVisible({ timeout: 20000 })

  // Mocked backend provides a couple providers; ensure at least one renders.
  await expect(page.getByText('Wise').first()).toBeVisible()
})

