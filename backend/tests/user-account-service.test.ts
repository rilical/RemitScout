import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { upsertUserAccount } from '../plane-a/src/services/user-account'
import { UserAccountRepository } from '../plane-a/src/repositories'
import type { AuthUser } from '../plane-a/src/auth/types'

vi.mock('../plane-a/src/repositories', () => ({
  UserAccountRepository: vi.fn(),
}))

describe('user-account service', () => {
  let mockPool: Pool
  let mockRepository: {
    upsertUserAccount: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool

    mockRepository = {
      upsertUserAccount: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(UserAccountRepository).mockImplementation(() => mockRepository as any)
  })

  describe('upsertUserAccount', () => {
    it('calls repository with user_id and email', async () => {
      const user: AuthUser = {
        user_id: 'user123',
        email: 'test@example.com',
      }

      await upsertUserAccount(mockPool, user)

      expect(UserAccountRepository).toHaveBeenCalledWith(mockPool)
      expect(mockRepository.upsertUserAccount).toHaveBeenCalledWith({
        user_id: 'user123',
        email: 'test@example.com',
      })
    })

    it('handles null email', async () => {
      const user: AuthUser = {
        user_id: 'user123',
        email: null,
      }

      await upsertUserAccount(mockPool, user)

      expect(mockRepository.upsertUserAccount).toHaveBeenCalledWith({
        user_id: 'user123',
        email: null,
      })
    })

    it('handles undefined email', async () => {
      const user: AuthUser = {
        user_id: 'user123',
        email: undefined,
      }

      await upsertUserAccount(mockPool, user)

      expect(mockRepository.upsertUserAccount).toHaveBeenCalledWith({
        user_id: 'user123',
        email: null,
      })
    })
  })
})


