import { test, expect, type Page } from '@playwright/test'

const stubGeo = async (page: Page, countryCode: string) => {
  await page.route('**/geo**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ countryCode }),
    })
  })
}

const inAppBanner = (page: Page) => page.getByText(/ads keep the free plan free/i)
const acceptButton = (page: Page) =>
  page.getByRole('button', { name: /accept & support remit-scout/i })
const rejectButton = (page: Page) =>
  page.getByRole('button', { name: /reject non-essential/i })
const manageCookiesButton = (page: Page) =>
  page.getByRole('button', { name: /manage cookies/i })
const readStoredPrivacySettings = (page: Page) =>
  page.evaluate(() => window.localStorage.getItem('rs:privacy:settings'))

test('consent surface is available on home page', async ({ page }) => {
  await stubGeo(page, 'DE')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /send more home/i })).toBeVisible()
  await expect(acceptButton(page)).toBeVisible()
  await expect(rejectButton(page)).toBeVisible()
  await acceptButton(page).click()
  await expect(inAppBanner(page)).toHaveCount(0)
  await expect(acceptButton(page)).toHaveCount(0)
  await expect.poll(() => readStoredPrivacySettings(page)).toContain('"marketing":true')
})

test('reject/non-essential consent path is stable', async ({ page }) => {
  await stubGeo(page, 'DE')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /send more home/i })).toBeVisible()
  await expect(rejectButton(page)).toBeVisible()
  await rejectButton(page).click()
  await expect(inAppBanner(page)).toHaveCount(0)
  await expect(rejectButton(page)).toHaveCount(0)
  await expect.poll(() => readStoredPrivacySettings(page)).toContain('"marketing":false')
})

test('outside EEA/UK: banner does not auto-show; cookie settings entry is still available', async ({ page }) => {
  await stubGeo(page, 'US')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /send more home/i })).toBeVisible()
  await expect.poll(() => readStoredPrivacySettings(page)).toContain('"marketing":true')
  await expect(inAppBanner(page)).toHaveCount(0)
  await expect(manageCookiesButton(page)).toHaveCount(0)
})
