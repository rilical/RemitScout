import { describe, expect, it, vi } from 'vitest'

vi.mock('../shared/tracing', () => ({
  initTracing: () => undefined,
}))

describe('provider weighting SQL regression', () => {
  it('uses B2B effective rate expression for corridor and global stats', async () => {
    const { providerWeightingSql } = await import('../scripts/provider-weighting-job')
    const { providerStatsQuery, globalStatsQuery } = providerWeightingSql

    for (const sql of [providerStatsQuery, globalStatsQuery]) {
      expect(sql).toContain('NULLIF(qr.base_rate::double precision, 0)')
      expect(sql).toContain('qr.receive_amount::double precision / qr.send_amount::double precision')
      expect(sql).toContain('NULLIF(qr.implied_fx_rate::double precision, 0)')
      expect(sql).toContain('AS rate')
      expect(sql).toContain('AND (COALESCE(')
      expect(sql).not.toContain('qr.implied_fx_rate::double precision AS rate')
      expect(sql).not.toContain('AND qr.implied_fx_rate IS NOT NULL')
    }
  })
})
