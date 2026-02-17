import { test, expect } from '@playwright/test'

const seedPrivacySettings = async (page: any, settings: any) => {
  await page.addInitScript(({ settings }: { settings: unknown }) => {
    window.localStorage.setItem('rs:privacy:settings', JSON.stringify(settings))
  }, { settings })
}

test('welcome-back prompt shows only on next visit; top-right; dismiss persists 24h', async ({ page, context }) => {
  await seedPrivacySettings(page, {
    analytics: true,
    marketing: true,
    personalization: true,
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  })
  await page.goto('/')

  const corridorUrl = '/send-money/united-states-to-albania'
  const compareHistoryKey = 'remitscout:compare:history'

  // Wait until the client has hydrated and applied pre-seeded privacy settings.
  // This ensures visitStartedAtMs is initialized before we simulate a same-visit search.
  await expect(page.getByText('Ads keep the free plan free')).toHaveCount(0, { timeout: 20000 })

  // Seed a "search" in this same visit (createdAt >= visitStartedAtMs), and trigger hydration.
  await page.evaluate(({ compareHistoryKey }) => {
    const nowIso = new Date().toISOString()
    const run = {
      id: 'cmp_test_1',
      from: 'US',
      to: 'AL',
      method: 'bank',
      amount: 500,
      label: 'US→AL • bank • 500',
      createdAt: nowIso,
      path: '/send-money/united-states-to-albania',
    }
    window.localStorage.setItem(compareHistoryKey, JSON.stringify([run]))
    window.sessionStorage.setItem('rs:compare:searched_this_visit', '1')
    window.dispatchEvent(new StorageEvent('storage', { key: compareHistoryKey }))
  }, { compareHistoryKey })

  await page.goto('/about')

  // Same visit: must NOT show.
  await expect(page.getByText('Your last corridor search')).toHaveCount(0)

  // New visit (new page): prompt should show.
  const page2 = await context.newPage()
  await page2.goto('/about')

  await expect.poll(async () => {
    return await page2.evaluate(() => window.localStorage.getItem('rs:privacy:settings'))
  }).not.toBeNull()

  await expect.poll(async () => {
    return await page2.evaluate(() => window.localStorage.getItem('remitscout:compare:history'))
  }).not.toBeNull()

  const promptTitle = page2.getByText('Your last corridor search')
  await expect(promptTitle).toBeVisible()
  await expect(page2.getByRole('button', { name: 'View corridor' })).toBeVisible()

  // Clicking "View corridor" navigates and dismisses for 24h.
  await page2.getByRole('button', { name: 'View corridor' }).click()
  await expect(page2).toHaveURL(corridorUrl)

  await page2.goto('/about')
  await expect(page2.getByText('Your last corridor search')).toHaveCount(0)

  const page3 = await context.newPage()
  await page3.goto('/about')
  await expect(page3.getByText('Your last corridor search')).toHaveCount(0)
})

test('reject non-essential: welcome-back prompt never shows', async ({ page, context }) => {
  await seedPrivacySettings(page, {
    analytics: false,
    marketing: false,
    personalization: false,
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  })
  await page.goto('/')

  const compareHistoryKey = 'remitscout:compare:history'

  await page.evaluate(({ compareHistoryKey }) => {
    const oldIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const run = {
      id: 'cmp_test_2',
      from: 'US',
      to: 'AL',
      method: 'bank',
      amount: 500,
      label: 'US→AL • bank • 500',
      createdAt: oldIso,
      path: '/send-money/united-states-to-albania',
    }
    window.localStorage.setItem(compareHistoryKey, JSON.stringify([run]))
    window.dispatchEvent(new StorageEvent('storage', { key: compareHistoryKey }))
  }, { compareHistoryKey })

  await page.goto('/about')
  await expect(page.getByText('Your last corridor search')).toHaveCount(0)

  const page2 = await context.newPage()
  await page2.goto('/about')
  await expect(page2.getByText('Your last corridor search')).toHaveCount(0)
})
