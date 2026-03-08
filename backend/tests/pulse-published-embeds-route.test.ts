import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockQuery = vi.fn()
const mockGetEntries = vi.fn()
const mockRequireEntitlement = vi.fn((entitlement: string) => {
  const handler = vi.fn()
  ;(handler as any).entitlement = entitlement
  return handler
})
const mockLogAuditEvent = vi.fn()
const mockPublishedEmbedCount = vi.fn()
const mockPublishedEmbedCreate = vi.fn()
const mockPublishedEmbedGetById = vi.fn()

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
    delete: vi.fn(),
    container: {
      pool: {},
      repositories: {
        pulseCache: {
          getEntries: mockGetEntries,
        },
        goldIndices: {
          getIndicesSeries: vi.fn(),
          getIndicesLatest: vi.fn(),
          resolveCorridorId: vi.fn(),
        },
        comparisonHistory: {},
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

describe('pulse published embeds routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockResolvedValue({ rows: [{ count: 1 }] })
    mockGetEntries.mockResolvedValue([
      {
        key: 'pulse:chart:leader-edge',
        payload: JSON.stringify({
          metadata: {
            title: 'Leader Edge vs #2',
            unit: 'bps',
            unitLabel: 'bps',
            lastUpdated: '2026-03-05T12:00:00.000Z',
          },
          series: [],
          insight: 'Stable lead.',
        }),
        updated_at: new Date('2026-03-05T12:00:00.000Z'),
      },
    ])
    mockPublishedEmbedCount.mockResolvedValue(0)
    mockPublishedEmbedCreate.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174001',
      owner_user_id: 'user-1',
      surface_kind: 'pulse',
      chart_key: 'leader-edge',
      index_key: null,
      title: 'Leader Edge vs #2',
      theme: 'dark',
      filters_json: {},
      payload_json: {
        chartId: 'leader-edge',
        chart: {
          metadata: {
            title: 'Leader Edge vs #2',
            unit: 'bps',
            unitLabel: 'bps',
            lastUpdated: '2026-03-05T12:00:00.000Z',
          },
          series: [],
          insight: 'Stable lead.',
          dataAvailable: true,
          updatedAt: '2026-03-05T12:00:00.000Z',
          source: 'gold_cache',
        },
        filters: {
          corridor: 'global',
          corridorId: 'US-PH-USD-PHP',
          amount: 500,
          fundingMethod: 'bank',
          payoutMethod: 'bank',
          range: '30d',
        },
        corridorLabel: 'USD → PHP',
        theme: 'dark',
      },
      created_at: new Date('2026-03-05T12:00:00.000Z'),
      published_at: new Date('2026-03-05T12:00:00.000Z'),
      revoked_at: null,
    })
    mockPublishedEmbedGetById.mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174001',
      owner_user_id: 'user-1',
      surface_kind: 'pulse',
      chart_key: 'leader-edge',
      index_key: null,
      title: 'Leader Edge vs #2',
      theme: 'dark',
      filters_json: {},
      payload_json: {
        chartId: 'leader-edge',
        chart: {
          metadata: {
            title: 'Leader Edge vs #2',
            unit: 'bps',
            unitLabel: 'bps',
            lastUpdated: '2026-03-05T12:00:00.000Z',
          },
          series: [],
          insight: 'Stable lead.',
          dataAvailable: true,
          updatedAt: '2026-03-05T12:00:00.000Z',
          source: 'gold_cache',
        },
        filters: {
          corridor: 'global',
          corridorId: 'US-PH-USD-PHP',
          amount: 500,
          fundingMethod: 'bank',
          payoutMethod: 'bank',
          range: '30d',
        },
        corridorLabel: 'USD → PHP',
        theme: 'dark',
      },
      created_at: new Date('2026-03-05T12:00:00.000Z'),
      published_at: new Date('2026-03-05T12:00:00.000Z'),
      revoked_at: null,
    })
  })

  it('persists a pulse published embed and returns a durable public URL', async () => {
    const app = makeApp()
    const { pulseRoutes } = await import('../plane-a/src/routes/pulse')
    await pulseRoutes(app)

    const handler = getHandler(app, 'post', '/pulse/published-embeds')
    const reply = { code: vi.fn().mockReturnThis() } as any

    const response = await handler({
      body: {
        chart_id: 'leader-edge',
        corridor_id: 'US-PH-USD-PHP',
        amount: 500,
        funding_method: 'bank',
        payout_method: 'bank',
        range: '30d',
        theme: 'dark',
      },
      query: {},
      user: {
        user_id: 'user-1',
        role: 'user',
      },
    }, reply)

    expect(response.success).toBe(true)
    expect(response.publishedId).toBe('123e4567-e89b-12d3-a456-426614174001')
    expect(response.publicUrl).toContain('/embed/pulse/leader-edge?published_id=123e4567-e89b-12d3-a456-426614174001')
    expect(response.variants).toHaveLength(1)
    expect(mockPublishedEmbedCreate).toHaveBeenCalledWith(expect.objectContaining({
      owner_user_id: 'user-1',
      surface_kind: 'pulse',
      chart_key: 'leader-edge',
      theme: 'dark',
    }))
  })

  it('serves published embeds from durable storage', async () => {
    const app = makeApp()
    const { pulseRoutes } = await import('../plane-a/src/routes/pulse')
    await pulseRoutes(app)

    const handler = getHandler(app, 'get', '/public/pulse/published-embeds/:id')
    const reply = { code: vi.fn().mockReturnThis(), header: vi.fn() } as any

    const response = await handler({
      params: {
        id: '123e4567-e89b-12d3-a456-426614174001',
      },
    }, reply)

    expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=600')
    expect(response.publishedId).toBe('123e4567-e89b-12d3-a456-426614174001')
    expect(response.chartId).toBe('leader-edge')
    expect(response.theme).toBe('dark')
  })

  it('returns a dedicated revoked contract for removed published embeds', async () => {
    mockPublishedEmbedGetById.mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174001',
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

    const app = makeApp()
    const { pulseRoutes } = await import('../plane-a/src/routes/pulse')
    await pulseRoutes(app)

    const handler = getHandler(app, 'get', '/public/pulse/published-embeds/:id')
    const reply = { code: vi.fn().mockReturnThis(), header: vi.fn() } as any

    const response = await handler({
      params: {
        id: '123e4567-e89b-12d3-a456-426614174001',
      },
    }, reply)

    expect(reply.code).toHaveBeenCalledWith(410)
    expect(response).toEqual({
      error: 'published_embed_revoked',
      message: 'Published embed has been removed by the publisher.',
    })
  })
})
