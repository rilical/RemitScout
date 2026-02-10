import { test, expect, type Page } from '@playwright/test'

const getPublicConfig = async (page: Page) => {
  return await page.evaluate(() => {
    const nuxt = (window as any).__NUXT__
    return nuxt?.config?.public ?? null
  })
}

test('cookie banner shows; accept enables marketing gating', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Ads keep the free plan free')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept & support Remit-Scout' })).toBeVisible()

  const before = await page.evaluate(() => {
    return {
      privacy: window.localStorage.getItem('rs:privacy:settings'),
      ezoicScript: Boolean(document.querySelector('script[src*="ezojs.com/ezoic/sa.min.js"]')),
      ezstandalone: typeof (window as any).ezstandalone !== 'undefined',
      attribution: window.localStorage.getItem('rs:attribution'),
    }
  })

  expect(before.privacy).toBeNull()
  expect(before.ezoicScript).toBe(false)
  expect(before.ezstandalone).toBe(false)
  expect(before.attribution).toBeNull()

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
  }
})

test('reject non-essential keeps marketing disabled', async ({ page }) => {
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
    }
  })

  expect(after.ezoicScript).toBe(false)
  expect(after.ezstandalone).toBe(false)
  expect(after.attribution).toBeNull()
})
