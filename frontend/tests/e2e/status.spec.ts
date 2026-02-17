import { test, expect } from '@playwright/test'

test('/status route exists and points to Better Uptime status page', async ({ page }) => {
  await page.goto('/status')

  const refresh = page.locator('meta[http-equiv="refresh"]')
  const refreshCount = await refresh.count()
  if (refreshCount > 0) {
    const content = await refresh.first().getAttribute('content')
    expect(content || '').toContain('https://status.remit-scout.com')
  }

  await expect(page.getByRole('link', { name: 'status.remit-scout.com' })).toBeVisible()
})
