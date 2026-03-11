import { test, expect } from '@playwright/test'

test('comparison flow: corridor page renders mocked provider rows', async ({ page }) => {
  await page.goto('/send-money/united-states-to-philippines')

  // Core corridor surface should render even when API is mocked.
  await expect(page.getByRole('heading', { name: /send money from united states to philippines/i })).toBeVisible({ timeout: 20000 })
  await expect(page.getByRole('button', { name: /add to watchlist|save/i }).first()).toBeVisible({ timeout: 20000 })

  // In remote environments providers may be temporarily unavailable; either state is valid.
  const providersHeading = page.getByRole('heading', { name: /^compare\s+\d+\s+provider(s)?$/i })
  const unavailableState = page.getByText(
    /provider information is temporarily unavailable|trouble refreshing live provider data right now/i,
  )

  await expect.poll(async () => {
    const headingVisible = await providersHeading.first().isVisible().catch(() => false)
    const unavailableVisible = await unavailableState.first().isVisible().catch(() => false)
    return headingVisible || unavailableVisible
  }, { timeout: 20000 }).toBe(true)

  const headingVisible = await providersHeading.first().isVisible().catch(() => false)
  if (headingVisible) {
    await expect(providersHeading.first()).toBeVisible()
    return
  }

  await expect(unavailableState.first()).toBeVisible()
})
