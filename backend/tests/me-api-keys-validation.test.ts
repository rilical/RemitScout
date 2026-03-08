import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

const mockCountActiveApiKeys = vi.fn()
const mockCreateApiKey = vi.fn()

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
}))

vi.mock('../plane-a/src/services/user-account', () => ({
  upsertUserAccount: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: vi.fn().mockResolvedValue(undefined),
  getUserPlan: vi.fn().mockResolvedValue({
    user_id: 'user-1',
    plan_code: 'enterprise',
    status: 'active',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    current_period_end: null,
  }),
}))

vi.mock('../plane-a/src/services/effective-entitlements', () => ({
  resolveEffectiveEntitlements: vi.fn().mockResolvedValue({
    effectivePlanCode: 'enterprise',
    entitlements: {
      pulse_access: 'full',
      exports_enabled: true,
      history_max_days: 365,
      alerts_max: null,
      api_access: true,
      api_key_max: 5,
      api_rate_limit_rpm: 600,
      indices_exports_enabled: true,
      pulse_embeds_enabled: true,
      indices_embeds_enabled: true,
    },
    isPlanActive: true,
    internalEnterpriseOverride: false,
    lifecycleState: 'active',
    recoveryAvailable: false,
    recoveryAction: 'none',
    source: 'stored_plan',
  }),
}))

vi.mock('../plane-a/src/services/plan-usage', () => ({
  getUsageForUser: vi.fn(),
}))

vi.mock('../plane-a/src/services/api-keys', () => ({
  countActiveApiKeys: (...args: any[]) => mockCountActiveApiKeys(...args),
  createApiKey: (...args: any[]) => mockCreateApiKey(...args),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
  rotateApiKey: vi.fn(),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  getRequestContext: vi.fn().mockReturnValue({}),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    container: {
      pool: {},
      repositories: {
        userAccount: {
          getProfile: vi.fn().mockResolvedValue({ name: 'Test User' }),
        },
        exportJob: {
          listByUserId: vi.fn(),
          create: vi.fn(),
          getById: vi.fn(),
        },
      },
    },
  }) as any as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'post', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[2] as ((request: any, reply: any) => Promise<any>)
}

describe('POST /me/api-keys validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCountActiveApiKeys.mockResolvedValue(0)
    mockCreateApiKey.mockResolvedValue({
      key_id: 'key-1',
      key_prefix: 'abc12345',
      name: 'Export Key',
      scopes: ['exports:read'],
      created_at: new Date('2026-02-15T00:00:00.000Z'),
      token: 'token-1',
    })
  })

  it('rejects unsupported scopes', async () => {
    const app = makeApp()
    const { meRoutes } = await import('../plane-a/src/routes/me')
    await meRoutes(app)

    const handler = getHandler(app, 'post', '/me/api-keys')
    const reply = { code: vi.fn().mockReturnThis() }

    await expect(
      handler(
        {
          user: { user_id: 'user-1', email: 'user@example.com', role: 'user', claims: {} },
          body: { scopes: ['indices:read', 'admin:read'] },
        },
        reply,
      ),
    ).rejects.toMatchObject<ValidationError>({
      details: {
        error: 'unsupported_scope',
        scopes: ['admin:read'],
      },
    })
  })

  it('rejects the legacy tier:1 scope', async () => {
    const app = makeApp()
    const { meRoutes } = await import('../plane-a/src/routes/me')
    await meRoutes(app)

    const handler = getHandler(app, 'post', '/me/api-keys')
    const reply = { code: vi.fn().mockReturnThis() }

    await expect(
      handler(
        {
          user: { user_id: 'user-1', email: 'user@example.com', role: 'user', claims: {} },
          body: { scopes: ['tier:1'] },
        },
        reply,
      ),
    ).rejects.toMatchObject<ValidationError>({
      details: {
        error: 'tier_disabled',
      },
    })
  })

  it('passes through explicitly requested supported scopes without broadening them', async () => {
    const app = makeApp()
    const { meRoutes } = await import('../plane-a/src/routes/me')
    await meRoutes(app)

    const handler = getHandler(app, 'post', '/me/api-keys')
    const reply = { code: vi.fn().mockReturnThis() }

    const response = await handler(
      {
        user: { user_id: 'user-1', email: 'user@example.com', role: 'user', claims: {} },
        body: { name: 'Export Key', scopes: ['exports:read'] },
      },
      reply,
    )

    expect(mockCreateApiKey).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({
        scopes: ['exports:read'],
      }),
    )
    expect(response.api_key.scopes).toEqual(['exports:read'])
  })
})
