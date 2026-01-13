import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { LatestQuoteRepository } from '../plane-a/src/repositories/implementations/latest-quote-repository'
import * as dbModule from '../shared/db'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

describe('LatestQuoteRepository', () => {
  let repository: LatestQuoteRepository
  let mockPool: Pool

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool
    repository = new LatestQuoteRepository(mockPool)
  })

  describe('listLatestByCorridor', () => {
    it('returns quotes for corridor', async () => {
      const mockQuotes = [
        {
          provider_id: 'remitly',
          corridor_id: 'US-MX-USD-MXN',
          amount_bucket: 500,
          payin: 'bank_transfer',
          payout: 'bank_deposit',
          payin_method: 'bank_transfer',
          payout_method: 'bank_deposit',
          delivery_time_min_minutes: 60,
          delivery_time_max_minutes: 120,
          collected_at: new Date('2024-01-01'),
          send_amount: 500,
          fee_amount: 5,
          promotional_fee_amount: null,
          receive_amount: 4950,
          implied_fx_rate: 19.8,
          promotional_rate: null,
          base_rate: 19.8,
          promotional_cap_amount: null,
          quality_flags: null,
          updated_at: new Date('2024-01-01'),
        },
      ]

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: mockQuotes,
        rowCount: 1,
      } as any)

      const result = await repository.listLatestByCorridor(
        'US-MX-USD-MXN',
        500,
        'bank_transfer',
        'bank_deposit',
      )

      expect(result).toEqual(mockQuotes)
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT provider_id'),
        ['US-MX-USD-MXN', 500, 'bank_transfer', 'bank_deposit'],
        mockPool,
      )
    })

    it('orders by receive_amount DESC and fee_amount ASC', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      await repository.listLatestByCorridor('US-MX-USD-MXN', 500, 'bank_transfer', 'bank_deposit')

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('ORDER BY receive_amount DESC, fee_amount ASC')
    })

    it('queries from silver.latest_quote_by_provider', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      await repository.listLatestByCorridor('US-MX-USD-MXN', 500, 'bank_transfer', 'bank_deposit')

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('FROM silver.latest_quote_by_provider')
    })

    it('returns empty array when no quotes found', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await repository.listLatestByCorridor(
        'US-MX-USD-MXN',
        500,
        'bank_transfer',
        'bank_deposit',
      )

      expect(result).toEqual([])
    })
  })

  describe('listLatestByProvider', () => {
    it('returns quotes for provider across corridors', async () => {
      const mockQuotes = [
        {
          corridor_id: 'US-MX-USD-MXN',
          payin: 'bank_transfer',
          payout: 'bank_deposit',
          collected_at: new Date('2024-01-01'),
          send_amount: 500,
          fee_amount: 5,
          promotional_fee_amount: null,
          total_debit_amount: 505,
          receive_amount: 4950,
          implied_fx_rate: 19.8,
          promotional_rate: null,
          base_rate: 19.8,
          promotional_cap_amount: null,
          delivery_time_min_minutes: 60,
          delivery_time_max_minutes: 120,
          quality_flags: null,
          updated_at: new Date('2024-01-01'),
        },
      ]

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: mockQuotes,
        rowCount: 1,
      } as any)

      const result = await repository.listLatestByProvider('remitly', ['US-MX-USD-MXN'])

      expect(result).toEqual(mockQuotes)
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT ON (corridor_id)'),
        ['remitly', ['US-MX-USD-MXN']],
        mockPool,
      )
    })

    it('handles multiple corridors', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      await repository.listLatestByProvider('remitly', ['US-MX-USD-MXN', 'US-PH-USD-PHP'])

      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['remitly', ['US-MX-USD-MXN', 'US-PH-USD-PHP']],
        mockPool,
      )
    })

    it('orders by corridor_id and collected_at DESC', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      await repository.listLatestByProvider('remitly', ['US-MX-USD-MXN'])

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('ORDER BY corridor_id, collected_at DESC')
    })

    it('returns empty array when no quotes found', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await repository.listLatestByProvider('remitly', ['US-MX-USD-MXN'])

      expect(result).toEqual([])
    })
  })
})




