import { test, expect } from '@playwright/test'

test('checkout: logged out users are routed into auth before Stripe checkout', async ({ page }) => {
  await page.goto('/plus/checkout')

  await expect(page).toHaveURL(/\/plus\/checkout(?:\?|$)/)
  await expect(page.getByRole('heading', { name: /payment details/i })).toBeVisible()
  await expect(page.getByText(/sign in required/i)).toBeVisible()
  await expect(page.getByText(/create a free account first\./i)).toBeVisible()
  await expect(page.locator('form[data-ready="true"]')).toBeVisible()

  const cta = page.getByTestId('plus-checkout-submit')
  await expect(cta).toBeVisible()
  await expect(cta).toBeEnabled()
  await expect(cta).toContainText(/sign in to continue/i)
  await cta.click()

  await expect(page).toHaveURL(/\/sign-in\?redirect=(%2Fplus%2Fcheckout|\/plus\/checkout)/)
})
