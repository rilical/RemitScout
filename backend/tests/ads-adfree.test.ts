import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockQuery = vi.fn()
const mockEnsureUserPlan = vi.fn()
const mockGetUserPlan = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: (...args: any[]) => mockEnsureUserPlan(...args),
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
  updatePlanFromStripe: vi.fn(),
}))

describe('ads (ad-free enforcement)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockReset()
    mockEnsureUserPlan.mockReset()
    mockGetUserPlan.mockReset()
  })

  it('returns ad:null for active Plus and does not write impressions', async () => {
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

    const handler = vi.mocked(app.get).mock.calls.find((c) => c[0] === '/ads/placement')?.[1] as any
    const reply = { code: vi.fn().mockReturnThis() } as any
    const result = await handler(
      { query: { placement: 'home_hero' }, user: { user_id: 'u-test' } } as any,
      reply,
    )

    expect(result).toEqual({ ad: null })
    expect(mockQuery).not.toHaveBeenCalled()
  })
})
