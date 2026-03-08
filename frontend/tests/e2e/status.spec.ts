import { test, expect } from '@playwright/test'

test('/status route exists and points to Better Uptime status page', async ({ page }) => {
  await page.goto('/status')

  await expect(page).toHaveURL(/\/status$/)
  await expect(page.getByRole('heading', { name: 'Redirecting...' })).toBeVisible()

  const statusLink = page.getByRole('link', { name: 'status.remit-scout.com' })
  await expect(statusLink).toHaveAttribute('href', 'https://status.remit-scout.com')
})
