import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

const listLatestByCorridor = vi.fn()
const enqueueRequest = vi.fn()
const listActiveB2cProvidersByCountry = vi.fn()
const getPriorityInfo = vi.fn()
const getPriorityTier = vi.fn()
const listSupportedProviderIds = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: vi.fn().mockResolvedValue({ rows: [{ count: 1 }] }),
}))

vi.mock('../plane-a/src/repositories', () => ({
  LatestQuoteRepository: vi.fn().mockImplementation(() => ({ listLatestByCorridor })),
  QuoteRefreshRepository: vi.fn().mockImplementation(() => ({ enqueueRequest })),
  RightsMatrixRepository: vi.fn().mockImplementation(() => ({ listActiveB2cProvidersByCountry })),
  CorridorPriorityRepository: vi.fn().mockImplementation(() => ({ getPriorityInfo, getPriorityTier })),
  CorridorCapabilityRepository: vi.fn().mockImplementation(() => ({ listSupportedProviderIds })),
}))

const makeApp = () => ({
  get: vi.fn(),
  container: {
    pool: {},
    repositories: {
      latestQuote: {
        listLatestByCorridor,
      },
      quoteRefresh: {
        enqueueRequest,
      },
      rightsMatrix: {
        listActiveB2cProvidersByCountry,
      },
      corridorPriority: {
        getPriorityInfo,
        getPriorityTier,
      },
      corridorCapability: {
        listSupportedProviderIds,
      },
    },
  },
}) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'get', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('quotes route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listLatestByCorridor.mockResolvedValue([])
    enqueueRequest.mockResolvedValue('00000000-0000-0000-0000-000000000001')
    listActiveB2cProvidersByCountry.mockResolvedValue([{ provider_id: 'wise' }])
    getPriorityInfo.mockResolvedValue({ priorityTier: 'tier_1', freshnessSloMinutes: 10 })
    getPriorityTier.mockResolvedValue('tier_1')
    listSupportedProviderIds.mockResolvedValue(['wise'])
  })

  it('validates corridor format', async () => {
    const app = makeApp()
    const { quotesRoutes } = await import('../plane-a/src/routes/quotes')
    await quotesRoutes(app)

    const handler = getHandler(app, 'get', '/quotes/current')
    await expect(
      handler(
        { query: { corridor_id: 'BAD', amount_bucket: 500, payin: 'bank_transfer', payout: 'bank_deposit' }, headers: {} },
        { header: vi.fn().mockReturnThis(), code: vi.fn().mockReturnThis() },
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('validates amount requirement', async () => {
    const app = makeApp()
    const { quotesRoutes } = await import('../plane-a/src/routes/quotes')
    await quotesRoutes(app)

    const handler = getHandler(app, 'get', '/quotes/current')
    await expect(
      handler(
        { query: { corridor_id: 'US-MX-USD-MXN', payin: 'bank_transfer', payout: 'bank_deposit' }, headers: {} },
        { header: vi.fn().mockReturnThis(), code: vi.fn().mockReturnThis() },
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('returns B2C quotes for valid corridor request', async () => {
    listSupportedProviderIds.mockResolvedValue(['wise'])

    listLatestByCorridor.mockResolvedValue([
      {
      provider_id: 'wise',
      provider_name: 'Wise',
      implied_fx_rate: 17.5,
      collected_at: new Date().toISOString(),
      delivery_time_min_minutes: 10,
      delivery_time_max_minutes: 20,
      },
    ])

    const app = makeApp()
    const { quotesRoutes } = await import('../plane-a/src/routes/quotes')
    await quotesRoutes(app)

    const handler = getHandler(app, 'get', '/quotes/current')
    const reply = { header: vi.fn().mockReturnThis(), code: vi.fn().mockReturnThis() }
    const result = await handler(
      {
        query: {
          corridor_id: 'US-MX-USD-MXN',
          amount_bucket: 500,
          payin: 'bank_transfer',
          payout: 'bank_deposit',
          live: true,
        },
        headers: {},
      },
      reply,
    )

    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
    expect(Array.isArray(result.quotes)).toBe(true)
  })
})
