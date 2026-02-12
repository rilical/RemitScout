import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ValidationError } from '../shared/errors'

const mockGetEntries = vi.fn()
const mockGetIndicesSeries = vi.fn()
const mockResolveCorridorId = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireEntitlement: () => () => undefined,
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

    app = {
      get: vi.fn(),
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
})
