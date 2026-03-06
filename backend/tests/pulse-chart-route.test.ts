import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ValidationError } from '../shared/errors'

const mockGetEntries = vi.fn()
const mockGetIndicesSeries = vi.fn()
const mockResolveCorridorId = vi.fn()
const mockRequireEntitlement = vi.fn((entitlement: string) => {
  const handler = vi.fn()
  ;(handler as any).entitlement = entitlement
  return handler
})
const mockPulseEmbedSnapshotCacheGet = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
}))

vi.mock('../shared/cache', () => ({
  createTtlCache: vi.fn(({ namespace }: { namespace?: string }) => ({
    get: namespace === 'plane_a:pulse_embed_snapshot' ? mockPulseEmbedSnapshotCacheGet : vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireEntitlement: (...args: unknown[]) => mockRequireEntitlement(...args as [string]),
}))

describe('pulse chart route', () => {
  let app: FastifyInstance
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockGetEntries.mockClear()
    mockGetIndicesSeries.mockReset()
    mockResolveCorridorId.mockReset()
    mockRequireEntitlement.mockClear()
    mockPulseEmbedSnapshotCacheGet.mockReset()

    app = {
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
            getIndicesSeries: mockGetIndicesSeries,
            getIndicesLatest: vi.fn(),
            resolveCorridorId: mockResolveCorridorId,
          },
        },
      },
    } as any

    mockRequest = {
      params: { chartId: 'leader-edge' },
      query: {},
    }

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn(),
    }

    const { pulseRoutes } = await import('../plane-a/src/routes/pulse')
    await pulseRoutes(app as FastifyInstance)
  })

  it('normalizes chart payload and stamps lastUpdated', async () => {
    const updatedAt = new Date('2025-01-01T00:00:00.000Z')
    mockGetEntries.mockResolvedValue([
      {
        key: 'pulse:chart:leader-edge',
        payload: JSON.stringify({ series: [], insight: 'ok' }),
        updated_at: updatedAt,
      },
    ])

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts/:chartId')?.[2] as any

    const result = await handler(mockRequest, mockReply)

    expect(result.metadata.lastUpdated).toBe(updatedAt.toISOString())
    expect(result.series).toEqual([])
    expect(result.insight).toBe('ok')
  })

  it('maps all-in-cost to RCI percent and filters suppressed points', async () => {
    const updatedAt = new Date('2025-01-02T00:00:00.000Z')
    mockGetIndicesSeries.mockResolvedValue([
      {
        date: new Date('2025-01-01T00:00:00.000Z'),
        teer_rate: 1.1,
        rci_ratio: 0.025,
        rvi_bps: 12,
        mid_market_rate: 1.2,
        suppression_flag: false,
        created_at: updatedAt,
      },
      {
        date: new Date('2025-01-02T00:00:00.000Z'),
        teer_rate: 1.1,
        rci_ratio: 0.03,
        rvi_bps: 15,
        mid_market_rate: 1.2,
        suppression_flag: true,
        created_at: updatedAt,
      },
    ])

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts/:chartId')?.[2] as any

    const result = await handler(
      {
        params: { chartId: 'all-in-cost' },
        query: { corridor_id: 'US-PH-USD-PHP', range: '30d' },
      } as Partial<FastifyRequest>,
      mockReply,
    )

    expect(result.series).toHaveLength(1)
    expect(result.series[0].points).toHaveLength(1)
    expect(result.series[0].points[0].v).toBeCloseTo(2.5)
  })

  it('returns truthful no-data metadata for indices batch responses', async () => {
    mockGetIndicesSeries.mockResolvedValue([])

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts')?.[2] as any

    const result = await handler(
      {
        query: {
          chart_ids: 'indices-confidence',
          corridor_id: 'US-PH-USD-PHP',
          range: '30d',
        },
      } as Partial<FastifyRequest>,
      mockReply,
    )

    expect(result.success).toBe(true)
    expect(result.dataAvailable).toBe(false)
    expect(result.updatedAt).toBeNull()
    expect(result.charts).toHaveLength(1)
    expect(result.charts[0]).toMatchObject({
      id: 'indices-confidence',
      dataAvailable: false,
      updatedAt: null,
      source: 'gold_export',
    })
    expect(result.charts[0].chart.dataAvailable).toBe(false)
    expect(result.charts[0].chart.updatedAt).toBeNull()
    expect(result.charts[0].chart.source).toBe('gold_export')
  })

  it('returns truthful no-data metadata for indices single-chart responses', async () => {
    mockGetIndicesSeries.mockResolvedValue([])

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts/:chartId')?.[2] as any

    const result = await handler(
      {
        params: { chartId: 'indices-provider-count' },
        query: {
          corridor_id: 'US-PH-USD-PHP',
          range: '30d',
        },
      } as Partial<FastifyRequest>,
      mockReply,
    )

    expect(result.dataAvailable).toBe(false)
    expect(result.updatedAt).toBeNull()
    expect(result.source).toBe('gold_export')
  })

  it('throws validation error when chartId param is missing', async () => {
    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts/:chartId')?.[2] as any

    const invalidRequest = handler(
      {
        params: {},
        query: {},
      } as Partial<FastifyRequest>,
      mockReply,
    )
    await expect(invalidRequest).rejects.toBeInstanceOf(ValidationError)
    await expect(invalidRequest).rejects.toMatchObject({
      statusCode: 400,
      code: 'validation_error',
    })
  })

  it('clamps non-full requests to 30d/90d at API level', async () => {
    mockGetEntries.mockResolvedValue([
      {
        key: 'pulse:chart:leader-edge',
        payload: JSON.stringify({ series: [], insight: 'ok' }),
        updated_at: new Date('2025-01-01T00:00:00.000Z'),
      },
    ])

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts/:chartId')?.[2] as any

    await handler(
      {
        params: { chartId: 'leader-edge' },
        query: {
          corridor: 'usd-php',
          timeframe: '365d',
          range: '365d',
          amount: 500,
          payin: 'bank',
          payout: 'bank',
        },
        entitlementsContext: { entitlements: { pulse_access: 'lite' } },
      } as Partial<FastifyRequest>,
      mockReply,
    )

    const candidates = mockGetEntries.mock.calls[0]?.[0] as string[]
    expect(Array.isArray(candidates)).toBe(true)
    expect(candidates[0]).toContain('timeframe=30d')
    expect(candidates[0]).toContain('range=90d')
  })

  it('forces teaser charts to 7d preview for non-full users', async () => {
    const updatedAt = new Date('2025-01-02T00:00:00.000Z')
    mockGetEntries.mockImplementation(async (keys: string[]) => ([
      {
        key: keys[0],
        payload: JSON.stringify({
          metadata: { id: 'provider-winner', title: 'Provider winner', unit: 'percent' },
          series: [],
          insight: 'ok',
        }),
        updated_at: updatedAt,
      },
    ]))

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts/:chartId')?.[2] as any

    const result = await handler(
      {
        params: { chartId: 'provider-winner' },
        query: {
          corridor: 'usd-php',
          timeframe: '365d',
          range: '365d',
          amount: 500,
          payin: 'bank',
          payout: 'bank',
        },
        entitlementsContext: { entitlements: { pulse_access: 'lite' } },
      } as Partial<FastifyRequest>,
      mockReply,
    )

    expect(result.previewLocked).toBe(true)
    const candidates = mockGetEntries.mock.calls[0]?.[0] as string[]
    expect(Array.isArray(candidates)).toBe(true)
    expect(candidates[0]).toContain('timeframe=7d')
    expect(candidates[0]).toContain('range=7d')
  })

  it('denies enterprise-only charts for non-full users', async () => {
    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts/:chartId')?.[2] as any

    const reply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn(),
    }

    await handler(
      {
        params: { chartId: 'corridor-liquidity' },
        query: {},
        entitlementsContext: { entitlements: { pulse_access: 'lite' } },
      } as Partial<FastifyRequest>,
      reply as any,
    )

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({ error: 'forbidden', entitlement: 'pulse_full' })
  })

  it('keeps Pulse embed snapshot generation behind the pulse_embed guard', () => {
    const routeCall = vi
      .mocked(app.post)
      .mock.calls.find((call) => call[0] === '/pulse/embed-snapshots')

    expect(mockRequireEntitlement).toHaveBeenCalledWith('pulse_embed')
    expect(routeCall?.[1]).toMatchObject({
      preHandler: expect.any(Function),
    })
    expect((routeCall?.[1] as { preHandler?: { entitlement?: string } }).preHandler?.entitlement).toBe('pulse_embed')
  })

  it('allows anonymous access to a public Pulse snapshot when it exists', async () => {
    const snapshot = {
      chartId: 'all-in-cost',
      chart: {
        metadata: {
          title: 'All-in Cost',
          lastUpdated: '2026-03-05T12:00:00.000Z',
          unit: 'percent',
          unitLabel: '%',
        },
        series: [],
        insight: '',
        updatedAt: '2026-03-05T12:00:00.000Z',
      },
      filters: {
        corridor: 'usd-php',
        corridorId: 'US-PH-USD-PHP',
        amount: 500,
        fundingMethod: 'bank',
        payoutMethod: 'bank',
        range: '30d',
      },
      corridorLabel: 'USD to PHP',
      createdAt: '2026-03-05T12:00:00.000Z',
      expiresAt: '2026-04-04T12:00:00.000Z',
    }
    mockPulseEmbedSnapshotCacheGet.mockResolvedValue(snapshot)

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/public/pulse/embed-snapshots/:snapshotId')?.[1] as any

    const reply = {
      code: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
    }

    const result = await handler(
      { params: { snapshotId: '123e4567e89b12d3a456426614174000' } } as Partial<FastifyRequest>,
      reply,
    )

    expect(result).toEqual(snapshot)
    expect(reply.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300')
  })

  it('returns not_found for expired public Pulse snapshots', async () => {
    mockPulseEmbedSnapshotCacheGet.mockResolvedValue(null)

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/public/pulse/embed-snapshots/:snapshotId')?.[1] as any

    const reply = {
      code: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
    }

    const result = await handler(
      { params: { snapshotId: '123e4567e89b12d3a456426614174000' } } as Partial<FastifyRequest>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(404)
    expect(result).toEqual({
      error: 'not_found',
      message: 'Embed snapshot not found or expired.',
    })
  })

  it('rejects invalid public Pulse snapshot ids', async () => {
    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/public/pulse/embed-snapshots/:snapshotId')?.[1] as any

    await expect(handler(
      { params: { snapshotId: 'bad-id' } } as Partial<FastifyRequest>,
      mockReply,
    )).rejects.toBeInstanceOf(ValidationError)

    await expect(handler(
      { params: { snapshotId: 'bad-id' } } as Partial<FastifyRequest>,
      mockReply,
    )).rejects.toMatchObject({
      statusCode: 400,
      code: 'validation_error',
    })
  })
})
