import { test, expect } from '@playwright/test'

test('checkout: logged out CTA routes to auth', async ({ page }) => {
  await page.goto('/plus/checkout')

  await expect(page.getByRole('heading', { name: /never miss a great rate/i })).toBeVisible()

  const cta = page.getByRole('button', { name: /^get started$/i }).first()
  await expect(cta).toBeVisible()
  await cta.click()

  await expect(page).toHaveURL(/\/(sign-up|sign-in)(\?|$)/)
})
