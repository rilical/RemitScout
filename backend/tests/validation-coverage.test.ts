import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockQuery = vi.fn().mockResolvedValue({ rows: [] })
const mockGetUserPlan = vi.fn().mockResolvedValue({ plan_code: 'free', status: 'active' })
const mockGetEntitlementsForPlan = vi.fn().mockReturnValue({
  alerts_max: 1,
  watchlist_items: 3,
  history_max_days: 30,
})

const mockWatchlistRepository = {
  countByUserId: vi.fn().mockResolvedValue(0),
}

const mockNotificationRepository = {
  getUserPreferences: vi.fn().mockResolvedValue(null),
  upsertUserPreferences: vi.fn().mockResolvedValue(null),
  upsertPushSubscription: vi.fn().mockResolvedValue(null),
  removePushSubscription: vi.fn().mockResolvedValue(false),
}

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    container: {
      pool: { query: mockQuery },
      repositories: {
        watchlist: mockWatchlistRepository,
        comparisonHistory: {
          listByUserId: vi.fn().mockResolvedValue([]),
          create: vi.fn(),
        },
        recentSearch: {
          listByUserId: vi.fn().mockResolvedValue([]),
          create: vi.fn(),
          deleteByUserId: vi.fn(),
          deleteById: vi.fn(),
        },
        newsletter: {
          upsertSubscription: vi.fn(),
          findByEmail: vi.fn().mockResolvedValue(null),
          setConfirmed: vi.fn(),
          setUnsubscribed: vi.fn(),
        },
        session: {
          listByUserId: vi.fn().mockResolvedValue([]),
          revokeByUserAndId: vi.fn(),
          revokeAllByUser: vi.fn(),
          upsert: vi.fn(),
        },
        userAccount: {
          listAdminUsers: vi.fn().mockResolvedValue([]),
          getPrivacySettings: vi.fn().mockResolvedValue({ analytics_enabled: true, updated_at: new Date().toISOString() }),
        },
        userPlan: {
          ensureUserPlan: vi.fn(),
          getUserPlan: vi.fn(),
        },
        telemetry: {
          createOrUpdateSession: vi.fn(),
          recordSearchEvent: vi.fn(),
          recordOutboundClick: vi.fn(),
          recordProviderVisit: vi.fn(),
          recordConversionEvent: vi.fn(),
          getAnalyticsAggregate: vi.fn(),
        },
        notification: mockNotificationRepository,
      },
    },
  }) as unknown as FastifyInstance

const getHandler = (
  app: FastifyInstance,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

const expectValidationFailure = async (promise: Promise<unknown>) => {
  await expect(promise).rejects.toMatchObject({
    statusCode: 400,
    code: 'validation_error',
  })
}

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({ query: mockQuery }),
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  authPlugin: vi.fn(),
  requireAuth: () => () => undefined,
  requireAdmin: () => () => undefined,
  requireEntitlement: () => () => undefined,
  requireSuperAdmin: () => () => undefined,
}))

vi.mock('../plane-a/src/services/stripe-client', () => ({
  isStripeConfigured: () => true,
  getStripeClient: () => ({
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  }),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
  ensureUserPlan: vi.fn(),
  updatePlanFromStripe: vi.fn(),
}))

vi.mock('../plane-a/src/services/entitlements', () => ({
  getEntitlementsForPlan: (...args: any[]) => mockGetEntitlementsForPlan(...args),
}))

vi.mock('../plane-a/src/services/plan-usage', () => ({
  upsertUsageSnapshot: vi.fn(),
}))

describe('validation coverage', () => {
  it('returns typed validation errors for malformed payloads across major route modules', async () => {
    vi.resetModules()

    const user = {
      user_id: '00000000-0000-0000-0000-000000000001',
      email: 'test@example.com',
      role: 'admin',
    }
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }

    {
      const app = makeApp()
      const { notificationsRoutes } = await import('../plane-a/src/routes/notifications')
      await notificationsRoutes(app)
      const handler = getHandler(app, 'post', '/notifications/push/subscribe')
      await expectValidationFailure(handler({ user, body: {} }, reply))
    }

    {
      const app = makeApp()
      const { verifySessionRoutes } = await import('../plane-a/src/routes/billing/verify-session')
      await verifySessionRoutes(app)
      const handler = getHandler(app, 'post', '/billing/verify-session')
      await expectValidationFailure(handler({ user, body: {} }, reply))
    }

    {
      const app = makeApp()
      const { checkoutSessionRoutes } = await import('../plane-a/src/routes/billing/checkout-session')
      await checkoutSessionRoutes(app)
      const handler = getHandler(app, 'post', '/billing/checkout-session')
      await expectValidationFailure(handler({ user, body: {} }, reply))
    }

    {
      const app = makeApp()
      const { watchlistRoutes } = await import('../plane-a/src/routes/watchlist')
      await watchlistRoutes(app)
      const handler = getHandler(app, 'post', '/watchlist')
      await expectValidationFailure(handler({ user, body: {} }, reply))
    }

    {
      const app = makeApp()
      const { alertsRoutes } = await import('../plane-a/src/routes/alerts')
      await alertsRoutes(app)
      const handler = getHandler(app, 'post', '/alerts')
      await expectValidationFailure(handler({ user, body: {} }, reply))
    }

    {
      const app = makeApp()
      const { historyRoutes } = await import('../plane-a/src/routes/history')
      await historyRoutes(app)
      const handler = getHandler(app, 'get', '/history/recent')
      await expectValidationFailure(handler({ user, query: { limit: 999 } }, reply))
    }

    {
      const app = makeApp()
      const { recentSearchRoutes } = await import('../plane-a/src/routes/recent-searches')
      await recentSearchRoutes(app)
      const handler = getHandler(app, 'post', '/recent-searches')
      await expectValidationFailure(handler({ user, body: {} }, reply))
    }

    {
      const app = makeApp()
      const { newsletterRoutes } = await import('../plane-a/src/routes/newsletter')
      await newsletterRoutes(app)
      const handler = getHandler(app, 'post', '/newsletter/subscribe')
      await expectValidationFailure(handler({ body: {} }, reply))
    }

    {
      const app = makeApp()
      const { marketingRoutes } = await import('../plane-a/src/routes/marketing')
      await marketingRoutes(app)
      const handler = getHandler(app, 'post', '/marketing/meta')
      await expectValidationFailure(handler({ body: {} }, reply))
    }

    {
      const app = makeApp()
      const { telemetryRoutes } = await import('../plane-a/src/routes/telemetry')
      await telemetryRoutes(app)
      const handler = getHandler(app, 'post', '/telemetry/click')
      await expectValidationFailure(handler({ user, body: {} }, reply))
    }

    {
      const app = makeApp()
      const { adminRoutes } = await import('../plane-a/src/routes/admin')
      await adminRoutes(app)
      const handler = getHandler(app, 'get', '/admin/users')
      await expectValidationFailure(handler({ user, query: { limit: 999 } }, reply))
    }
  })
})
