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

describe('Regular corridor alerts quote coverage gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMacroCorridor.mockReturnValue(false)
    mockGetUserPlan.mockResolvedValue({ plan_code: 'free', status: 'active' })
    alertRepo.findByWatchlistItemAndRule.mockResolvedValue(null)
    watchlistRepo.findById.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000020',
      owner_id: 'u1',
      target_type: 'corridor',
      target_payload: { corridorId: 'BO-AR-BOB-ARS', method: 'bank', amountBucket: 500 },
    })

    mockQuery.mockImplementation((sql: string) => {
      if (sql.includes('FROM silver.corridor_signals')) {
        return Promise.resolve({ rows: [] })
      }
      if (sql.includes('FROM gold.fx_rates')) {
        return Promise.resolve({ rows: [] })
      }
      if (sql.includes('FROM silver.latest_quote_by_provider')) {
        return Promise.resolve({ rows: [{ latest: null, provider_count: 0 }] })
      }
      // rights_matrix queries inside repository (if any)
      if (sql.includes('FROM silver.rights_matrix')) {
        return Promise.resolve({ rows: [] })
      }
      return Promise.resolve({ rows: [] })
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

  it('corridor-eligibility returns quoteCoverage.supported=false when no quotes exist', async () => {
    const { alertsRoutes } = await import('../plane-a/src/routes/alerts')
    const { app, routes } = makeApp()
    await alertsRoutes(app)

    const handler = routes.get('GET /alerts/corridor-eligibility')
    const reply: any = { code: vi.fn().mockReturnThis() }
    const res = await handler(
      { query: { corridorId: 'BO-AR-BOB-ARS', method: 'bank', amountBucket: 500 } } as any,
      reply,
    )

    expect(res.success).toBe(true)
    expect(res.regularAlerts.quoteCoverage.supported).toBe(false)
    expect(res.regularAlerts.quoteCoverage.supportedMetrics).toEqual([])
  })

  it('rejects quote-based alert creation when quoteCoverage.supported=false', async () => {
    const { alertsRoutes } = await import('../plane-a/src/routes/alerts')
    const { app, routes } = makeApp()
    await alertsRoutes(app)

    const handler = routes.get('POST /alerts')
    const reply: any = { code: vi.fn().mockReturnThis() }
    const res = await handler(
      {
        user: { user_id: 'u1', email: 'u@test.com' },
        body: {
          watchlistItemId: '00000000-0000-0000-0000-000000000020',
          rule: { metric: 'recipientGets', comparator: 'gte', value: 0 },
          frequency: 'weekly',
          enabled: true,
        },
      } as any,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(400)
    expect(res.success).toBe(false)
    expect(res.error).toBe('quote_not_supported')
  })
})

