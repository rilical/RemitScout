import { test, expect, type Page } from '@playwright/test'

const stubGeo = async (page: Page, countryCode: string) => {
  await page.route('**/api/geo', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ countryCode }),
    })
  })
}

const getPublicConfig = async (page: Page) => {
  return await page.evaluate(() => {
    const nuxt = (window as any).__NUXT__
    return nuxt?.config?.public ?? null
  })
}

test('cookie banner shows; accept enables marketing gating', async ({ page }) => {
  await stubGeo(page, 'DE')
  await page.goto('/')

  await expect(page.getByText('Ads keep the free plan free')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept & support Remit-Scout' })).toBeVisible()

  const before = await page.evaluate(() => {
    return {
      privacy: window.localStorage.getItem('rs:privacy:settings'),
      ezoicScript: Boolean(document.querySelector('script[src*="ezojs.com/ezoic/sa.min.js"]')),
      ezstandalone: typeof (window as any).ezstandalone !== 'undefined',
      attribution: window.localStorage.getItem('rs:attribution'),
      redditPixelScript: Boolean(document.querySelector('script[src*="redditstatic.com/ads/v2.0/rdtag.js"]')),
      hasRdt: typeof (window as any).rdt === 'function',
      xPixelScript: Boolean(document.querySelector('script[src*="static.ads-twitter.com/uwt.js"]')),
      hasTwq: typeof (window as any).twq === 'function',
    }
  })

  expect(before.privacy).toBeNull()
  expect(before.ezoicScript).toBe(false)
  expect(before.ezstandalone).toBe(false)
  expect(before.attribution).toBeNull()
  expect(before.redditPixelScript).toBe(false)
  expect(before.hasRdt).toBe(false)
  expect(before.xPixelScript).toBe(false)
  expect(before.hasTwq).toBe(false)

  await page.getByRole('button', { name: 'Accept & support Remit-Scout' }).click()
  await expect(page.getByText('Ads keep the free plan free')).toHaveCount(0)

  const stored = await page.evaluate(() => {
    const raw = window.localStorage.getItem('rs:privacy:settings')
    return raw ? JSON.parse(raw) : null
  })
  expect(stored).not.toBeNull()
  expect(stored.updated_at).toBeTruthy()
  expect(stored.marketing).toBe(true)

  const publicConfig = await getPublicConfig(page)
  const adsEnabled = publicConfig?.adsEnabled === true

  if (adsEnabled) {
    await expect(page.locator('script[src*="ezojs.com/ezoic/sa.min.js"]')).toHaveCount(1)
    await expect.poll(async () => {
      return await page.evaluate(() => typeof (window as any).ezstandalone !== 'undefined')
    }).toBe(true)
    await expect(page.locator('script[src*="redditstatic.com/ads/v2.0/rdtag.js"]')).toHaveCount(1)
    await expect.poll(async () => {
      return await page.evaluate(() => typeof (window as any).rdt === 'function')
    }).toBe(true)
    await expect(page.locator('script[src*="static.ads-twitter.com/uwt.js"]')).toHaveCount(1)
    await expect.poll(async () => {
      return await page.evaluate(() => typeof (window as any).twq === 'function')
    }).toBe(true)
  }
})

test('reject non-essential keeps marketing disabled', async ({ page }) => {
  await stubGeo(page, 'DE')
  await page.goto('/')

  await expect(page.getByText('Ads keep the free plan free')).toBeVisible()

  await page.getByRole('button', { name: 'Reject non-essential' }).click()
  await expect(page.getByText('Ads keep the free plan free')).toHaveCount(0)

  const stored = await page.evaluate(() => {
    const raw = window.localStorage.getItem('rs:privacy:settings')
    return raw ? JSON.parse(raw) : null
  })
  expect(stored).not.toBeNull()
  expect(stored.updated_at).toBeTruthy()
  expect(stored.marketing).toBe(false)
  expect(stored.analytics).toBe(false)
  expect(stored.personalization).toBe(false)

  const after = await page.evaluate(() => {
    return {
      ezoicScript: Boolean(document.querySelector('script[src*="ezojs.com/ezoic/sa.min.js"]')),
      ezstandalone: typeof (window as any).ezstandalone !== 'undefined',
      attribution: window.localStorage.getItem('rs:attribution'),
      redditPixelScript: Boolean(document.querySelector('script[src*="redditstatic.com/ads/v2.0/rdtag.js"]')),
      hasRdt: typeof (window as any).rdt === 'function',
      xPixelScript: Boolean(document.querySelector('script[src*="static.ads-twitter.com/uwt.js"]')),
      hasTwq: typeof (window as any).twq === 'function',
    }
  })

  expect(after.ezoicScript).toBe(false)
  expect(after.ezstandalone).toBe(false)
  expect(after.attribution).toBeNull()
  expect(after.redditPixelScript).toBe(false)
  expect(after.hasRdt).toBe(false)
  expect(after.xPixelScript).toBe(false)
  expect(after.hasTwq).toBe(false)
})

test('outside EEA/UK: banner does not auto-show; cookie settings entry is still available', async ({ page }) => {
  await stubGeo(page, 'US')
  await page.goto('/')

  await expect(page.getByText('Ads keep the free plan free')).toHaveCount(0)

  const cookieSettings = page.getByRole('button', { name: 'Cookie settings' })
  await cookieSettings.scrollIntoViewIfNeeded()
  await cookieSettings.click()

  await expect(page.getByText('Cookie preferences')).toBeVisible()
})
