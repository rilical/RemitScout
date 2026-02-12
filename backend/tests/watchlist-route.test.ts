import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

const mockRepo = {
  listByUserId: vi.fn(),
  findByTarget: vi.fn(),
  countByUserId: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  softDelete: vi.fn(),
}

const mockPoolQuery = vi.fn()
const mockGetUserPlan = vi.fn()
const mockGetEntitlementsForPlan = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({ query: mockPoolQuery }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
}))

vi.mock('../plane-a/src/services/entitlements', () => ({
  getEntitlementsForPlan: (...args: any[]) => mockGetEntitlementsForPlan(...args),
}))

vi.mock('../plane-a/src/services/plan-usage', () => ({
  upsertUsageSnapshot: vi.fn(),
}))

vi.mock('../plane-a/src/repositories', () => ({
  WatchlistRepository: vi.fn().mockImplementation(() => mockRepo),
}))

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    container: {
      pool: { query: mockPoolQuery },
      repositories: {
        watchlist: mockRepo,
      },
    },
  }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'get' | 'post' | 'patch' | 'delete', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('watchlist route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPoolQuery.mockResolvedValue({ rows: [] })
    mockGetUserPlan.mockResolvedValue({ plan_code: 'free', status: 'active' })
    mockGetEntitlementsForPlan.mockReturnValue({ watchlist_items: 3 })
    mockRepo.listByUserId.mockResolvedValue([])
    mockRepo.findByTarget.mockResolvedValue(null)
    mockRepo.countByUserId.mockResolvedValue(0)
    mockRepo.update.mockResolvedValue(null)
    mockRepo.create.mockResolvedValue({
      id: 'w-1',
      target_type: 'fxPair',
      target_payload: { base: 'USD', quote: 'MXN' },
      label: 'USD/MXN',
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockRepo.findById.mockResolvedValue(null)
    mockRepo.softDelete.mockResolvedValue(false)
  })

  it('lists watchlist items', async () => {
    mockRepo.listByUserId.mockResolvedValue([
      {
        id: 'w-1',
        target_type: 'fxPair',
        target_payload: { base: 'USD', quote: 'MXN' },
        label: 'USD/MXN',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    const app = makeApp()
    const { watchlistRoutes } = await import('../plane-a/src/routes/watchlist')
    await watchlistRoutes(app)

    const handler = getHandler(app, 'get', '/watchlist')
    const result = await handler({ user: { user_id: 'u-1' } }, { code: vi.fn().mockReturnThis() })

    expect(result.success).toBe(true)
    expect(result.items).toHaveLength(1)
  })

  it('returns already_saved on duplicate target', async () => {
    mockRepo.findByTarget.mockResolvedValue({
      id: 'w-existing',
      target_type: 'fxPair',
      target_payload: { base: 'USD', quote: 'MXN', amountBucket: 500 },
      label: 'Existing',
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockRepo.update.mockResolvedValue({
      id: 'w-existing',
      target_type: 'fxPair',
      target_payload: { base: 'USD', quote: 'MXN', amountBucket: 500 },
      label: 'Existing',
      created_at: new Date(),
      updated_at: new Date(),
    })

    const app = makeApp()
    const { watchlistRoutes } = await import('../plane-a/src/routes/watchlist')
    await watchlistRoutes(app)

    const handler = getHandler(app, 'post', '/watchlist')
    const result = await handler(
      {
        user: { user_id: 'u-1' },
        body: { target: { type: 'fxPair', base: 'USD', quote: 'MXN' } },
      },
      { code: vi.fn().mockReturnThis() },
    )

    expect(result.success).toBe(true)
    expect(result.status).toBe('already_saved')
  })

  it('enforces max watchlist item limit', async () => {
    mockRepo.countByUserId.mockResolvedValue(3)

    const app = makeApp()
    const { watchlistRoutes } = await import('../plane-a/src/routes/watchlist')
    await watchlistRoutes(app)

    const handler = getHandler(app, 'post', '/watchlist')
    const reply = { code: vi.fn().mockReturnThis() }
    const result = await handler(
      {
        user: { user_id: 'u-1' },
        body: { target: { type: 'fxPair', base: 'USD', quote: 'MXN' } },
      },
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(result.error).toBe('limit_reached')
  })

  it('registers auth preHandlers on protected routes', async () => {
    const app = makeApp()
    const { watchlistRoutes } = await import('../plane-a/src/routes/watchlist')
    await watchlistRoutes(app)

    const getCall = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/watchlist')
    const postCall = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === '/watchlist')

    expect(getCall?.[1]).toMatchObject({ preHandler: expect.any(Function) })
    expect(postCall?.[1]).toMatchObject({ preHandler: expect.any(Function) })
  })

  it('throws validation error for malformed create payload', async () => {
    const app = makeApp()
    const { watchlistRoutes } = await import('../plane-a/src/routes/watchlist')
    await watchlistRoutes(app)

    const handler = getHandler(app, 'post', '/watchlist')
    const invalidRequest = handler(
      { user: { user_id: 'u-1' }, body: {} },
      { code: vi.fn().mockReturnThis(), send: vi.fn() },
    )

    await expect(invalidRequest).rejects.toBeInstanceOf(ValidationError)
    await expect(invalidRequest).rejects.toMatchObject({
      statusCode: 400,
      code: 'validation_error',
    })
  })
})
