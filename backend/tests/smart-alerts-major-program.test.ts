import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()
const mockIsMacroCorridor = vi.fn()
const mockGetUserPlan = vi.fn()

const alertRepo = {
  countByUserId: vi.fn(),
  listByUserId: vi.fn(),
  findById: vi.fn(),
  findByWatchlistItemAndRule: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const watchlistRepo = {
  findById: vi.fn(),
}

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../shared/config', () => ({
  config: {
    env: 'test',
    db: {
      planeAUrl: '',
    },
    planeA: {
      b2c: {
        maxQuoteAgeSeconds: 1800,
      },
    },
    observability: {
      cloudwatch: {
        enabled: false,
        highCardinalityEnabled: false,
        namespace: 'RemitScout',
      },
    },
    alerts: {
      unsubscribe: {
        baseUrl: 'http://localhost:3000',
      },
    },
  },
}))

vi.mock('../shared/macro-corridors', () => ({
  isMacroCorridor: (corridorId: string) => mockIsMacroCorridor(corridorId),
  getMacroCorridors: vi.fn().mockReturnValue([]),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
}))

vi.mock('../plane-a/src/repositories', () => ({
  AlertRepository: class {
    countByUserId = alertRepo.countByUserId
    listByUserId = alertRepo.listByUserId
    findById = alertRepo.findById
    findByWatchlistItemAndRule = alertRepo.findByWatchlistItemAndRule
    create = alertRepo.create
    update = alertRepo.update
  },
  WatchlistRepository: class {
    findById = watchlistRepo.findById
  },
  RightsMatrixRepository: class {
    listActiveB2cProvidersByCountry = vi.fn().mockResolvedValue([])
  },
}))

describe('Smart Alerts major corridor program gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockIsMacroCorridor.mockReturnValue(false)
    mockQuery.mockResolvedValue({ rows: [] })
    mockGetUserPlan.mockResolvedValue({ plan_code: 'plus', status: 'active' })

    alertRepo.findByWatchlistItemAndRule.mockResolvedValue(null)
    watchlistRepo.findById.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000010',
      owner_id: 'u1',
      target_type: 'corridor',
      target_payload: { corridorId: 'BO-AR-BOB-ARS' },
    })
  })

  const makeApp = () => {
    const routes = new Map<string, any>()
    const app: any = {
      get: (path: string, handler: any) => {
        routes.set(`GET ${path}`, handler)
      },
      post: (path: string, _opts: any, handler: any) => {
        routes.set(`POST ${path}`, handler)
      },
      patch: (path: string, _opts: any, handler: any) => {
        routes.set(`PATCH ${path}`, handler)
      },
      delete: (path: string, _opts: any, handler: any) => {
        routes.set(`DELETE ${path}`, handler)
      },
    }
    return { app, routes }
  }

  it('returns smartAlerts.status=not_offered for non-macro corridor', async () => {
    const { alertsRoutes } = await import('../plane-a/src/routes/alerts')
    const { app, routes } = makeApp()
    await alertsRoutes(app)

    const handler = routes.get('GET /alerts/corridor-eligibility')
    expect(handler).toBeTypeOf('function')

    const reply: any = { code: vi.fn().mockReturnThis() }
    const res = await handler(
      { query: { corridorId: 'BO-AR-BOB-ARS' } } as any,
      reply,
    )

    expect(res.success).toBe(true)
    expect(res.smartAlerts.programEligible).toBe(false)
    expect(res.smartAlerts.status).toBe('not_offered')
    expect(res.smartAlerts.eligible).toBe(false)
  })

  it('rejects sendScore alert creation for non-macro corridor', async () => {
    const { alertsRoutes } = await import('../plane-a/src/routes/alerts')
    const { app, routes } = makeApp()
    await alertsRoutes(app)

    const handler = routes.get('POST /alerts')
    expect(handler).toBeTypeOf('function')

    const reply: any = { code: vi.fn().mockReturnThis() }
    const res = await handler(
      {
        user: { user_id: 'u1', email: 'u@test.com' },
        body: {
          watchlistItemId: '00000000-0000-0000-0000-000000000010',
          rule: { metric: 'sendScore', comparator: 'gte', value: 90 },
          frequency: 'weekly',
          enabled: true,
        },
      } as any,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(400)
    expect(res.success).toBe(false)
    expect(res.error).toBe('smart_not_offered')
    expect(res.message).toBe('Smart Alerts are available for select major corridors we track continuously.')
  })
})
