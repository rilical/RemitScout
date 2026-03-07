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

vi.mock('../shared/config', async () => {
  const actual = await vi.importActual<typeof import('../shared/config')>('../shared/config')
  return {
    config: {
      ...actual.config,
      env: 'test',
      db: {
        ...actual.config.db,
        planeAUrl: '',
      },
      planeA: {
        ...actual.config.planeA,
        b2c: {
          ...actual.config.planeA.b2c,
          maxQuoteAgeSeconds: 1800,
        },
      },
      alerts: {
        ...actual.config.alerts,
        unsubscribe: {
          ...actual.config.alerts.unsubscribe,
          baseUrl: 'http://localhost:3000',
        },
      },
    },
  }
})

vi.mock('../shared/macro-corridors', () => ({
  isMacroCorridor: (corridorId: string) => mockIsMacroCorridor(corridorId),
  getMacroCorridors: vi.fn().mockReturnValue([]),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
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

vi.mock('../plane-a/src/container', () => ({
  planeAContainer: {
    pool: { query: mockQuery },
    repositories: {
      alert: alertRepo,
      watchlist: watchlistRepo,
      rightsMatrix: {
        listActiveB2cProvidersByCountry: vi.fn().mockResolvedValue([]),
      },
    },
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
      get: (path: string, optionsOrHandler: any, maybeHandler?: any) => {
        routes.set(`GET ${path}`, maybeHandler ?? optionsOrHandler)
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
      container: {
        pool: { query: mockQuery },
        repositories: {
          rightsMatrix: {
            listActiveB2cProvidersByCountry: vi.fn().mockResolvedValue([]),
          },
        },
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

})
