import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import * as dbModule from '../shared/db'
import { resetRedisState } from '../shared/redis'
import { resetCircuitBreakers } from '../shared/repository-retry'

const mockFetchRate = vi.fn()

const mockConfig = vi.hoisted(() => ({
  redis: { url: '' },
  fxRates: { oandaFallbackEnabled: false, refreshEnabled: false, dbFreshnessHours: 1 },
  observability: { cloudwatch: { enabled: false } },
}))

vi.mock('../shared/config', () => ({ config: mockConfig }))

vi.mock('../plane-a/src/services/oanda-rate-fetcher', () => ({
  OandaRateFetcher: vi.fn().mockImplementation(() => ({
    fetchRate: (...args: any[]) => mockFetchRate(...args),
  })),
}))

import { FxRateRepository } from '../plane-a/src/repositories/implementations/fx-rate-repository'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

describe('FxRateRepository', () => {
  let repository: FxRateRepository
  let mockPool: Pool

  beforeEach(() => {
    vi.clearAllMocks()
    resetRedisState()
    resetCircuitBreakers()
    mockFetchRate.mockResolvedValue({ success: false, data: null })
    mockPool = {} as Pool
    repository = new FxRateRepository(mockPool)
  })

  describe('getRate', () => {
    it('returns rate when found', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: 1.25, last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBe(1.25)
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM gold.fx_rates'),
        ['USD', 'EUR'],
        mockPool,
      )
    })

    it('returns null when rate not found', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const rate = await repository.getRate('USD', 'XYZ')

      expect(rate).toBeNull()
    })

    it('returns null when rate is null in database', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: null, last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBeNull()
    })

    it('returns null when rate is undefined', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: undefined, last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBeNull()
    })

    it('returns null when rate is not finite', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: Infinity, last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBeNull()
    })

    it('returns null when rate is NaN', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: NaN, last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBeNull()
    })

    it('converts string rate to number', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: '1.25', last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBe(1.25)
      expect(typeof rate).toBe('number')
    })

    it('handles various currency pairs', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: 0.85, last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('EUR', 'GBP')

      expect(rate).toBe(0.85)
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['EUR', 'GBP'],
        mockPool,
      )
    })

    it('handles zero rate', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: 0, last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBe(0)
    })

    it('handles negative rate', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: -1.25, last_updated: new Date().toISOString() }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBe(-1.25)
    })
  })
})
