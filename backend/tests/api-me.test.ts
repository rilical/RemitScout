import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockUpsertUserAccount = vi.fn()
const mockEnsureUserPlan = vi.fn()
const mockGetUserPlan = vi.fn()
const mockGetUsageForUser = vi.fn()
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

vi.mock('../plane-a/src/services/plan-usage', () => ({
  getUsageForUser: (...args: any[]) => mockGetUsageForUser(...args),
}))

vi.mock('../plane-a/src/services/effective-entitlements', () => ({
  resolveEffectiveEntitlements: (...args: any[]) => mockResolveEffectiveEntitlements(...args),
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

describe('GET /api/v1/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsertUserAccount.mockResolvedValue(undefined)
    mockEnsureUserPlan.mockResolvedValue(undefined)
    mockGetUserPlan.mockResolvedValue({
      user_id: '00000000-0000-0000-0000-000000000001',
      plan_code: 'free',
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })
    mockGetUsageForUser.mockResolvedValue({
      alerts_count: 1,
      watchlist_count: 2,
    })
    mockResolveEffectiveEntitlements.mockResolvedValue({
      effectivePlanCode: 'enterprise',
      entitlements: {
        pulse_access: 'full',
        exports_enabled: true,
        exports_max_days: 365,
        alerts_max: null,
        history_max_days: 365,
        watchlist_items: null,
        api_access: true,
        api_tier: 2,
        bulk_export: true,
        indices_api: true,
        daily_alerts_enabled: true,
        smart_alerts_enabled: true,
        index_threshold_alerts_enabled: true,
        indices_exports_enabled: true,
        pulse_embeds_enabled: true,
        indices_embeds_enabled: true,
        api_key_max: 5,
        api_rate_limit_rpm: 600,
      },
      isPlanActive: true,
      internalEnterpriseOverride: true,
      lifecycleState: 'active',
      recoveryAvailable: false,
      recoveryAction: 'none',
      source: 'internal_admin_override',
      adminAccess: {
        appRole: 'admin',
        email: 'u@test.com',
        hasAdminRole: true,
        allowlisted: true,
        requireAllowlist: false,
        hasAllowlistConfigured: false,
        allowed: true,
      },
    })
  })

  it('returns the effective plan and explicit entitlements for an authenticated user', async () => {
    const app = makeApp()
    const { meRoutes } = await import('../plane-a/src/routes/me')
    await meRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((call) => call[0] === '/me')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis() } as any

    const response = await handler({
      user: {
        user_id: '00000000-0000-0000-0000-000000000001',
        email: 'u@test.com',
        role: 'user',
        claims: {},
      },
    } as any, reply)

    expect(response.success).toBe(true)
    expect(response.user.user_id).toBe('00000000-0000-0000-0000-000000000001')
    expect(response.user.is_admin).toBe(true)
    expect(response.plan.plan_code).toBe('free')
    expect(response.plan_effective).toEqual({
      plan_code: 'enterprise',
      is_active: true,
      lifecycle_state: 'active',
      source: 'internal_admin_override',
      recovery_available: false,
      recovery_action: 'none',
    })
    expect(response.billing).toEqual({
      next_billing_date: null,
      current_period_end: null,
      cancel_at_period_end: false,
      amount: null,
      currency: null,
      status: 'active',
      payment_method: null,
    })
    expect(response.entitlements.indices_exports_enabled).toBe(true)
    expect(response.entitlements.pulse_embeds_enabled).toBe(true)
    expect(response.entitlements.api_key_max).toBe(5)
    expect(response.usage).toEqual({
      alerts_count: 1,
      watchlist_count: 2,
    })
  })
})
