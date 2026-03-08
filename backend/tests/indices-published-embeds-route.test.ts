import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockQuery = vi.fn()
const mockRequireEntitlement = vi.fn((entitlement: string) => {
  const handler = vi.fn()
  ;(handler as any).entitlement = entitlement
  return handler
})
const mockLogAuditEvent = vi.fn()
const mockPublishedEmbedCount = vi.fn()
const mockPublishedEmbedCreate = vi.fn()
const mockPublishedEmbedGetById = vi.fn()
const mockGetAvailability = vi.fn()
const mockGetIndicesSeries = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: (...args: unknown[]) => mockQuery(...args),
}))

vi.mock('../shared/cache', () => ({
  createTtlCache: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireEntitlement: (...args: unknown[]) => mockRequireEntitlement(...args as [string]),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
  getRequestContext: vi.fn(() => ({})),
}))

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    container: {
      pool: {},
      repositories: {
        goldIndices: {
          getAvailability: mockGetAvailability,
          getIndicesSeries: mockGetIndicesSeries,
          getIndicesLatest: vi.fn(),
        },
        publishedEmbed: {
          countActiveByOwnerUserId: mockPublishedEmbedCount,
          create: mockPublishedEmbedCreate,
          getById: mockPublishedEmbedGetById,
        },
      },
    },
  }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'get' | 'post', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as unknown as (request: any, reply: any) => Promise<any>
}

describe('indices published embeds routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockResolvedValue({ rows: [{ count: 1 }] })
    mockGetAvailability.mockResolvedValue({
      min_date: new Date('2026-02-05T00:00:00.000Z'),
      max_date: new Date('2026-03-05T00:00:00.000Z'),
    })
    mockGetIndicesSeries.mockResolvedValue([
      {
        date: new Date('2026-03-05T00:00:00.000Z'),
        teer_rate: 1.23,
        rci_ratio: 0.02,
        rvi_bps: 12.5,
        provider_count_binned: 5,
        provider_count: 5,
        suppression_flag: false,
        suppression_reason: null,
        mid_market_rate: 1.25,
        weight_confidence: 0.8,
        weight_window_days: 30,
        weighting_model: 'synthetic_seed_v1',
        methodology_version: 'indices_v2',
        created_at: new Date('2026-03-05T06:00:00.000Z'),
      },
    ])
    mockPublishedEmbedCount.mockResolvedValue(0)
    mockPublishedEmbedCreate.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174002',
      owner_user_id: 'user-1',
      surface_kind: 'indices',
      chart_key: null,
      index_key: 'bundle',
      title: 'TEER / RCI / RVI · US-PH-USD-PHP',
      theme: 'dark',
      filters_json: {},
      payload_json: {
        corridorId: 'US-PH-USD-PHP',
        amountBucket: 500,
        methodProfile: 'standard_bank',
        weightingModel: 'synthetic_seed_v1',
        methodologyVersion: 'indices_v2',
        weightConfidence: 0.8,
        weightWindowDays: 30,
        lastUpdated: '2026-03-05T06:00:00.000Z',
        dataTier: 2,
        cadenceMinutes: 60,
        exportCadenceMinutes: 60,
        collectionCadenceMinutes: 60,
        collectionTier: 'tier_2',
        isUsdOrigin: true,
        theme: 'dark',
        series: [
          {
            date: '2026-03-05',
            teer: 1.23,
            rci: 0.02,
            rvi_bps: 12.5,
            providerCountBinned: 5,
            providerCount: 5,
            suppressionFlag: false,
            suppressionReason: null,
            suppressionReasonCode: null,
            suppressionReasonDescription: null,
            midMarketRate: 1.25,
            weightConfidence: 0.8,
            weightWindowDays: 30,
          },
        ],
        dataWindow: {
          requestedDays: 30,
          availableDays: 30,
          returnedDays: 1,
          availableStartDate: '2026-02-05',
          availableEndDate: '2026-03-05',
          startDate: '2026-02-05',
          endDate: '2026-03-05',
          capped: false,
        },
      },
      created_at: new Date('2026-03-05T12:00:00.000Z'),
      published_at: new Date('2026-03-05T12:00:00.000Z'),
      revoked_at: null,
    })
    mockPublishedEmbedGetById.mockResolvedValue(null)
  })

  it('persists an indices published embed and returns durable variant URLs', async () => {
    const app = makeApp()
    const { indicesRoutes } = await import('../plane-a/src/routes/indices')
    await indicesRoutes(app)

    const handler = getHandler(app, 'post', '/indices/published-embeds')
    const reply = { code: vi.fn().mockReturnThis() } as any

    const response = await handler({
      body: {
        corridor_id: 'US-PH-USD-PHP',
        amount_bucket: 500,
        method_profile: 'standard_bank',
        days: 30,
        theme: 'dark',
      },
      user: {
        user_id: 'user-1',
        role: 'user',
      },
    }, reply)

    expect(response.success).toBe(true)
    expect(response.publishedId).toBe('123e4567-e89b-12d3-a456-426614174002')
    expect(response.variants).toHaveLength(3)
    expect(response.variants[0].publicUrl).toContain('/embed/indices/teer?published_id=123e4567-e89b-12d3-a456-426614174002')
    expect(mockPublishedEmbedCreate).toHaveBeenCalledWith(expect.objectContaining({
      owner_user_id: 'user-1',
      surface_kind: 'indices',
      index_key: 'bundle',
      theme: 'dark',
    }))
  })

  it('returns a stable cap error when the published embed limit is reached', async () => {
    mockPublishedEmbedCount.mockResolvedValueOnce(100)

    const app = makeApp()
    const { indicesRoutes } = await import('../plane-a/src/routes/indices')
    await indicesRoutes(app)

    const handler = getHandler(app, 'post', '/indices/published-embeds')
    const reply = { code: vi.fn().mockReturnThis() } as any

    const response = await handler({
      body: {
        corridor_id: 'US-PH-USD-PHP',
        amount_bucket: 500,
        method_profile: 'standard_bank',
        days: 30,
        theme: 'dark',
      },
      user: {
        user_id: 'user-1',
        role: 'user',
      },
    }, reply)

    expect(reply.code).toHaveBeenCalledWith(409)
    expect(response.error).toBe('published_embed_limit_reached')
  })

  it('serves published indices embeds from durable storage', async () => {
    mockPublishedEmbedGetById.mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174002',
      owner_user_id: 'user-1',
      surface_kind: 'indices',
      chart_key: null,
      index_key: 'bundle',
      title: 'TEER / RCI / RVI · US-PH-USD-PHP',
      theme: 'dark',
      filters_json: {},
      payload_json: {
        corridorId: 'US-PH-USD-PHP',
        amountBucket: 500,
        methodProfile: 'standard_bank',
        weightingModel: 'synthetic_seed_v1',
        methodologyVersion: 'indices_v2',
        weightConfidence: 0.8,
        weightWindowDays: 30,
        lastUpdated: '2026-03-05T06:00:00.000Z',
        dataTier: 2,
        cadenceMinutes: 60,
        exportCadenceMinutes: 60,
        collectionCadenceMinutes: 60,
        collectionTier: 'tier_2',
        isUsdOrigin: true,
        theme: 'dark',
        series: [],
        dataWindow: {
          requestedDays: 30,
          availableDays: 30,
          returnedDays: 0,
          availableStartDate: '2026-02-05',
          availableEndDate: '2026-03-05',
          startDate: '2026-02-05',
          endDate: '2026-03-05',
          capped: false,
        },
      },
      created_at: new Date('2026-03-05T12:00:00.000Z'),
      published_at: new Date('2026-03-05T12:00:00.000Z'),
      revoked_at: null,
    })

    const app = makeApp()
    const { indicesRoutes } = await import('../plane-a/src/routes/indices')
    await indicesRoutes(app)

    const handler = getHandler(app, 'get', '/public/indices/published-embeds/:id')
    const reply = { code: vi.fn().mockReturnThis(), header: vi.fn() } as any

    const response = await handler({
      params: {
        id: '123e4567-e89b-12d3-a456-426614174002',
      },
    }, reply)

    expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=600')
    expect(response.publishedId).toBe('123e4567-e89b-12d3-a456-426614174002')
    expect(response.theme).toBe('dark')
  })
})
