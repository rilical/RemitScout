import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { getUsageForUser } from '../plane-a/src/services/plan-usage'
import { PlanUsageRepository } from '../plane-a/src/repositories'

vi.mock('../plane-a/src/repositories', () => ({
  PlanUsageRepository: vi.fn(),
}))

describe('plan-usage service', () => {
  let mockPool: Pool
  let mockRepository: {
    getUsageForUser: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool

    mockRepository = {
      getUsageForUser: vi.fn().mockResolvedValue([]),
    }

    vi.mocked(PlanUsageRepository).mockImplementation(() => mockRepository as any)
  })

  describe('getUsageForUser', () => {
    it('returns usage as record', async () => {
      const mockRows = [
        { scope: 'quotes', count: 10 },
        { scope: 'exports', count: 5 },
      ]

      mockRepository.getUsageForUser.mockResolvedValue(mockRows)

      const result = await getUsageForUser(mockPool, 'user123')

      expect(result).toEqual({
        quotes: 10,
        exports: 5,
      })
      expect(mockRepository.getUsageForUser).toHaveBeenCalledWith('user123')
    })

    it('returns empty object when no usage', async () => {
      mockRepository.getUsageForUser.mockResolvedValue([])

      const result = await getUsageForUser(mockPool, 'user123')

      expect(result).toEqual({})
    })

    it('handles single usage entry', async () => {
      const mockRows = [{ scope: 'quotes', count: 42 }]

      mockRepository.getUsageForUser.mockResolvedValue(mockRows)

      const result = await getUsageForUser(mockPool, 'user123')

      expect(result).toEqual({ quotes: 42 })
    })

    it('overwrites duplicate scopes with last value', async () => {
      const mockRows = [
        { scope: 'quotes', count: 10 },
        { scope: 'quotes', count: 20 },
      ]

      mockRepository.getUsageForUser.mockResolvedValue(mockRows)

      const result = await getUsageForUser(mockPool, 'user123')

      expect(result).toEqual({ quotes: 20 })
    })
  })
})


