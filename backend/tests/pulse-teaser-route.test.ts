import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockQuery = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: (...args: any[]) => mockQuery(...args),
}))

describe('pulse teaser route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockReset()
  })

  it('returns empty movers when gold_export has no rows', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const app = { get: vi.fn() } as any as FastifyInstance
    const { pulseTeaserRoutes } = await import('../plane-a/src/routes/pulse-teaser')
    await pulseTeaserRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((c) => c[0] === '/pulse/teaser')?.[1] as any
    const result = await handler({ query: {} } as any, { code: vi.fn().mockReturnThis() } as any)

    expect(result.success).toBe(true)
    expect(result.updatedAt).toBeNull()
    expect(result.movers).toEqual([])
  })

  it('computes movers using latest vs previous bucket and sorts by absolute delta', async () => {
    const bucketA = new Date('2026-01-01T04:00:00.000Z')
    const bucketB = new Date('2026-01-01T08:00:00.000Z')

    mockQuery.mockResolvedValue({
      rows: [
        {
          corridor_id: 'US-PH-USD-PHP',
          current_bucket: bucketB,
          current_avg_rate: 56,
          current_provider_count: 12,
          prev_avg_rate: 50,
        },
        {
          corridor_id: 'US-MX-USD-MXN',
          current_bucket: bucketA,
          current_avg_rate: 17,
          current_provider_count: 9,
          prev_avg_rate: 17.5,
        },
      ],
    })

    const app = { get: vi.fn() } as any as FastifyInstance
    const { pulseTeaserRoutes } = await import('../plane-a/src/routes/pulse-teaser')
    await pulseTeaserRoutes(app)

    const handler = vi.mocked(app.get).mock.calls.find((c) => c[0] === '/pulse/teaser')?.[1] as any
    const result = await handler({ query: { limit: '2' } } as any, { code: vi.fn().mockReturnThis() } as any)

    expect(result.success).toBe(true)
    expect(result.movers).toHaveLength(2)

    // First item should be the larger absolute mover: (56-50)/50 = +0.12
    expect(result.movers[0].corridorId).toBe('US-PH-USD-PHP')
    expect(result.movers[0].deltaPct).toBeCloseTo(0.12)
    expect(result.movers[0].providerCount).toBe(12)
    expect(result.updatedAt).toBe(bucketB.toISOString())
  })
})

