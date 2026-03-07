import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockComputeMultiSignalStress = vi.hoisted(() => vi.fn())

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('../plane-b/src/triangulation/corridor-stress', () => ({
  CorridorStressCalculator: class {
    computeMultiSignalStress = (...args: unknown[]) => mockComputeMultiSignalStress(...args)
  },
}))

describe('TriangulationEngine historical inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockComputeMultiSignalStress.mockReturnValue({
      corridorId: 'US-PH-USD-PHP',
      compositeScore: 0,
      stressLevel: 'calm',
      contributingSignals: [],
      computedAt: '2026-03-07T00:00:00.000Z',
    })
  })

  it('bounds factor and stress inputs to the row date', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({
        rows: [{
          name: 'fx-gap',
          source: 'fx_mid_market',
          value: 1.23,
          confidence: 'high',
          observed_at: '2026-03-03T12:00:00.000Z',
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
    const pool = { query }

    const { TriangulationEngine } = await import('../plane-b/src/triangulation/engine')
    const engine = new TriangulationEngine(pool as any)

    await (engine as any).buildCompositeResult({
      corridor_id: 'US-PH-USD-PHP',
      amount_bucket: 500,
      method_profile: 'standard_bank',
      date: '2026-03-03',
      teer_rate: 1.2,
      rci_ratio: 0.01,
      rvi_bps: 5,
      provider_count: 4,
      suppression_flag: false,
      suppression_reason: null,
      weight_confidence: 0.8,
    })

    const factorSql = String(query.mock.calls[0][0])
    expect(factorSql).toContain("observed_at >= $2::date - INTERVAL '3 days'")
    expect(factorSql).toContain("observed_at < $2::date + INTERVAL '1 day'")

    const stressSql = String(query.mock.calls[1][0])
    expect(stressSql).toContain('detected_at <= $2')
    expect(stressSql).toContain('expires_at > $2')
    expect(query.mock.calls[1][1]).toEqual([
      'US-PH-USD-PHP',
      '2026-03-03T23:59:59.999Z',
    ])
    expect(mockComputeMultiSignalStress).toHaveBeenCalledWith(
      'US-PH-USD-PHP',
      [],
      expect.objectContaining({
        asOf: new Date('2026-03-03T23:59:59.999Z'),
      }),
    )
  })
})
