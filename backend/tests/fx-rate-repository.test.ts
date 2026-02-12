import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import * as dbModule from '../shared/db'
import { resetRedisState } from '../shared/redis'
import { resetCircuitBreakers } from '../shared/repository-retry'

const mockConfig = vi.hoisted(() => ({
  redis: { url: '' },
  fxRates: { oandaFallbackEnabled: false },
  observability: { cloudwatch: { enabled: false } },
}))

vi.mock('../shared/config', () => ({ config: mockConfig }))

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
    mockPool = {} as Pool
    repository = new FxRateRepository(mockPool)
  })

  describe('getRate', () => {
    it('returns rate when found', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: 1.25 }],
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
        rows: [{ rate: null }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBeNull()
    })

    it('returns null when rate is undefined', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: undefined }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBeNull()
    })

    it('returns null when rate is not finite', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: Infinity }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBeNull()
    })

    it('returns null when rate is NaN', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: NaN }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBeNull()
    })

    it('converts string rate to number', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: '1.25' }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBe(1.25)
      expect(typeof rate).toBe('number')
    })

    it('handles various currency pairs', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: 0.85 }],
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
        rows: [{ rate: 0 }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBe(0)
    })

    it('handles negative rate', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [{ rate: -1.25 }],
        rowCount: 1,
      } as any)

      const rate = await repository.getRate('USD', 'EUR')

      expect(rate).toBe(-1.25)
    })
  })
})

