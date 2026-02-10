import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'

import * as dbModule from '../shared/db'
import { FxRateRefreshRepository } from '../plane-b/src/repositories/implementations/fx-rate-refresh-repository'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

describe('FxRateRefreshRepository', () => {
  let repository: FxRateRefreshRepository
  let mockPool: Pool

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool
    repository = new FxRateRefreshRepository(mockPool)
  })

  describe('claimRequestById', () => {
    it('casts retryCount override to int (NULL-safe)', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      await repository.claimRequestById('00000000-0000-0000-0000-000000000000', 3, undefined)

      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('$6::int'),
        expect.any(Array),
        mockPool,
      )
    })
  })
})

