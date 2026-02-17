import { test, expect } from '@playwright/test'

test('checkout: logged out redirects to sign-in with redirect param', async ({ page }) => {
  await page.goto('/plus/checkout')

  await expect(page.getByRole('heading', { name: /upgrade to plus/i })).toBeVisible()

  await page.getByRole('button', { name: /continue to stripe checkout/i }).click()

  await expect(page).toHaveURL(/\/sign-in\?.*redirect=.*plus%2Fcheckout|\/sign-in\?.*redirect=.*\/plus\/checkout/)
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
})

