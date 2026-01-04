import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { PlanUsageRepository } from '../plane-a/src/repositories/implementations/plan-usage-repository'
import * as dbModule from '../../shared/db'

vi.mock('../../shared/db', () => ({
  query: vi.fn(),
}))

describe('PlanUsageRepository', () => {
  let repository: PlanUsageRepository
  let mockPool: Pool

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool
    repository = new PlanUsageRepository(mockPool)
  })

  describe('getUsageForUser', () => {
    it('returns usage records for user', async () => {
      const mockUsage = [
        { scope: 'quotes', count: 10 },
        { scope: 'exports', count: 5 },
        { scope: 'alerts', count: 2 },
      ]

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: mockUsage,
        rowCount: 3,
      } as any)

      const result = await repository.getUsageForUser('user123')

      expect(result).toEqual(mockUsage)
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT scope, count'),
        ['user123'],
        mockPool,
      )
    })

    it('returns empty array when no usage', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await repository.getUsageForUser('user123')

      expect(result).toEqual([])
    })

    it('queries from silver.plan_usage_counter table', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      await repository.getUsageForUser('user123')

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('FROM silver.plan_usage_counter')
      expect(queryCall).toContain('WHERE user_id = $1')
    })

    it('handles single usage entry', async () => {
      const mockUsage = [{ scope: 'quotes', count: 42 }]

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: mockUsage,
        rowCount: 1,
      } as any)

      const result = await repository.getUsageForUser('user123')

      expect(result).toEqual(mockUsage)
    })
  })
})


