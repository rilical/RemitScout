import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { UserAccountRepository } from '../plane-a/src/repositories/implementations/user-account-repository'
import * as dbModule from '../../shared/db'

vi.mock('../../shared/db', () => ({
  query: vi.fn(),
}))

describe('UserAccountRepository', () => {
  let repository: UserAccountRepository
  let mockPool: Pool

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool
    repository = new UserAccountRepository(mockPool)
  })

  describe('upsertUserAccount', () => {
    it('inserts new user account', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      await repository.upsertUserAccount({
        user_id: 'user123',
        email: 'test@example.com',
      })

      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO silver.user_account'),
        ['user123', 'test@example.com'],
        mockPool,
      )
      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('ON CONFLICT (user_id)')
      expect(queryCall).toContain('DO UPDATE SET email = EXCLUDED.email')
    })

    it('handles null email', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      await repository.upsertUserAccount({
        user_id: 'user123',
        email: null,
      })

      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user123', null],
        mockPool,
      )
    })

    it('updates last_seen_at on conflict', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      await repository.upsertUserAccount({
        user_id: 'user123',
        email: 'updated@example.com',
      })

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('last_seen_at = NOW()')
    })
  })
})


