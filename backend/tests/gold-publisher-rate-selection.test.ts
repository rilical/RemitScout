import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryMock = vi.fn()

vi.mock('../shared/db', () => ({
  query: queryMock,
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

describe('Gold publisher effective rate selection', () => {
  beforeEach(() => {
    queryMock.mockReset()
  })

  it('aggregates batch publisher rates from effective_fx_rate and not raw implied rate', async () => {
    queryMock.mockResolvedValue({
      rows: [
        { provider_id: 'a', effective_fx_rate: 20, collected_at: new Date('2026-02-01T00:00:00.000Z') },
        { provider_id: 'a', effective_fx_rate: 22, collected_at: new Date('2026-02-01T00:10:00.000Z') },
        { provider_id: 'b', effective_fx_rate: 24, collected_at: new Date('2026-02-01T00:20:00.000Z') },
      ],
    })

    const { GoldPublisher } = await import('../plane-c/src/services/gold-publisher')
    const publisher = new GoldPublisher({} as never)
    const aggregated = await publisher.aggregateCorridorData('US-MX-USD-MXN')

    expect(aggregated).not.toBeNull()
    expect(aggregated?.avgRate).toBeCloseTo(22.5, 8)
    expect(aggregated?.minRate).toBeCloseTo(21, 8)
    expect(aggregated?.maxRate).toBeCloseTo(24, 8)

    const [sql] = queryMock.mock.calls[0] as [string]
    expect(sql).toContain('AS effective_fx_rate')
    expect(sql).toContain('NULLIF(qr.base_rate::double precision, 0)')
    expect(sql).toContain('qr.receive_amount::double precision / qr.send_amount::double precision')
    expect(sql).not.toContain('SELECT qr.provider_id, qr.implied_fx_rate, qr.collected_at')
  })

  it('aggregates live publisher rates from effective_fx_rate', async () => {
    queryMock.mockResolvedValue({
      rows: [
        { provider_id: 'a', effective_fx_rate: 20, collected_at: new Date('2026-02-01T00:00:00.000Z') },
        { provider_id: 'a', effective_fx_rate: 22, collected_at: new Date('2026-02-01T00:10:00.000Z') },
        { provider_id: 'b', effective_fx_rate: 24, collected_at: new Date('2026-02-01T00:20:00.000Z') },
      ],
    })

    const { GoldPublisherLive } = await import('../plane-c/src/services/gold-publisher-live')
    const publisher = new GoldPublisherLive({} as never, {} as never)
    const aggregated = await publisher.aggregateCorridorData('US-MX-USD-MXN')

    expect(aggregated).not.toBeNull()
    expect(aggregated?.avgRate).toBeCloseTo(22, 8)
    expect(aggregated?.minRate).toBeCloseTo(20, 8)
    expect(aggregated?.maxRate).toBeCloseTo(24, 8)

    const [sql] = queryMock.mock.calls[0] as [string]
    expect(sql).toContain('AS effective_fx_rate')
    expect(sql).toContain('NULLIF(qr.base_rate::double precision, 0)')
    expect(sql).toContain('qr.receive_amount::double precision / qr.send_amount::double precision')
    expect(sql).not.toContain('SELECT qr.provider_id, qr.implied_fx_rate, qr.collected_at')
  })
})
