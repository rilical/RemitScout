import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'
import { UserPlanRepository } from '../plane-a/src/repositories/implementations/user-plan-repository'
import { ConflictError } from '../shared/errors'
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
        version: 3,
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
        version: 1,
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
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [{ user_id: 'user123' }], rowCount: 1 } as any)

      const update = {
        user_id: 'user123',
        plan_code: 'plus',
        status: 'active',
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
        current_period_end: '2024-12-31T00:00:00Z',
      }

      await repository.updatePlan(update)

      const sql = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(sql).toContain('UPDATE silver.user_plan SET')
      expect(sql).toContain('plan_code = $2')
      expect(sql).toContain('status = $3')
      expect(sql).toContain('stripe_customer_id = $4')
      expect(sql).toContain('stripe_subscription_id = $5')
      expect(sql).toContain('current_period_end = $6')
      expect(sql).toContain('updated_at = NOW()')
      expect(sql).toContain('version = version + 1')
      expect(sql).toContain('RETURNING user_id')
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user123', 'plus', 'active', 'cus_123', 'sub_123', '2024-12-31T00:00:00Z'],
        mockPool,
      )
    })

    it('explicit null clears the field (SET clause includes it with param null)', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [{ user_id: 'user123' }], rowCount: 1 } as any)

      const update = {
        user_id: 'user123',
        stripe_subscription_id: null as string | null,
        current_period_end: null as string | null,
      }

      await repository.updatePlan(update)

      const sql = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(sql).toContain('stripe_subscription_id = $2')
      expect(sql).toContain('current_period_end = $3')
      expect(sql).toContain('updated_at = NOW()')
      expect(sql).toContain('version = version + 1')
      // Only user_id + the two explicitly-null fields
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user123', null, null],
        mockPool,
      )
    })

    it('omitted field is NOT in SET clause', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [{ user_id: 'user123' }], rowCount: 1 } as any)

      const update = {
        user_id: 'user123',
        plan_code: 'plus',
      }

      await repository.updatePlan(update)

      const sql = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(sql).toContain('plan_code = $2')
      expect(sql).not.toContain('stripe_customer_id')
      expect(sql).not.toContain('stripe_subscription_id')
      expect(sql).not.toContain('current_period_end')
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user123', 'plus'],
        mockPool,
      )
    })

    it('does not issue query when no fields are provided', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      const update = {
        user_id: 'user123',
      }

      await repository.updatePlan(update)

      expect(dbModule.query).not.toHaveBeenCalled()
    })

    it('adds version WHERE clause when expected_version is provided', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [{ user_id: 'user123' }], rowCount: 1 } as any)

      await repository.updatePlan({
        user_id: 'user123',
        plan_code: 'plus',
        expected_version: 3,
      })

      const sql = vi.mocked(dbModule.query).mock.calls[0][0] as string
      expect(sql).toContain('WHERE user_id = $1 AND version = $3')
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user123', 'plus', 3],
        mockPool,
      )
    })

    it('throws ConflictError when expected_version does not match', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      await expect(
        repository.updatePlan({
          user_id: 'user123',
          status: 'active',
          expected_version: 5,
        }),
      ).rejects.toBeInstanceOf(ConflictError)
    })

    it('does not throw when expected_version is omitted and rowCount is 0', async () => {
      vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

      await expect(
        repository.updatePlan({
          user_id: 'user123',
          status: 'active',
        }),
      ).resolves.toBeUndefined()
    })
  })
})




