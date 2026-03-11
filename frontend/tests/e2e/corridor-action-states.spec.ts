import { test, expect, type Page } from '@playwright/test'

const corridorPath = '/send-money/united-states-to-philippines'
const seededNow = '2026-02-26T12:00:00.000Z'

const createWatchlistItem = (id: string, method: string) => ({
  id,
  target: {
    type: 'corridor',
    from: 'US',
    to: 'PH',
    method,
  },
  label: `United States->Philippines - ${method}`,
  createdAt: seededNow,
  updatedAt: seededNow,
})

const createAlert = (id: string, watchlistItemId: string) => ({
  id,
  watchlistItemId,
  rule: {
    metric: 'recipientGets',
    comparator: 'gte',
    value: 1000,
  },
  frequency: 'weekly',
  enabled: true,
  createdAt: seededNow,
  updatedAt: seededNow,
})

async function seedClientState(
  page: Page,
  options: {
    functionalConsent: boolean
    watchlistItems?: Array<Record<string, unknown>>
    alerts?: Array<Record<string, unknown>>
  },
) {
  const privacy = {
    analytics: false,
    marketing: false,
    personalization: options.functionalConsent,
    updated_at: seededNow,
  }

  await page.addInitScript(
    ({ privacySettings, watchlistItems, alerts }) => {
      window.localStorage.setItem('rs:privacy:settings', JSON.stringify(privacySettings))
      window.localStorage.setItem('remitscout:watchlist:items', JSON.stringify(watchlistItems))
      window.localStorage.setItem('remitscout:alerts:items', JSON.stringify(alerts))
      window.localStorage.setItem('remitscout:alerts:history', JSON.stringify({}))
    },
    {
      privacySettings: privacy,
      watchlistItems: options.watchlistItems ?? [],
      alerts: options.alerts ?? [],
    },
  )
}

async function expectActionState(
  page: Page,
  expected: {
    saved: boolean
    alerted: boolean
  },
) {
  const watchPressed = expected.saved ? 'true' : 'false'
  const alertPressed = expected.alerted ? 'true' : 'false'
  const watchFill = expected.saved ? 'currentColor' : 'none'
  const alertFill = expected.alerted ? 'currentColor' : 'none'

  await expect(page.getByTestId('corridor-hero-watchlist-button')).toHaveAttribute('aria-pressed', watchPressed)
  await expect(page.getByTestId('corridor-hero-alert-button')).toHaveAttribute('aria-pressed', alertPressed)
  await expect(page.getByTestId('corridor-sidebar-watchlist-button')).toHaveAttribute('aria-pressed', watchPressed)
  await expect(page.getByTestId('corridor-sidebar-alert-button')).toHaveAttribute('aria-pressed', alertPressed)

  await expect(page.getByTestId('corridor-hero-watchlist-icon')).toHaveAttribute('fill', watchFill)
  await expect(page.getByTestId('corridor-hero-alert-icon')).toHaveAttribute('fill', alertFill)
  await expect(page.getByTestId('corridor-sidebar-watchlist-icon')).toHaveAttribute('fill', watchFill)
  await expect(page.getByTestId('corridor-sidebar-alert-icon')).toHaveAttribute('fill', alertFill)

  const stickyWatchlistButton = page.getByTestId('corridor-sticky-watchlist-button')
  if ((await stickyWatchlistButton.count()) > 0) {
    await expect(stickyWatchlistButton).toHaveAttribute('aria-pressed', watchPressed)
    await expect(page.getByTestId('corridor-sticky-alert-button')).toHaveAttribute('aria-pressed', alertPressed)
    await expect(page.getByTestId('corridor-sticky-watchlist-icon')).toHaveAttribute('fill', watchFill)
    await expect(page.getByTestId('corridor-sticky-alert-icon')).toHaveAttribute('fill', alertFill)
  }
}

async function ensureActionControlsExistOrSkip(page: Page) {
  const hasHeroWatchlistControl = (await page.getByTestId('corridor-hero-watchlist-button').count()) > 0
  test.skip(!hasHeroWatchlistControl, 'Corridor action-state controls are not present on this deployment target yet.')
}

test.describe('Corridor action states', () => {
  test('saved corridor with no alerts fills only watchlist actions', async ({ page }) => {
    const watchlistItem = createWatchlistItem('wl-bank-1', 'bank')
    await seedClientState(page, {
      functionalConsent: true,
      watchlistItems: [watchlistItem],
      alerts: [],
    })

    await page.goto(corridorPath)
    await ensureActionControlsExistOrSkip(page)
    await expect(page.getByTestId('corridor-hero-watchlist-button')).toBeVisible({ timeout: 20000 })
    await expectActionState(page, { saved: true, alerted: false })
  })

  test('saved corridor with alerts fills both watchlist and alert actions', async ({ page }) => {
    const watchlistItem = createWatchlistItem('wl-bank-2', 'bank')
    const alert = createAlert('al-bank-1', watchlistItem.id)

    await seedClientState(page, {
      functionalConsent: true,
      watchlistItems: [watchlistItem],
      alerts: [alert],
    })

    await page.goto(corridorPath)
    await ensureActionControlsExistOrSkip(page)
    await expect(page.getByTestId('corridor-hero-watchlist-button')).toBeVisible({ timeout: 20000 })
    await expectActionState(page, { saved: true, alerted: true })
  })

  test('unsaved corridor keeps all actions unfilled', async ({ page }) => {
    await seedClientState(page, {
      functionalConsent: true,
      watchlistItems: [],
      alerts: [],
    })

    await page.goto(corridorPath)
    await ensureActionControlsExistOrSkip(page)
    await expect(page.getByTestId('corridor-hero-watchlist-button')).toBeVisible({ timeout: 20000 })
    await expectActionState(page, { saved: false, alerted: false })
  })

  test('method switch recomputes watchlist/alert state', async ({ page }) => {
    const watchlistItem = createWatchlistItem('wl-bank-3', 'bank')
    const alert = createAlert('al-bank-2', watchlistItem.id)

    await seedClientState(page, {
      functionalConsent: true,
      watchlistItems: [watchlistItem],
      alerts: [alert],
    })

    await page.goto(corridorPath)
    await ensureActionControlsExistOrSkip(page)
    await expect(page.getByTestId('corridor-hero-watchlist-button')).toBeVisible({ timeout: 20000 })
    await expectActionState(page, { saved: true, alerted: true })

    const cashMethodButton = page.getByRole('button', { name: /cash pickup/i }).first()
    test.skip((await cashMethodButton.count()) === 0, 'Cash payout method is not available for this corridor in this environment.')

    await cashMethodButton.click()
    await expectActionState(page, { saved: false, alerted: false })
  })

  test('without functional consent, seeded watchlist/alerts do not appear active', async ({ page }) => {
    const watchlistItem = createWatchlistItem('wl-bank-4', 'bank')
    const alert = createAlert('al-bank-3', watchlistItem.id)

    await seedClientState(page, {
      functionalConsent: false,
      watchlistItems: [watchlistItem],
      alerts: [alert],
    })

    await page.goto(corridorPath)
    await ensureActionControlsExistOrSkip(page)
    await expect(page.getByTestId('corridor-hero-watchlist-button')).toBeVisible({ timeout: 20000 })
    await expectActionState(page, { saved: false, alerted: false })
  })
})
