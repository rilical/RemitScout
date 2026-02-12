import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockGetUserPlan = vi.fn()

const mockAlertRepository = {
  findByWatchlistItemAndRule: vi.fn(),
  countByUserId: vi.fn(),
  create: vi.fn(),
}

const mockWatchlistRepository = {
  findById: vi.fn(),
  findByTarget: vi.fn(),
  countByUserId: vi.fn(),
  create: vi.fn(),
}

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: vi.fn(),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
  requireEntitlement: () => () => undefined,
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
  ensureUserPlan: vi.fn(),
  updatePlanFromStripe: vi.fn(),
}))

vi.mock('../plane-a/src/repositories', () => ({
  AlertRepository: vi.fn().mockImplementation(() => mockAlertRepository),
  WatchlistRepository: vi.fn().mockImplementation(() => mockWatchlistRepository),
  RightsMatrixRepository: vi.fn().mockImplementation(() => ({
    listActiveB2cProvidersByCountry: vi.fn().mockResolvedValue([]),
  })),
  ComparisonHistoryRepository: vi.fn().mockImplementation(() => ({})),
}))

describe('effective plan limits (inactive plus behaves as free)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserPlan.mockReset()
    mockAlertRepository.findByWatchlistItemAndRule.mockReset()
    mockAlertRepository.countByUserId.mockReset()
    mockAlertRepository.create.mockReset()
    mockWatchlistRepository.findById.mockReset()
    mockWatchlistRepository.findByTarget.mockReset()
    mockWatchlistRepository.countByUserId.mockReset()
    mockWatchlistRepository.create.mockReset()
  })

  it('alerts quota uses effective plan (canceled Plus = Free limit 1)', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u-test',
      plan_code: 'plus',
      status: 'canceled',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })
    mockWatchlistRepository.findById.mockResolvedValue({
      id: 'w-1',
      target_type: 'fxPair',
      target_payload: { base: 'USD', quote: 'PHP' },
    })
    mockAlertRepository.findByWatchlistItemAndRule.mockResolvedValue(null)
    mockAlertRepository.countByUserId.mockResolvedValue(1)

    const app = { post: vi.fn(), get: vi.fn(), delete: vi.fn(), patch: vi.fn() } as any as FastifyInstance
    const { alertsRoutes } = await import('../plane-a/src/routes/alerts')
    await alertsRoutes(app)

    const handler = vi.mocked(app.post).mock.calls.find((c) => c[0] === '/alerts')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis() } as any
    const result = await handler(
      {
        user: { user_id: 'u-test' },
        body: {
          watchlistItemId: '00000000-0000-0000-0000-000000000001',
          rule: { metric: 'rate', comparator: 'gt', value: 1 },
          frequency: 'weekly',
          enabled: true,
        },
      } as any,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(result.error).toBe('limit_reached')
    expect(result.limit).toBe(1)
    expect(result.message).toContain('Free plan supports up to 1 alert')
    expect(mockAlertRepository.create).not.toHaveBeenCalled()
  })

  it('watchlist quota uses effective plan (canceled Plus = Free limit 3)', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u-test',
      plan_code: 'plus',
      status: 'canceled',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })
    mockWatchlistRepository.findByTarget.mockResolvedValue(null)
    mockWatchlistRepository.countByUserId.mockResolvedValue(3)

    const app = { post: vi.fn(), get: vi.fn(), delete: vi.fn(), patch: vi.fn() } as any as FastifyInstance
    const { watchlistRoutes } = await import('../plane-a/src/routes/watchlist')
    await watchlistRoutes(app)

    const handler = vi.mocked(app.post).mock.calls.find((c) => c[0] === '/watchlist')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis() } as any
    const result = await handler(
      {
        user: { user_id: 'u-test' },
        body: { target: { type: 'fxPair', base: 'USD', quote: 'PHP' } },
      } as any,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(result.error).toBe('limit_reached')
    expect(result.limit).toBe(3)
    expect(result.message).toContain('Free plan supports up to 3 saved item')
    expect(mockWatchlistRepository.create).not.toHaveBeenCalled()
  })

  it('history maxDays uses effective plan (canceled Plus = Free max 30d)', async () => {
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u-test',
      plan_code: 'plus',
      status: 'canceled',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })

    const app = { get: vi.fn(), post: vi.fn() } as any as FastifyInstance
    const { historyRoutes } = await import('../plane-a/src/routes/history')
    await historyRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((c) => c[0] === '/history/corridor')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() } as any
    const result = await handler(
      {
        user: { user_id: 'u-test' },
        query: {
          corridor_id: 'US-PH-USD-PHP',
          from_date: '2026-01-01',
          to_date: '2026-02-01',
          granularity: 'daily',
        },
      } as any,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(result.error).toBe('history_range_exceeded')
    expect(result.maxDays).toBe(30)
  })
})
