import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyRequest } from 'fastify'

import { buildPulseCacheKey } from '../shared/pulse-cache-keys'

const mockQuery = vi.fn()
const mockGetEntries = vi.fn()

vi.mock('../shared/db', () => ({
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireEntitlement: () => () => undefined,
}))

describe('pulse screener route', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    mockQuery.mockReset()
    mockGetEntries.mockReset()

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
            getIndicesSeries: vi.fn(),
            getIndicesLatest: vi.fn(),
            resolveCorridorId: vi.fn(),
          },
        },
      },
    } as any

    const { pulseRoutes } = await import('../plane-a/src/routes/pulse')
    await pulseRoutes(app)
  })

  it('returns rows with dataAvailable=false when cache entries are missing', async () => {
    mockGetEntries.mockResolvedValue([])
    mockQuery.mockResolvedValue({ rows: [] })

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/screener')?.[2] as any

    const result = await handler({
      query: { corridor_ids: 'US-PH-USD-PHP', include_movers: '0' },
    } as Partial<FastifyRequest>)

    expect(result.success).toBe(true)
    expect(result.updatedAt).toBeNull()
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].corridorId).toBe('US-PH-USD-PHP')
    expect(result.rows[0].dataAvailable).toBe(false)
    expect(result.rows[0].updatedAt).toBeNull()
    expect(result.rows[0].bestProvider).toBeNull()
    expect(result.rows[0].smartSendLevel).toBeNull()
    // Screener makes 2 batch queries: stress (triangulated_index) + indices (cdp_daily) fallback
    expect(mockQuery).toHaveBeenCalledTimes(2)
    const querySqls = mockQuery.mock.calls.map((c: any[]) => c[0] as string)
    expect(querySqls.some((sql: string) => sql.includes('FROM gold_export.triangulated_index'))).toBe(true)
    expect(querySqls.some((sql: string) => sql.includes('FROM gold_export.cdp_daily'))).toBe(true)
  })

  it('returns parsed screener metrics when all required cache entries exist', async () => {
    const filters = {
      corridor: 'usd-php',
      timeframe: '7d',
      range: null,
      amount: 1000,
      payin: 'bank',
      payout: 'bank',
    }

    const updatedAt = new Date('2026-01-02T00:00:00.000Z')

    const smartKey = buildPulseCacheKey('pulse:smart-send', filters)
    const snapshotKey = buildPulseCacheKey('pulse:market-snapshot', filters)
    const depthKey = buildPulseCacheKey('pulse:market-depth', filters)
    const bankKey = buildPulseCacheKey('pulse:bank-comparison', filters)

    mockGetEntries.mockResolvedValue([
      { key: smartKey, payload: JSON.stringify({ level: 'great', message: 'ok' }), updated_at: updatedAt },
      { key: snapshotKey, payload: JSON.stringify({ quotes: [{ provider: 'Wise', recipientGets: 56000 }] }), updated_at: updatedAt },
      { key: depthKey, payload: JSON.stringify({ spreadRangeBps: 120, providerCount: 10 }), updated_at: updatedAt },
      { key: bankKey, payload: JSON.stringify({ savings: 2.5, savingsPercent: 10 }), updated_at: updatedAt },
    ])

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/screener')?.[2] as any

    const result = await handler({
      query: { corridor_ids: 'US-PH-USD-PHP', include_movers: '0' },
    } as Partial<FastifyRequest>)

    expect(result.success).toBe(true)
    expect(result.updatedAt).toBe(updatedAt.toISOString())
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].dataAvailable).toBe(true)
    expect(result.rows[0].updatedAt).toBe(updatedAt.toISOString())
    expect(result.rows[0].smartSendLevel).toBe('great')
    expect(result.rows[0].bestProvider).toBe('Wise')
    expect(result.rows[0].bestRecipientGets).toBe(56000)
    expect(result.rows[0].spreadRangeBps).toBe(120)
    expect(result.rows[0].providerCount).toBe(10)
    expect(result.rows[0].bankSavings).toBe(2.5)
    expect(result.rows[0].bankSavingsPercent).toBe(10)
  })

  it('enriches rows with 24h movers when include_movers=true', async () => {
    const filters = {
      corridor: 'usd-php',
      timeframe: '7d',
      range: null,
      amount: 1000,
      payin: 'bank',
      payout: 'bank',
    }
    const updatedAt = new Date('2026-01-02T00:00:00.000Z')

    mockGetEntries.mockResolvedValue([
      { key: buildPulseCacheKey('pulse:smart-send', filters), payload: JSON.stringify({ level: 'good' }), updated_at: updatedAt },
      { key: buildPulseCacheKey('pulse:market-snapshot', filters), payload: JSON.stringify({ quotes: [{ provider: 'Wise', recipientGets: 56000 }] }), updated_at: updatedAt },
      { key: buildPulseCacheKey('pulse:market-depth', filters), payload: JSON.stringify({ spreadRangeBps: 120, providerCount: 10 }), updated_at: updatedAt },
      { key: buildPulseCacheKey('pulse:bank-comparison', filters), payload: JSON.stringify({ savings: 2.5, savingsPercent: 10 }), updated_at: updatedAt },
    ])

    const bucket = new Date('2026-02-01T04:00:00.000Z')
    // mockQuery is called for: movers, stress, indices fallback
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            corridor_id: 'US-PH-USD-PHP',
            current_bucket: bucket,
            current_avg_rate: 56,
            prev_avg_rate: 50,
          },
        ],
      })
      .mockResolvedValue({ rows: [] })

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/screener')?.[2] as any

    const result = await handler({
      query: { corridor_ids: 'US-PH-USD-PHP', include_movers: '1' },
    } as Partial<FastifyRequest>)

    expect(result.success).toBe(true)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].moverDeltaPct24h).toBeCloseTo(0.12)
    expect(result.rows[0].moverTimestampBucket).toBe(bucket.toISOString())
    expect(mockQuery).toHaveBeenCalled()
    const querySqls = mockQuery.mock.calls.map((c: any[]) => c[0] as string)
    expect(querySqls.some((sql: string) => sql.includes('FROM gold_export.corridor_rates'))).toBe(true)
  })
})
