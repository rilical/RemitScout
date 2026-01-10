import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /send more home/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /compare providers/i }),
  ).toBeVisible()
})
