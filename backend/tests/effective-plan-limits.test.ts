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

vi.mock('../plane-a/src/services/user-account', () => ({
  upsertUserAccount: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../plane-a/src/repositories', () => ({
  AlertRepository: vi.fn().mockImplementation(() => mockAlertRepository),
  WatchlistRepository: vi.fn().mockImplementation(() => mockWatchlistRepository),
  RightsMatrixRepository: vi.fn().mockImplementation(() => ({
    listActiveB2cProvidersByCountry: vi.fn().mockResolvedValue([]),
  })),
  ComparisonHistoryRepository: vi.fn().mockImplementation(() => ({})),
}))

vi.mock('../plane-a/src/container', () => ({
  planeAContainer: {
    pool: { query: vi.fn() },
    repositories: {
      alert: mockAlertRepository,
      watchlist: mockWatchlistRepository,
      rightsMatrix: {
        listActiveB2cProvidersByCountry: vi.fn().mockResolvedValue([]),
      },
    },
  },
}))

const makeApp = () =>
  ({
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    container: {
      pool: { query: vi.fn() },
      repositories: {
        watchlist: mockWatchlistRepository,
        comparisonHistory: {
          listByUserId: vi.fn().mockResolvedValue([]),
          create: vi.fn(),
        },
      },
    },
  }) as any as FastifyInstance

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

    const app = makeApp()
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

    const app = makeApp()
    const { historyRoutes } = await import('../plane-a/src/routes/history')
    await historyRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((c) => c[0] === '/history/corridor')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() } as any
    const result = await handler(
      {
        user: { user_id: 'u-test' },
        entitlementsContext: {
          entitlements: {
            history_max_days: 30,
          },
        },
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
