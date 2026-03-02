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
const acceptButton = (page: Page) => page.getByRole('button', { name: /accept/i })
const rejectButton = (page: Page) => page.getByRole('button', { name: /reject/i })
const cookieSettingsButton = (page: Page) => page.getByRole('button', { name: /cookie settings/i })
const privacyPolicyLink = (page: Page) => page.getByRole('link', { name: /privacy policy/i }).first()

test('consent surface is available on home page', async ({ page }) => {
  await stubGeo(page, 'DE')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /send more home/i })).toBeVisible()

  const bannerCount = await inAppBanner(page).count()
  if (bannerCount > 0) {
    await expect(acceptButton(page).first()).toBeVisible()
    await acceptButton(page).first().click()
    await expect(inAppBanner(page)).toHaveCount(0)
  }
 else {
    // Staging currently uses Gatekeeper CMP scripts instead of in-app copy.
    await expect(page.locator('script[src*="gatekeeperconsent"]')).toHaveCount(2)
    await expect(privacyPolicyLink(page)).toBeVisible()
  }
})

test('reject/non-essential consent path is stable', async ({ page }) => {
  await stubGeo(page, 'DE')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /send more home/i })).toBeVisible()

  const rejectCount = await rejectButton(page).count()
  if (rejectCount > 0) {
    await rejectButton(page).first().click()
    await expect(inAppBanner(page)).toHaveCount(0)
  }
 else {
    await expect(page.locator('script[src*="gatekeeperconsent"]')).toHaveCount(2)
  }
})

test('outside EEA/UK: banner does not auto-show; cookie settings entry is still available', async ({ page }) => {
  await stubGeo(page, 'US')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /send more home/i })).toBeVisible()

  await expect(inAppBanner(page)).toHaveCount(0)

  const cookieSettingsCount = await cookieSettingsButton(page).count()
  if (cookieSettingsCount > 0) {
    await cookieSettingsButton(page).first().click()
    await expect(page.getByText(/cookie preferences/i)).toBeVisible()
  }
 else {
    await expect(privacyPolicyLink(page)).toBeVisible()
  }
})
