import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { RateLimitError, ValidationError } from '../shared/errors'

const mockGetByUserAndLimit = vi.fn()
const mockUpsertRecent = vi.fn()
const mockTrimUserSearches = vi.fn()
const mockGetRedisClient = vi.fn()
const mockRequireAuth = vi.fn(() => () => undefined)

vi.mock('../plane-a/src/container', () => ({
  planeAContainer: {
    repositories: {
      recentSearch: {
        getByUserAndLimit: (...args: any[]) => mockGetByUserAndLimit(...args),
        upsertRecent: (...args: any[]) => mockUpsertRecent(...args),
        trimUserSearches: (...args: any[]) => mockTrimUserSearches(...args),
      },
    },
  },
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: (...args: any[]) => mockGetRedisClient(...args),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
}))

const makeApp = () => ({
  get: vi.fn(),
  post: vi.fn(),
}) as unknown as FastifyInstance

const getHandler = (
  app: FastifyInstance,
  method: 'get' | 'post',
  url: string,
) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('recent-searches route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRedisClient.mockResolvedValue(null)
  })

  it('registers auth preHandlers for list/create', async () => {
    const app = makeApp()
    const { recentSearchRoutes } = await import('../plane-a/src/routes/recent-searches')
    await recentSearchRoutes(app)

    const listCall = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/recent-searches')
    const createCall = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === '/recent-searches')

    expect(listCall?.[1]).toMatchObject({ preHandler: expect.any(Function) })
    expect(createCall?.[1]).toMatchObject({ preHandler: expect.any(Function) })
  })

  it('validates list query', async () => {
    const app = makeApp()
    const { recentSearchRoutes } = await import('../plane-a/src/routes/recent-searches')
    await recentSearchRoutes(app)

    const handler = getHandler(app, 'get', '/recent-searches')
    await expect(handler({ user: { user_id: 'u-1' }, query: { limit: 999 } }, {} as any)).rejects.toBeInstanceOf(ValidationError)
  })

  it('returns rate limit error when post limit is exceeded', async () => {
    mockGetRedisClient.mockResolvedValue({
      incr: vi.fn().mockResolvedValue(101),
      expire: vi.fn().mockResolvedValue(1),
    })

    const app = makeApp()
    const { recentSearchRoutes } = await import('../plane-a/src/routes/recent-searches')
    await recentSearchRoutes(app)

    const handler = getHandler(app, 'post', '/recent-searches')
    await expect(
      handler(
        {
          user: { user_id: 'u-1' },
          body: {
            from_country: 'us',
            to_country: 'mx',
            amount: 200,
            method: 'bank',
          },
        },
        {} as any,
      ),
    ).rejects.toBeInstanceOf(RateLimitError)
  })

  it('creates and trims recent searches', async () => {
    mockUpsertRecent.mockResolvedValue({
      id: 's-1',
      from_country: 'US',
      to_country: 'MX',
      amount: 200,
      method: 'bank',
      best_provider_name: 'Wise',
      best_provider_recipient: 3780,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    })
    mockTrimUserSearches.mockResolvedValue(undefined)

    const app = makeApp()
    const { recentSearchRoutes } = await import('../plane-a/src/routes/recent-searches')
    await recentSearchRoutes(app)

    const handler = getHandler(app, 'post', '/recent-searches')
    const response = await handler(
      {
        user: { user_id: 'u-1' },
        body: {
          from_country: 'us',
          to_country: 'mx',
          amount: 200,
          method: 'bank',
        },
      },
      {} as any,
    )

    expect(mockUpsertRecent).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u-1', from_country: 'US', to_country: 'MX' }),
      5,
    )
    expect(mockTrimUserSearches).toHaveBeenCalledWith('u-1', 50)
    expect(response.success).toBe(true)
    expect(response.search?.bestProvider?.name).toBe('Wise')
  })
})
