import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import {
  ensureUserPlan,
  getUserPlan,
  updatePlanFromStripe,
} from '../plane-a/src/services/user-plan'
import { UserPlanRepository } from '../plane-a/src/repositories'

vi.mock('../plane-a/src/repositories', () => ({
  UserPlanRepository: vi.fn(),
}))

describe('user-plan service', () => {
  let mockPool: Pool
  let mockRepository: {
    ensureUserPlan: ReturnType<typeof vi.fn>
    getUserPlan: ReturnType<typeof vi.fn>
    updatePlan: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool

    mockRepository = {
      ensureUserPlan: vi.fn().mockResolvedValue(undefined),
      getUserPlan: vi.fn().mockResolvedValue(null),
      updatePlan: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(UserPlanRepository).mockImplementation(() => mockRepository as any)
  })

  describe('ensureUserPlan', () => {
    it('calls repository ensureUserPlan', async () => {
      await ensureUserPlan(mockPool, 'user123')

      expect(UserPlanRepository).toHaveBeenCalledWith(mockPool)
      expect(mockRepository.ensureUserPlan).toHaveBeenCalledWith('user123')
    })
  })

  describe('getUserPlan', () => {
    it('returns user plan from repository', async () => {
      const mockPlan = {
        user_id: 'user123',
        plan_code: 'plus',
        status: 'active',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        current_period_end: '2024-12-31T00:00:00Z',
      }

      mockRepository.getUserPlan.mockResolvedValue(mockPlan)

      const result = await getUserPlan(mockPool, 'user123')

      expect(result).toEqual(mockPlan)
      expect(mockRepository.getUserPlan).toHaveBeenCalledWith('user123')
    })

    it('returns null when plan not found', async () => {
      mockRepository.getUserPlan.mockResolvedValue(null)

      const result = await getUserPlan(mockPool, 'user123')

      expect(result).toBeNull()
    })
  })

  describe('updatePlanFromStripe', () => {
    it('calls repository updatePlan with all fields', async () => {
      const update = {
        user_id: 'user123',
        plan_code: 'plus',
        status: 'active',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        current_period_end: '2024-12-31T00:00:00Z',
      }

      await updatePlanFromStripe(mockPool, update)

      expect(mockRepository.updatePlan).toHaveBeenCalledWith(update)
    })

    it('handles partial updates', async () => {
      const update = {
        user_id: 'user123',
        plan_code: 'plus',
      }

      await updatePlanFromStripe(mockPool, update)

      expect(mockRepository.updatePlan).toHaveBeenCalledWith(update)
    })

    it('handles null values', async () => {
      const update = {
        user_id: 'user123',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_end: null,
      }

      await updatePlanFromStripe(mockPool, update)

      expect(mockRepository.updatePlan).toHaveBeenCalledWith(update)
    })
  })
})



