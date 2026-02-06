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

test('legal + legacy redirects exist', async ({ page }) => {
  await page.goto('/legal')
  await expect(page.getByRole('heading', { name: 'Legal & Disclosures' })).toBeVisible()

  await page.goto('/terms')
  await expect(page).toHaveURL(/\/legal\/terms/)

  await page.goto('/privacy')
  await expect(page).toHaveURL(/\/legal\/privacy/)

  await page.goto('/providers')
  await expect(page).toHaveURL(/\/learn\/providers/)
})

test('plus + pulse surfaces load (logged out)', async ({ page }) => {
  await page.goto('/plus')
  await expect(page.getByRole('heading', { name: /never miss the perfect rate/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /choose your plan/i })).toBeVisible()

  await page.goto('/pulse')
  await expect(page.getByRole('heading', { name: /pulse is included with plus/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /upgrade to plus/i }).first()).toBeVisible()
})

test('mobile nav renders', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  // Header should be present; hamburger exists on small screens.
  const banner = page.getByRole('banner')
  await expect(banner.getByRole('img', { name: 'Remit-Scout logo' })).toBeVisible()
  await expect(banner.getByRole('button', { name: /open menu/i })).toBeVisible()
})
