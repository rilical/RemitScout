import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { upsertUserAccount } from '../plane-a/src/services/user-account'
import { UserAccountRepository } from '../plane-a/src/repositories'
import type { AuthUser } from '../plane-a/src/auth/types'

vi.mock('../plane-a/src/repositories', () => ({
  UserAccountRepository: vi.fn(),
}))

const mockQuery = vi.hoisted(() => vi.fn())
const mockRecordBusinessMetric = vi.hoisted(() => vi.fn())
const mockWarn = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())

vi.mock('../shared/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}))

vi.mock('../shared/business-metrics', () => ({
  recordBusinessMetric: (...args: unknown[]) => mockRecordBusinessMetric(...args),
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    warn: mockWarn,
    error: mockError,
    info: vi.fn(),
    debug: vi.fn(),
  }),
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
      upsertUserAccount: vi.fn().mockResolvedValue({ created: false }),
    }

    vi.mocked(UserAccountRepository).mockImplementation(() => mockRepository as unknown as UserAccountRepository)
    mockQuery.mockResolvedValue({ rows: [] })
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
      expect(mockQuery).not.toHaveBeenCalled()
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
      expect(mockQuery).not.toHaveBeenCalled()
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
      expect(mockQuery).not.toHaveBeenCalled()
    })

    it('provisions launch users with their runtime role and plan', async () => {
      const user: AuthUser = {
        user_id: 'launch-user-1',
        email: 'omar@remit-scout.com',
      }

      await upsertUserAccount(mockPool, user)

      expect(mockRepository.upsertUserAccount).toHaveBeenCalledWith({
        user_id: 'launch-user-1',
        email: 'omar@remit-scout.com',
      })
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT user_id'),
        ['omar@remit-scout.com', 'launch-user-1'],
        mockPool,
      )
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO silver.user_account'),
        ['launch-user-1', 'omar@remit-scout.com', 'super_admin'],
        mockPool,
      )
      expect(mockQuery).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO silver.user_plan'),
        ['launch-user-1', 'enterprise'],
        mockPool,
      )
    })

    it('records signup metric when a new user account row is created', async () => {
      mockRepository.upsertUserAccount.mockResolvedValue({ created: true })

      const user: AuthUser = {
        user_id: 'user123',
        email: 'test@example.com',
      }

      await upsertUserAccount(mockPool, user)

      expect(mockRecordBusinessMetric).toHaveBeenCalledWith('user_signups_total', 1)
    })
  })
})


