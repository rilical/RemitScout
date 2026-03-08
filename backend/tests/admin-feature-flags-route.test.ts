import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { NotFoundError } from '../shared/errors'

const mockListFeatureFlags = vi.hoisted(() => vi.fn())
const mockGetFeatureFlag = vi.hoisted(() => vi.fn())
const mockCreateFeatureFlag = vi.hoisted(() => vi.fn())
const mockUpdateFeatureFlag = vi.hoisted(() => vi.fn())
const mockListFeatureFlagHistory = vi.hoisted(() => vi.fn())
const mockGetEffectiveRuntimeFlags = vi.hoisted(() => vi.fn())
const mockGetRuntimeFlagDefinitions = vi.hoisted(() => vi.fn())
const mockEnsureUserPlan = vi.hoisted(() => vi.fn())
const mockGetUserPlan = vi.hoisted(() => vi.fn())
const mockResolveEffectiveEntitlements = vi.hoisted(() => vi.fn())

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
  requireSuperAdmin: () => () => undefined,
}))

vi.mock('../plane-a/src/services/feature-flags', () => ({
  listFeatureFlags: (...args: unknown[]) => mockListFeatureFlags(...args),
  getFeatureFlag: (...args: unknown[]) => mockGetFeatureFlag(...args),
  createFeatureFlag: (...args: unknown[]) => mockCreateFeatureFlag(...args),
  updateFeatureFlag: (...args: unknown[]) => mockUpdateFeatureFlag(...args),
  listFeatureFlagHistory: (...args: unknown[]) => mockListFeatureFlagHistory(...args),
  getEffectiveRuntimeFlags: (...args: unknown[]) => mockGetEffectiveRuntimeFlags(...args),
  getRuntimeFlagDefinitions: (...args: unknown[]) => mockGetRuntimeFlagDefinitions(...args),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: (...args: unknown[]) => mockEnsureUserPlan(...args),
  getUserPlan: (...args: unknown[]) => mockGetUserPlan(...args),
}))

vi.mock('../plane-a/src/services/effective-entitlements', () => ({
  resolveEffectiveEntitlements: (...args: unknown[]) => mockResolveEffectiveEntitlements(...args),
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
    mockGetRuntimeFlagDefinitions.mockReturnValue([
      { key: 'pulse.public', label: 'Pulse public rollout' },
    ])
    mockGetEffectiveRuntimeFlags.mockResolvedValue({
      generated_at: '2026-03-07T12:00:00.000Z',
      flags: [
        {
          key: 'pulse.public',
          label: 'Pulse public rollout',
          description: 'Controls Pulse visibility.',
          enabled: false,
          source: 'bootstrap_default',
          reason: 'Using bootstrap.',
          hard_gate_enabled: true,
          bootstrap_enabled: false,
          plan_code: 'free',
          pulse_access: 'none',
          matched_audience_rules: true,
          db_flag: null,
        },
      ],
    })
    mockResolveEffectiveEntitlements.mockResolvedValue({
      effectivePlanCode: 'free',
      entitlements: { pulse_access: 'none' },
    })
  })

  it('lists feature flags with runtime snapshot', async () => {
    const app = makeApp()
    const { adminFeatureFlagsRoutes } = await import('../plane-a/src/routes/admin-feature-flags')
    await adminFeatureFlagsRoutes(app)

    mockListFeatureFlags.mockResolvedValue([
      { key: 'pulse.public', enabled: false },
    ])

    const handler = getHandler(app, 'get', '/admin/feature-flags')
    const response = await handler({})

    expect(response).toEqual({
      flags: [{ key: 'pulse.public', enabled: false }],
      runtime: expect.objectContaining({
        generated_at: '2026-03-07T12:00:00.000Z',
        flags: expect.any(Array),
      }),
      definitions: [{ key: 'pulse.public', label: 'Pulse public rollout' }],
    })
    expect(mockListFeatureFlags).toHaveBeenCalled()
    expect(mockGetEffectiveRuntimeFlags).toHaveBeenCalled()
  })

  it('returns effective runtime flags for the public resolver endpoint', async () => {
    const app = makeApp()
    const { adminFeatureFlagsRoutes } = await import('../plane-a/src/routes/admin-feature-flags')
    await adminFeatureFlagsRoutes(app)

    const handler = getHandler(app, 'get', '/feature-flags/effective')
    const response = await handler({
      user: {
        user_id: '00000000-0000-4000-8000-000000000111',
        email: 'ops@remit-scout.com',
        role: 'admin',
        is_admin: true,
      },
    })

    expect(mockEnsureUserPlan).toHaveBeenCalled()
    expect(mockResolveEffectiveEntitlements).toHaveBeenCalled()
    expect(response).toEqual({
      generated_at: '2026-03-07T12:00:00.000Z',
      flags: [{ key: 'pulse.public', enabled: false }],
      definitions: [{ key: 'pulse.public', label: 'Pulse public rollout' }],
    })
  })

  it('creates a feature flag', async () => {
    const app = makeApp()
    const { adminFeatureFlagsRoutes } = await import('../plane-a/src/routes/admin-feature-flags')
    await adminFeatureFlagsRoutes(app)

    mockGetFeatureFlag.mockResolvedValue(null)
    mockCreateFeatureFlag.mockResolvedValue({
      key: 'pulse.public',
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
          key: 'pulse.public',
          enabled: true,
          audience_rules: { global: true },
        },
      },
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(201)
    expect(response).toMatchObject({
      flag: {
        key: 'pulse.public',
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
      key: 'pulse.public',
      enabled: false,
    })
    mockListFeatureFlagHistory.mockResolvedValue([
      { id: 1, action: 'created', changed_by: '00000000-0000-4000-8000-000000000111' },
    ])

    const handler = getHandler(app, 'get', '/admin/feature-flags/:key/history')
    const response = await handler({
      params: { key: 'pulse.public' },
      query: { limit: 50 },
    })

    expect(response).toMatchObject({
      flag: { key: 'pulse.public' },
      history: [{ id: 1, action: 'created' }],
    })
  })
})
