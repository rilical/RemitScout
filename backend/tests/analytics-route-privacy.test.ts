import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

const mockRepository = {
  getPopularCorridors: vi.fn(),
  getCorridorTrends: vi.fn(),
  getFavoriteProviders: vi.fn(),
  getProviderImpactSummary: vi.fn(),
  getProviderCorridorImpact: vi.fn(),
  getProviderClickThroughRates: vi.fn(),
  getEngagementMetrics: vi.fn(),
  getSessionMetrics: vi.fn(),
  getGeographicHeatmap: vi.fn(),
  getSavingsMetrics: vi.fn(),
  getUserBehaviorPatterns: vi.fn(),
  getRevenueMetrics: vi.fn(),
}

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
}))

const makeApp = () =>
  ({
    get: vi.fn(),
    container: {
      repositories: {
        analytics: mockRepository,
      },
    },
  }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('analytics routes privacy controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository.getPopularCorridors.mockResolvedValue([])
    mockRepository.getCorridorTrends.mockResolvedValue([])
    mockRepository.getFavoriteProviders.mockResolvedValue([])
    mockRepository.getProviderImpactSummary.mockResolvedValue([])
    mockRepository.getProviderCorridorImpact.mockResolvedValue([])
    mockRepository.getProviderClickThroughRates.mockResolvedValue([])
    mockRepository.getEngagementMetrics.mockResolvedValue([])
    mockRepository.getSessionMetrics.mockResolvedValue({
      total_sessions: 0,
      unique_users: 0,
      avg_session_duration: 0,
      avg_searches_per_session: 0,
      bounce_rate: 0,
    })
    mockRepository.getGeographicHeatmap.mockResolvedValue([])
    mockRepository.getSavingsMetrics.mockResolvedValue({ summary: {}, by_corridor: [] })
    mockRepository.getUserBehaviorPatterns.mockResolvedValue([])
    mockRepository.getRevenueMetrics.mockResolvedValue([])
  })

  it('rejects city-level aggregation', async () => {
    const app = makeApp()
    const { analyticsRoutes } = await import('../plane-a/src/routes/analytics')
    await analyticsRoutes(app)

    const handler = getHandler(app, '/analytics/heatmap')
    await expect(
      handler(
        {
          query: {
            start_date: '2026-02-01T00:00:00.000Z',
            end_date: '2026-02-10T00:00:00.000Z',
            aggregation: 'city',
          },
        },
        {} as any,
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects trend requests below minimum lookback', async () => {
    const app = makeApp()
    const { analyticsRoutes } = await import('../plane-a/src/routes/analytics')
    await analyticsRoutes(app)

    const handler = getHandler(app, '/analytics/corridors/trends')
    await expect(
      handler(
        {
          query: {
            start_date: '2026-02-10T00:00:00.000Z',
            end_date: '2026-02-12T00:00:00.000Z',
            bucket: 'day',
          },
        },
        {} as any,
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('returns privacy metadata for corridor analytics', async () => {
    const app = makeApp()
    const { analyticsRoutes } = await import('../plane-a/src/routes/analytics')
    await analyticsRoutes(app)

    const handler = getHandler(app, '/analytics/corridors')
    const result = await handler(
      {
        query: {
          start_date: '2026-02-01T00:00:00.000Z',
          end_date: '2026-02-10T00:00:00.000Z',
        },
      },
      {} as any,
    )

    expect(result).toMatchObject({
      corridors: [],
      privacy: {
        applied: true,
        minUniqueUsers: expect.any(Number),
      },
      aggregationWindow: {
        minDatapoints24h: expect.any(Number),
        minProviderQuotesPerCorridor: expect.any(Number),
        minTrendLookbackDays: expect.any(Number),
      },
    })
  })
})

