import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockQuery = vi.fn()
const mockEnsureUserPlan = vi.fn()
const mockGetUserPlan = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
  requireSuperAdmin: () => () => undefined,
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: (...args: any[]) => mockEnsureUserPlan(...args),
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
  updatePlanFromStripe: vi.fn(),
}))

describe('ads runtime and ad-free enforcement', () => {
  const originalPublicEnableAds = process.env.PUBLIC_ENABLE_ADS
  const originalPublicAdsEnabled = process.env.PUBLIC_ADS_ENABLED

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockReset()
    mockEnsureUserPlan.mockReset()
    mockGetUserPlan.mockReset()
    delete process.env.PUBLIC_ENABLE_ADS
    delete process.env.PUBLIC_ADS_ENABLED
  })

  afterEach(() => {
    if (originalPublicEnableAds === undefined) {
      delete process.env.PUBLIC_ENABLE_ADS
    }
    else {
      process.env.PUBLIC_ENABLE_ADS = originalPublicEnableAds
    }

    if (originalPublicAdsEnabled === undefined) {
      delete process.env.PUBLIC_ADS_ENABLED
    }
    else {
      process.env.PUBLIC_ADS_ENABLED = originalPublicAdsEnabled
    }
  })

  it('returns ad:null for active Plus and does not write impressions', async () => {
    process.env.PUBLIC_ENABLE_ADS = 'true'
    mockEnsureUserPlan.mockResolvedValue(undefined)
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u-test',
      plan_code: 'plus',
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })

    const app = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } as any as FastifyInstance
    const { adsRoutes } = await import('../plane-a/src/routes/ads')
    await adsRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((call) => call[0] === '/ads/placement')?.[1] as any
    const reply = { code: vi.fn().mockReturnThis() } as any
    const result = await handler(
      { query: { placement: 'home_inline' }, user: { user_id: 'u-test' } } as any,
      reply,
    )

    expect(result).toEqual({ ad: null })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('returns runtime-disabled metadata for placement when ads are off', async () => {
    process.env.PUBLIC_ENABLE_ADS = 'false'

    const app = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } as any as FastifyInstance
    const { adsRoutes } = await import('../plane-a/src/routes/ads')
    await adsRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((call) => call[0] === '/ads/placement')?.[1] as any
    const reply = { code: vi.fn().mockReturnThis() } as any
    const result = await handler(
      { query: { placement: 'home_inline' } } as any,
      reply,
    )

    expect(result).toEqual({
      ad: null,
      runtime: {
        runtime_enabled: false,
        source: 'env',
        mode: 'preview_only',
        reason: 'Ads runtime is disabled. Admin preview remains available for QA only.',
      },
    })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('returns preview metadata without an ad when runtime is disabled and override is not set', async () => {
    process.env.PUBLIC_ENABLE_ADS = 'false'

    const app = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } as any as FastifyInstance
    const { adsRoutes } = await import('../plane-a/src/routes/ads')
    await adsRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((call) => call[0] === '/admin/ads/preview')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis() } as any
    const result = await handler(
      {
        query: {
          placement: 'home_inline',
          seed: 'preview-1',
          simulate_plan: 'free',
          marketing_consent: 'true',
          ignore_runtime_disabled: 'false',
        },
      } as any,
      reply,
    )

    expect(result).toMatchObject({
      ad: null,
      eligible_count: 0,
      reason: 'runtime_disabled',
      runtime: {
        runtime_enabled: false,
        mode: 'preview_only',
      },
    })
  })

  it('returns an eligible preview creative when override is enabled', async () => {
    process.env.PUBLIC_ENABLE_ADS = 'false'
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'ad-1',
        name: 'House Ad',
        tagline: 'Preview creative',
        brand_color: '#2563EB',
        url: 'https://example.com/ad',
        cta_text: 'Learn more',
        rating: null,
        review_count: null,
        logo_letter: null,
        weight: 1,
        label: null,
        is_affiliate: false,
        provider_id: null,
        kind: 'house',
        placement: 'home_inline',
        layout: 'horizontal',
      }],
    })

    const app = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } as any as FastifyInstance
    const { adsRoutes } = await import('../plane-a/src/routes/ads')
    await adsRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((call) => call[0] === '/admin/ads/preview')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis() } as any
    const result = await handler(
      {
        query: {
          placement: 'home_inline',
          seed: 'preview-1',
          simulate_plan: 'free',
          marketing_consent: 'true',
          ignore_runtime_disabled: 'true',
        },
      } as any,
      reply,
    )

    expect(result).toMatchObject({
      eligible_count: 1,
      reason: 'preview_override',
      runtime: {
        runtime_enabled: false,
      },
      ad: {
        id: 'ad-1',
        name: 'House Ad',
        placement: 'home_inline',
      },
    })
  })
})
