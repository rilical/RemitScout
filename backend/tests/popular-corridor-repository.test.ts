import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { PopularCorridorRepository } from '../plane-a/src/repositories/implementations/popular-corridor-repository'
import * as dbModule from '../shared/db'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

describe('PopularCorridorRepository', () => {
  let repository: PopularCorridorRepository
  let mockPool: Pool

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool
    repository = new PopularCorridorRepository(mockPool)
  })

  describe('listPopularCorridors', () => {
    it('returns list of popular corridors', async () => {
      const mockCorridors = [
        {
          route: 'US-MX',
          count_24h: 100,
          top_provider: 'remitly',
          fee_range: '$0-5',
          speed_range: '1-2 days',
          best_for: 'low fees',
          updated_at: new Date('2024-01-01'),
        },
        {
          route: 'GB-PH',
          count_24h: 50,
          top_provider: 'wise',
          fee_range: '$5-10',
          speed_range: '2-3 days',
          best_for: 'speed',
          updated_at: new Date('2024-01-02'),
        },
      ]

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: mockCorridors,
        rowCount: 2,
      } as any)

      const result = await repository.listPopularCorridors()

      expect(result).toEqual(mockCorridors)
      expect(result).toHaveLength(2)
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT route'),
        [],
        mockPool,
      )
    })

    it('returns empty array when no corridors found', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await repository.listPopularCorridors()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('orders by count_24h DESC', async () => {
      const mockCorridors = [
        { route: 'US-MX', count_24h: 100 },
        { route: 'GB-PH', count_24h: 50 },
      ]

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: mockCorridors,
        rowCount: 2,
      } as any)

      await repository.listPopularCorridors()

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('ORDER BY count_24h DESC')
    })

    it('selects all required fields', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      await repository.listPopularCorridors()

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('route')
      expect(queryCall).toContain('count_24h')
      expect(queryCall).toContain('top_provider')
      expect(queryCall).toContain('fee_range')
      expect(queryCall).toContain('speed_range')
      expect(queryCall).toContain('best_for')
      expect(queryCall).toContain('updated_at')
    })

    it('queries from gold.popular_corridors table', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      await repository.listPopularCorridors()

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('FROM gold.popular_corridors')
    })

    it('handles corridors with null optional fields', async () => {
      const mockCorridors = [
        {
          route: 'US-MX',
          count_24h: 100,
          top_provider: null,
          fee_range: null,
          speed_range: null,
          best_for: null,
          updated_at: null,
        },
      ]

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: mockCorridors,
        rowCount: 1,
      } as any)

      const result = await repository.listPopularCorridors()

      expect(result).toEqual(mockCorridors)
      expect(result[0].top_provider).toBeNull()
    })
  })
})



