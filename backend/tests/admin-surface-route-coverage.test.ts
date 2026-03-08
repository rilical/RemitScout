import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { NotFoundError, ValidationError } from '../shared/errors'

const mockPoolQuery = vi.hoisted(() => vi.fn())
const mockPoolConnect = vi.hoisted(() => vi.fn())
const mockClientQuery = vi.hoisted(() => vi.fn())
const mockClientRelease = vi.hoisted(() => vi.fn())
const mockQuery = vi.hoisted(() => vi.fn())
const mockGetCampaign = vi.hoisted(() => vi.fn())
const mockListCampaigns = vi.hoisted(() => vi.fn())
const mockCreateCampaign = vi.hoisted(() => vi.fn())
const mockGetActiveSubscriberCount = vi.hoisted(() => vi.fn())
const mockPreviewCampaignHtml = vi.hoisted(() => vi.fn())
const mockSendCampaign = vi.hoisted(() => vi.fn())
const mockEvaluateAlert = vi.hoisted(() => vi.fn())
const mockEvaluateAlertsForFrequency = vi.hoisted(() => vi.fn())
const mockLogAuditEvent = vi.hoisted(() => vi.fn())
const mockGetRequestContext = vi.hoisted(() => vi.fn().mockReturnValue({}))

vi.mock('../shared/config', () => ({
  config: {
    db: {
      planeAUrl: 'postgres://localhost:5432/remit',
    },
    env: 'development',
    envName: 'dev',
    runtime: {
      readOnly: false,
    },
    alerts: {
      notifications: {
        auditPii: false,
      },
    },
  },
}))

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({
    query: mockPoolQuery,
    connect: mockPoolConnect,
  }),
  query: (...args: unknown[]) => mockQuery(...args),
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => {
    const handler = () => undefined
    ;(handler as { __guardTag?: string }).__guardTag = 'requireAdmin'
    return handler
  },
  requireSuperAdmin: () => {
    const handler = () => undefined
    ;(handler as { __guardTag?: string }).__guardTag = 'requireSuperAdmin'
    return handler
  },
}))

vi.mock('../plane-a/src/services/newsletter-campaign', () => ({
  createCampaign: (...args: unknown[]) => mockCreateCampaign(...args),
  getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
  listCampaigns: (...args: unknown[]) => mockListCampaigns(...args),
  getActiveSubscriberCount: (...args: unknown[]) =>
    mockGetActiveSubscriberCount(...args),
  previewCampaignHtml: (...args: unknown[]) => mockPreviewCampaignHtml(...args),
  sendCampaign: (...args: unknown[]) => mockSendCampaign(...args),
}))

vi.mock('../plane-a/src/services/alert-evaluator', () => ({
  evaluateAlert: (...args: unknown[]) => mockEvaluateAlert(...args),
  evaluateAlertsForFrequency: (...args: unknown[]) =>
    mockEvaluateAlertsForFrequency(...args),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  getRequestContext: (...args: unknown[]) => mockGetRequestContext(...args),
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}))

vi.mock('../plane-a/src/services/provider-metadata', () => ({
  getProviderMetadata: () => ({ slug: 'provider', name: 'Provider' }),
}))

vi.mock(
  '../plane-a/src/repositories/implementations/module-registry-repository',
  () => ({
    ModuleRegistryRepository: class {
      getAll = vi.fn()
      getById = vi.fn()
      getCorridorDetail = vi.fn()
    },
  }),
)

vi.mock(
  '../plane-a/src/repositories/implementations/agent-actions-repository',
  () => ({
    AgentActionsRepository: class {
      getActions = vi.fn()
      getFailureBundles = vi.fn()
      getMetrics = vi.fn()
    },
  }),
)

vi.mock(
  '../plane-a/src/repositories/implementations/triangulated-index-repository',
  () => ({
    TriangulatedIndexRepository: class {
      getStressOverview = vi.fn()
    },
  }),
)

vi.mock(
  '../plane-a/src/repositories/implementations/correction-ledger-repository',
  () => ({
    CorrectionLedgerRepository: class {
      list = vi.fn()
    },
  }),
)

vi.mock(
  '../plane-a/src/repositories/implementations/data-quality-repository',
  () => ({
    DataQualityRepository: class {
      getTotalCollectionError = vi.fn()
      getMttdMttr = vi.fn()
    },
  }),
)

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    container: {
      pool: {
        query: mockPoolQuery,
        connect: mockPoolConnect,
      },
      repositories: {
        newsletter: {},
        rightsMatrix: {
          listActiveB2cProvidersByCountry: vi.fn().mockResolvedValue([]),
        },
      },
    },
  }) as unknown as FastifyInstance

type RouteRequest = {
  query?: Record<string, unknown>
  body?: Record<string, unknown>
  params?: Record<string, string>
  user?: {
    user_id?: string
    role?: string
  }
}

type RouteReply = {
  code: ReturnType<typeof vi.fn>
}

type RouteHandler = (
  request: RouteRequest,
  reply?: RouteReply,
) => Promise<unknown>

const getHandler = (
  app: FastifyInstance,
  method: 'get' | 'post' | 'patch',
  url: string,
) => {
  const call = vi
    .mocked(app[method])
    .mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as RouteHandler
}

const getRouteOptions = (
  app: FastifyInstance,
  method: 'get' | 'post' | 'patch',
  url: string,
) => {
  const call = vi
    .mocked(app[method])
    .mock.calls.find((entry) => entry[0] === url)
  return call?.[1] as {
    preHandler?:
      | Array<(...args: never[]) => unknown>
      | ((...args: never[]) => unknown)
  }
}

describe('admin surface route coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    })
    mockClientQuery.mockResolvedValue(undefined)
  })

  it('returns not_found for missing discovery scan detail', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] })

    const app = makeApp()
    const { adminDiscoveryRoutes } =
      await import('../plane-a/src/routes/admin-discovery')
    await adminDiscoveryRoutes(app)

    const handler = getHandler(app, 'get', '/admin/discovery/scans/:scanId')
    await expect(handler({ params: { scanId: '42' } })).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('returns not_found for missing newsletter campaign detail', async () => {
    mockGetCampaign.mockResolvedValueOnce(null)

    const app = makeApp()
    const { adminNewsletterRoutes } =
      await import('../plane-a/src/routes/admin-newsletter')
    await adminNewsletterRoutes(app)

    const handler = getHandler(app, 'get', '/admin/newsletter/campaigns/:id')
    await expect(
      handler({ params: { id: 'cmp_missing' } }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('validates observer summary query params', async () => {
    const app = makeApp()
    const { observerSummaryRoutes } =
      await import('../plane-a/src/routes/ops/observer-summary')
    observerSummaryRoutes(app)

    const handler = getHandler(app, 'get', '/ops/observer/summary')
    await expect(
      handler({ query: { limit: '0' } }, { code: vi.fn().mockReturnThis() }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('validates stale API key query params', async () => {
    const app = makeApp()
    const { apiKeysAdminRoutes } =
      await import('../plane-a/src/routes/ops/api-keys-admin')
    apiKeysAdminRoutes(app)

    const handler = getHandler(app, 'get', '/ops/api-keys/stale')
    await expect(
      handler(
        { query: { staleDays: '0' } },
        { code: vi.fn().mockReturnThis() },
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('validates alert evaluation admin body requirements', async () => {
    const app = makeApp()
    const { alertEvaluationAdminRoutes } =
      await import('../plane-a/src/routes/ops/alert-evaluation-admin')
    alertEvaluationAdminRoutes(app)

    const handler = getHandler(app, 'post', '/ops/alerts/evaluate')
    await expect(
      handler({ body: {} }, { code: vi.fn().mockReturnThis() }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('blocks execute alert evaluation before side effects when audit preflight fails', async () => {
    mockLogAuditEvent.mockRejectedValueOnce(new Error('audit unavailable'))

    const app = makeApp()
    const { alertEvaluationAdminRoutes } =
      await import('../plane-a/src/routes/ops/alert-evaluation-admin')
    alertEvaluationAdminRoutes(app)

    const handler = getHandler(app, 'post', '/ops/alerts/evaluate')
    const reply = { code: vi.fn().mockReturnThis() }
    const response = await handler(
      {
        user: { user_id: 'admin-1', role: 'super_admin' },
        body: {
          frequency: 'daily',
          mode: 'execute',
          confirm: 'RUN',
          ignoreSchedule: true,
          limit: 5,
        },
      },
      reply,
    )

    expect(mockEvaluateAlertsForFrequency).not.toHaveBeenCalled()
    expect(mockEvaluateAlert).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(500)
    expect(response).toMatchObject({ success: false, error: 'internal_error' })
  })

  it('validates db-admin request body', async () => {
    const app = makeApp()
    const { dbAdminRoutes } = await import('../plane-a/src/routes/ops/db-admin')
    dbAdminRoutes(app)

    const handler = getHandler(
      app,
      'post',
      '/ops/db/ensure-alert-notification-attempts',
    )
    await expect(
      handler(
        { body: { mode: 'invalid' } },
        { code: vi.fn().mockReturnThis() },
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('loads stress control-state aggregates for the operator surface', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_modules: 4,
          adaptive_probing_paused_modules: 2,
          stress_probing_disabled_modules: 1,
          updated_at: new Date('2026-03-07T12:45:00.000Z'),
        },
      ],
    })

    const app = makeApp()
    const { platformOpsRoutes } =
      await import('../plane-a/src/routes/ops/platform')
    platformOpsRoutes(app)

    const handler = getHandler(app, 'get', '/ops/stress/control-state')
    const response = await handler({})

    expect(response).toMatchObject({
      total_modules: 4,
      adaptive_probing_paused_modules: 2,
      stress_probing_disabled_modules: 1,
      pause_active: true,
      kill_switch_active: true,
      updatedAt: '2026-03-07T12:45:00.000Z',
    })
  })

  it('rolls back db-admin ensure when audit logging fails', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ regclass: null }] })
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        rows: [{ regclass: 'silver.alert_notification_attempt' }],
      })
      .mockResolvedValueOnce(undefined)
    mockLogAuditEvent.mockRejectedValueOnce(new Error('audit unavailable'))

    const app = makeApp()
    const { dbAdminRoutes } = await import('../plane-a/src/routes/ops/db-admin')
    dbAdminRoutes(app)

    const handler = getHandler(
      app,
      'post',
      '/ops/db/ensure-alert-notification-attempts',
    )
    const reply = { code: vi.fn().mockReturnThis() }
    const response = await handler(
      {
        user: { user_id: 'admin-1', role: 'super_admin' },
        body: { mode: 'ensure', confirm: 'APPLY' },
      },
      reply,
    )

    expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(mockClientQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        'CREATE TABLE IF NOT EXISTS silver.alert_notification_attempt',
      ),
    )
    expect(mockClientQuery).toHaveBeenNthCalledWith(4, 'ROLLBACK')
    expect(reply.code).toHaveBeenCalledWith(500)
    expect(response).toMatchObject({ success: false, error: 'internal_error' })
  })

  it('returns a stable bad_request for invalid provider explain corridor ids', async () => {
    const app = makeApp()
    const { providersExplainRoutes } =
      await import('../plane-a/src/routes/ops/providers-explain')
    await providersExplainRoutes(app)

    const handler = getHandler(app, 'get', '/ops/providers/explain')
    const reply = { code: vi.fn().mockReturnThis() }
    const response = await handler(
      {
        query: { corridor_id: 'bad-corridor', amount: 100, method: 'bank' },
      },
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(400)
    expect(response).toMatchObject({ error: 'bad_request' })
  })

  it('registers platform ops endpoints behind requireAdmin', async () => {
    const app = makeApp()
    const { platformOpsRoutes } =
      await import('../plane-a/src/routes/ops/platform')
    platformOpsRoutes(app)

    const options = getRouteOptions(app, 'get', '/ops/modules/health')
    const preHandlers = Array.isArray(options?.preHandler)
      ? options.preHandler
      : [options?.preHandler]
    const guardTags = preHandlers.map(
      (handler) => (handler as { __guardTag?: string } | undefined)?.__guardTag,
    )

    expect(guardTags).toContain('requireAdmin')
    expect(getRouteOptions(app, 'get', '/ops/agents/metrics')).toBeTruthy()
    expect(getRouteOptions(app, 'post', '/ops/stress/override')).toBeTruthy()
    const serviceHealthOptions = getRouteOptions(
      app,
      'get',
      '/ops/services/health',
    )
    const serviceHealthHandlers = Array.isArray(
      serviceHealthOptions?.preHandler,
    )
      ? serviceHealthOptions.preHandler
      : [serviceHealthOptions?.preHandler]
    const serviceHealthGuardTags = serviceHealthHandlers.map(
      (handler) => (handler as { __guardTag?: string } | undefined)?.__guardTag,
    )
    expect(serviceHealthGuardTags).toContain('requireSuperAdmin')
  })

  it('registers indices and B2B sweep status admin endpoints', async () => {
    const app = makeApp()
    const { indicesHealthRoutes } =
      await import('../plane-a/src/routes/ops/indices-health')
    const { b2bSweepStatusRoutes } =
      await import('../plane-a/src/routes/ops/b2b-sweep-status')

    indicesHealthRoutes(app)
    await b2bSweepStatusRoutes(app)

    const indicesHandlers = Array.isArray(
      getRouteOptions(app, 'get', '/ops/indices/health')?.preHandler,
    )
      ? (getRouteOptions(app, 'get', '/ops/indices/health')
          ?.preHandler as Array<{ __guardTag?: string }>)
      : [
          getRouteOptions(app, 'get', '/ops/indices/health')?.preHandler as {
            __guardTag?: string
          },
        ]
    const sweepHandlers = Array.isArray(
      getRouteOptions(app, 'get', '/ops/b2b-sweep-status')?.preHandler,
    )
      ? (getRouteOptions(app, 'get', '/ops/b2b-sweep-status')
          ?.preHandler as Array<{ __guardTag?: string }>)
      : [
          getRouteOptions(app, 'get', '/ops/b2b-sweep-status')?.preHandler as {
            __guardTag?: string
          },
        ]

    expect(indicesHandlers.map((handler) => handler?.__guardTag)).toContain(
      'requireSuperAdmin',
    )
    expect(sweepHandlers.map((handler) => handler?.__guardTag)).toContain(
      'requireSuperAdmin',
    )
  })
})
