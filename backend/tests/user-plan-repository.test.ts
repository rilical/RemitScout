import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { UserPlanRepository } from '../plane-a/src/repositories/implementations/user-plan-repository'
import * as dbModule from '../shared/db'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

describe('UserPlanRepository', () => {
  let repository: UserPlanRepository
  let mockPool: Pool

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = {} as Pool
    repository = new UserPlanRepository(mockPool)
  })

  describe('ensureUserPlan', () => {
    it('inserts user plan with free plan code', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      await repository.ensureUserPlan('user123')

      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO silver.user_plan'),
        ['user123'],
        mockPool,
      )
      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain("VALUES ($1, 'free', 'active')")
      expect(queryCall).toContain('ON CONFLICT (user_id) DO NOTHING')
    })
  })

  describe('getUserPlan', () => {
    it('returns user plan when found', async () => {
      const mockPlan = {
        user_id: 'user123',
        plan_code: 'plus',
        status: 'active',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        current_period_end: '2024-12-31T00:00:00Z',
      }

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [mockPlan],
        rowCount: 1,
      } as any)

      const result = await repository.getUserPlan('user123')

      expect(result).toEqual(mockPlan)
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT user_id, plan_code'),
        ['user123'],
        mockPool,
      )
    })

    it('returns null when plan not found', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await repository.getUserPlan('user123')

      expect(result).toBeNull()
    })
  })

  describe('getUserPlanByCustomerId', () => {
    it('returns user plan by customer ID', async () => {
      const mockPlan = {
        user_id: 'user123',
        plan_code: 'plus',
        status: 'active',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        current_period_end: '2024-12-31T00:00:00Z',
      }

      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [mockPlan],
        rowCount: 1,
      } as any)

      const result = await repository.getUserPlanByCustomerId('cus_123')

      expect(result).toEqual(mockPlan)
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE stripe_customer_id = $1'),
        ['cus_123'],
        mockPool,
      )
    })

    it('returns null when customer not found', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const result = await repository.getUserPlanByCustomerId('cus_123')

      expect(result).toBeNull()
    })
  })

  describe('updatePlan', () => {
    it('updates all plan fields', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      const update = {
        user_id: 'user123',
        plan_code: 'plus',
        status: 'active',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        current_period_end: '2024-12-31T00:00:00Z',
      }

      await repository.updatePlan(update)

      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE silver.user_plan'),
        ['user123', 'plus', 'active', 'cus_123', 'sub_123', '2024-12-31T00:00:00Z'],
        mockPool,
      )
    })

    it('handles partial updates with COALESCE', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      const update = {
        user_id: 'user123',
        plan_code: 'plus',
      }

      await repository.updatePlan(update)

      const queryCall = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(queryCall).toContain('COALESCE')
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user123', 'plus', null, null, null, null],
        mockPool,
      )
    })

    it('handles null values explicitly', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      const update = {
        user_id: 'user123',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_end: null,
      }

      await repository.updatePlan(update)

      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user123', null, null, null, null, null],
        mockPool,
      )
    })
  })
})



