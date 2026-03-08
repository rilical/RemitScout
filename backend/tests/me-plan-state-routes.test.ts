import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockUpsertUserAccount = vi.fn()
const mockEnsureUserPlan = vi.fn()
const mockGetUserPlan = vi.fn()
const mockResolveEffectiveEntitlements = vi.fn()

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
}))

vi.mock('../plane-a/src/services/user-account', () => ({
  upsertUserAccount: (...args: any[]) => mockUpsertUserAccount(...args),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: (...args: any[]) => mockEnsureUserPlan(...args),
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
}))

vi.mock('../plane-a/src/services/effective-entitlements', () => ({
  resolveEffectiveEntitlements: (...args: any[]) => mockResolveEffectiveEntitlements(...args),
}))

vi.mock('../plane-a/src/services/plan-usage', () => ({
  getUsageForUser: vi.fn().mockResolvedValue({}),
}))

vi.mock('../plane-a/src/services/api-keys', () => ({
  countActiveApiKeys: vi.fn(),
  createApiKey: vi.fn(),
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

const getRouteHandler = (app: FastifyInstance, method: 'get' | 'post', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[2] as ((request: any, reply: any) => Promise<any>)
}

const inactiveEnterpriseEffective = {
  effectivePlanCode: 'free',
  normalizedPlanCode: 'enterprise',
  entitlements: {
    pulse_access: 'none',
    exports_enabled: false,
    exports_max_days: 0,
    alerts_max: 1,
    history_max_days: 30,
    watchlist_items: 3,
    api_access: false,
    api_tier: null,
    bulk_export: false,
    indices_api: false,
    daily_alerts_enabled: false,
    smart_alerts_enabled: false,
    index_threshold_alerts_enabled: false,
    indices_exports_enabled: false,
    pulse_embeds_enabled: false,
    indices_embeds_enabled: false,
    api_key_max: 0,
    api_rate_limit_rpm: 0,
  },
  isPlanActive: false,
  internalEnterpriseOverride: false,
  lifecycleState: 'past_due',
  recoveryAvailable: true,
  recoveryAction: 'billing_portal',
  source: 'inactive_or_default',
  adminAccess: {
    appRole: 'user',
    email: 'user@example.com',
    hasAdminRole: false,
    allowlisted: false,
    requireAllowlist: false,
    hasAllowlistConfigured: false,
    allowed: false,
  },
}

describe('/me plan-state route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsertUserAccount.mockResolvedValue(undefined)
    mockEnsureUserPlan.mockResolvedValue(undefined)
    mockGetUserPlan.mockResolvedValue({
      user_id: 'user-1',
      plan_code: 'enterprise',
      status: 'past_due',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
      current_period_end: '2026-04-01T00:00:00.000Z',
    })
    mockResolveEffectiveEntitlements.mockResolvedValue(inactiveEnterpriseEffective)
  })

  it('returns plan_inactive for inactive enterprise API key access', async () => {
    const app = makeApp()
    const { meRoutes } = await import('../plane-a/src/routes/me')
    await meRoutes(app)

    const handler = getRouteHandler(app, 'get', '/me/api-keys')
    const reply = { code: vi.fn().mockReturnThis() } as any

    const response = await handler({
      user: { user_id: 'user-1', email: 'user@example.com', role: 'user', claims: {} },
    }, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(response).toEqual(expect.objectContaining({
      error: 'plan_inactive',
      details: expect.objectContaining({
        plan_failure: 'plan_inactive',
        required_plan: 'enterprise',
        capability: 'api_access',
        lifecycle_state: 'past_due',
        recovery_action: 'billing_portal',
      }),
    }))
  })

  it('returns plan_inactive for inactive enterprise export-job access', async () => {
    const app = makeApp()
    const { meRoutes } = await import('../plane-a/src/routes/me')
    await meRoutes(app)

    const handler = getRouteHandler(app, 'get', '/me/export-jobs')
    const reply = { code: vi.fn().mockReturnThis() } as any

    const response = await handler({
      user: { user_id: 'user-1', email: 'user@example.com', role: 'user', claims: {} },
      query: {},
    }, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(response).toEqual(expect.objectContaining({
      error: 'plan_inactive',
      details: expect.objectContaining({
        plan_failure: 'plan_inactive',
        required_plan: 'enterprise',
        capability: 'bulk_export',
        lifecycle_state: 'past_due',
        recovery_action: 'billing_portal',
      }),
    }))
  })
})
