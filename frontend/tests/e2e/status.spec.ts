import { test, expect } from '@playwright/test'

test('/status route exists and points to Better Uptime status page', async ({ page }) => {
  const requestedUrls: string[] = []
  page.on('request', (request) => {
    requestedUrls.push(request.url())
  })

  await page.goto('/status')
  await page.waitForTimeout(1000)

  // Some environments cannot resolve status.remit-scout.com (DNS/network policy),
  // but we still require the redirect request to be attempted.
  expect(requestedUrls.some(url => url.includes('status.remit-scout.com'))).toBe(true)
  const finalUrl = page.url()
  expect(
    finalUrl.includes('status.remit-scout.com')
    || finalUrl.startsWith('chrome-error://'),
  ).toBe(true)
})
