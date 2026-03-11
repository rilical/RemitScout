import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import { ConflictError } from '../../../../shared/errors'
import type {
  IUserPlanRepository,
  UserPlanRecord,
  UserPlanUpdate,
} from '../interfaces/user-plan-repository.interface'

export class UserPlanRepository implements IUserPlanRepository {
  constructor(private readonly pool: Pool) {}

  async ensureUserPlan(userId: string): Promise<void> {
    await query(
      `
      INSERT INTO silver.user_plan (user_id, plan_code, status)
      VALUES ($1, 'free', 'active')
      ON CONFLICT (user_id) DO NOTHING
      `,
      [userId],
      this.pool,
    )
  }

  async getUserPlan(userId: string): Promise<UserPlanRecord | null> {
    const result = await query<UserPlanRecord>(
      `
      SELECT user_id, plan_code, status, stripe_customer_id, stripe_subscription_id, current_period_end, version
      FROM silver.user_plan
      WHERE user_id = $1
      `,
      [userId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async getUserPlanByCustomerId(customerId: string): Promise<UserPlanRecord | null> {
    const result = await query<UserPlanRecord>(
      `
      SELECT user_id, plan_code, status, stripe_customer_id, stripe_subscription_id, current_period_end, version
      FROM silver.user_plan
      WHERE stripe_customer_id = $1
      `,
      [customerId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async updatePlan(update: UserPlanUpdate): Promise<void> {
    const setClauses: string[] = []
    const params: unknown[] = [update.user_id]
    let paramIndex = 2

    const fields = ['plan_code', 'status', 'stripe_customer_id',
      'stripe_subscription_id', 'current_period_end'] as const
    for (const field of fields) {
      if (field in update) {
        setClauses.push(`${field} = $${paramIndex}`)
        params.push(update[field] ?? null)
        paramIndex++
      }
    }
    if (setClauses.length === 0) return
    setClauses.push('updated_at = NOW()')
    setClauses.push('version = version + 1')

    let whereClause = 'WHERE user_id = $1'
    if (update.expected_version !== undefined) {
      whereClause += ` AND version = $${paramIndex}`
      params.push(update.expected_version)
      paramIndex++
    }

    const result = await query(
      `UPDATE silver.user_plan SET ${setClauses.join(', ')} ${whereClause} RETURNING user_id`,
      params,
      this.pool,
    )

    if (update.expected_version !== undefined && result.rowCount === 0) {
      throw new ConflictError('user_plan version mismatch — concurrent update detected', {
        details: { user_id: update.user_id, expected_version: update.expected_version },
      })
    }
  }
}





