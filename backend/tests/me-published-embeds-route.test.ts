import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockLogAuditEvent = vi.fn()
const mockPublishedEmbedList = vi.fn()
const mockPublishedEmbedRevoke = vi.fn()

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

vi.mock('../plane-a/src/services/plan-usage', () => ({
  getUsageForUser: vi.fn().mockResolvedValue({}),
}))

vi.mock('../plane-a/src/services/effective-entitlements', () => ({
  resolveEffectiveEntitlements: vi.fn().mockResolvedValue({
    effectivePlanCode: 'enterprise',
    entitlements: {},
    isPlanActive: true,
    internalEnterpriseOverride: false,
    lifecycleState: 'active',
    recoveryAvailable: false,
    recoveryAction: 'none',
    source: 'plan',
    adminAccess: {
      appRole: 'user',
      email: 'user@test.com',
      hasAdminRole: false,
      allowlisted: false,
      requireAllowlist: false,
      hasAllowlistConfigured: false,
      allowed: false,
    },
  }),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
  getRequestContext: vi.fn(() => ({})),
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
        publishedEmbed: {
          listByOwnerUserId: mockPublishedEmbedList,
          revoke: mockPublishedEmbedRevoke,
        },
      },
    },
  }) as any as FastifyInstance

describe('me published embeds routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPublishedEmbedList.mockResolvedValue([
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        owner_user_id: 'user-1',
        surface_kind: 'pulse',
        chart_key: 'leader-edge',
        index_key: null,
        title: 'Leader Edge vs #2',
        theme: 'dark',
        filters_json: {},
        payload_json: {},
        created_at: new Date('2026-03-05T12:00:00.000Z'),
        published_at: new Date('2026-03-05T12:00:00.000Z'),
        revoked_at: null,
      },
    ])
    mockPublishedEmbedRevoke.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174003',
      owner_user_id: 'user-1',
      surface_kind: 'pulse',
      chart_key: 'leader-edge',
      index_key: null,
      title: 'Leader Edge vs #2',
      theme: 'dark',
      filters_json: {},
      payload_json: {},
      created_at: new Date('2026-03-05T12:00:00.000Z'),
      published_at: new Date('2026-03-05T12:00:00.000Z'),
      revoked_at: new Date('2026-03-06T12:00:00.000Z'),
    })
  })

  it('lists current user published embeds with variant metadata', async () => {
    const app = makeApp()
    const { meRoutes } = await import('../plane-a/src/routes/me')
    await meRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((call) => call[0] === '/me/published-embeds')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis() } as any

    const response = await handler({
      query: {},
      user: {
        user_id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        claims: {},
      },
    }, reply)

    expect(response.success).toBe(true)
    expect(response.embeds).toHaveLength(1)
    expect(response.embeds[0].variants[0].publicUrl).toContain('/embed/pulse/leader-edge?published_id=123e4567-e89b-12d3-a456-426614174003')
  })

  it('revokes a current user published embed idempotently', async () => {
    const app = makeApp()
    const { meRoutes } = await import('../plane-a/src/routes/me')
    await meRoutes(app)

    const handler = vi.mocked(app.post).mock.calls.find((call) => call[0] === '/me/published-embeds/:id/revoke')?.[2] as any
    const reply = { code: vi.fn().mockReturnThis() } as any

    const response = await handler({
      params: {
        id: '123e4567-e89b-12d3-a456-426614174003',
      },
      user: {
        user_id: 'user-1',
        email: 'user@test.com',
        role: 'user',
        claims: {},
      },
    }, reply)

    expect(response.success).toBe(true)
    expect(response.embed.revokedAt).toBe('2026-03-06T12:00:00.000Z')
    expect(mockLogAuditEvent).toHaveBeenCalled()
  })
})
