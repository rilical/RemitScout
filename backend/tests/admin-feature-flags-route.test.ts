import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { NotFoundError } from '../shared/errors'

const mockListFeatureFlags = vi.hoisted(() => vi.fn())
const mockGetFeatureFlag = vi.hoisted(() => vi.fn())
const mockCreateFeatureFlag = vi.hoisted(() => vi.fn())
const mockUpdateFeatureFlag = vi.hoisted(() => vi.fn())
const mockListFeatureFlagHistory = vi.hoisted(() => vi.fn())

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
}))

vi.mock('../plane-a/src/services/feature-flags', () => ({
  listFeatureFlags: (...args: unknown[]) => mockListFeatureFlags(...args),
  getFeatureFlag: (...args: unknown[]) => mockGetFeatureFlag(...args),
  createFeatureFlag: (...args: unknown[]) => mockCreateFeatureFlag(...args),
  updateFeatureFlag: (...args: unknown[]) => mockUpdateFeatureFlag(...args),
  listFeatureFlagHistory: (...args: unknown[]) => mockListFeatureFlagHistory(...args),
}))

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    container: {
      pool: {},
    },
  }) as unknown as FastifyInstance

const getHandler = (
  app: FastifyInstance,
  method: 'get' | 'post' | 'patch',
  url: string,
) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply?: any) => Promise<any>)
}

describe('admin feature flags routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists feature flags', async () => {
    const app = makeApp()
    const { adminFeatureFlagsRoutes } = await import('../plane-a/src/routes/admin-feature-flags')
    await adminFeatureFlagsRoutes(app)

    mockListFeatureFlags.mockResolvedValue([
      { key: 'ops.new_pipeline', enabled: false },
    ])

    const handler = getHandler(app, 'get', '/admin/feature-flags')
    const response = await handler({})

    expect(response).toEqual({
      flags: [{ key: 'ops.new_pipeline', enabled: false }],
    })
    expect(mockListFeatureFlags).toHaveBeenCalled()
  })

  it('creates a feature flag', async () => {
    const app = makeApp()
    const { adminFeatureFlagsRoutes } = await import('../plane-a/src/routes/admin-feature-flags')
    await adminFeatureFlagsRoutes(app)

    mockGetFeatureFlag.mockResolvedValue(null)
    mockCreateFeatureFlag.mockResolvedValue({
      key: 'ops.new_pipeline',
      enabled: true,
      audience_rules: { global: true },
      metadata: {},
    })

    const handler = getHandler(app, 'post', '/admin/feature-flags')
    const reply = { code: vi.fn().mockReturnThis() }
    const response = await handler(
      {
        user: { user_id: '00000000-0000-4000-8000-000000000111' },
        body: {
          key: 'ops.new_pipeline',
          enabled: true,
          audience_rules: { global: true },
        },
      },
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(201)
    expect(response).toMatchObject({
      flag: {
        key: 'ops.new_pipeline',
        enabled: true,
      },
    })
  })

  it('returns not found when updating non-existing flag', async () => {
    const app = makeApp()
    const { adminFeatureFlagsRoutes } = await import('../plane-a/src/routes/admin-feature-flags')
    await adminFeatureFlagsRoutes(app)

    mockUpdateFeatureFlag.mockResolvedValue(null)

    const handler = getHandler(app, 'patch', '/admin/feature-flags/:key')
    await expect(handler({
      user: { user_id: '00000000-0000-4000-8000-000000000111' },
      params: { key: 'missing.flag' },
      body: { enabled: true },
    })).rejects.toBeInstanceOf(NotFoundError)
  })

  it('returns flag history', async () => {
    const app = makeApp()
    const { adminFeatureFlagsRoutes } = await import('../plane-a/src/routes/admin-feature-flags')
    await adminFeatureFlagsRoutes(app)

    mockGetFeatureFlag.mockResolvedValue({
      key: 'ops.new_pipeline',
      enabled: false,
    })
    mockListFeatureFlagHistory.mockResolvedValue([
      { id: 1, action: 'created', changed_by: '00000000-0000-4000-8000-000000000111' },
    ])

    const handler = getHandler(app, 'get', '/admin/feature-flags/:key/history')
    const response = await handler({
      params: { key: 'ops.new_pipeline' },
      query: { limit: 50 },
    })

    expect(response).toMatchObject({
      flag: { key: 'ops.new_pipeline' },
      history: [{ id: 1, action: 'created' }],
    })
  })
})
