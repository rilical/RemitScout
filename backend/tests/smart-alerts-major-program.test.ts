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

vi.mock('../plane-a/src/services/user-plan', () => ({
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
}))

vi.mock('../plane-a/src/repositories', async () => {
  const actual = await vi.importActual<typeof import('../plane-a/src/repositories')>(
    '../plane-a/src/repositories',
  )
  return {
    ...actual,
    AlertRepository: class {
      countByUserId = alertRepo.countByUserId
      listByUserId = alertRepo.listByUserId
      findById = alertRepo.findById
      findByWatchlistItemAndRule = alertRepo.findByWatchlistItemAndRule
      create = alertRepo.create
      update = alertRepo.update
    },
    DailyUsageCounterRepository: class {
      incrementAndGet = vi.fn().mockResolvedValue(0)
      getCount = vi.fn().mockResolvedValue(0)
    },
    WatchlistRepository: class {
      findById = watchlistRepo.findById
    },
    RightsMatrixRepository: class {
      listActiveB2cProvidersByCountry = vi.fn().mockResolvedValue([])
    },
  }
})

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

})
