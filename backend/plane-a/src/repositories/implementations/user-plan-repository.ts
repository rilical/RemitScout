import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
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
      SELECT user_id, plan_code, status, stripe_customer_id, stripe_subscription_id, current_period_end
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
      SELECT user_id, plan_code, status, stripe_customer_id, stripe_subscription_id, current_period_end
      FROM silver.user_plan
      WHERE stripe_customer_id = $1
      `,
      [customerId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async updatePlan(update: UserPlanUpdate): Promise<void> {
    await query(
      `
      UPDATE silver.user_plan
      SET plan_code = COALESCE($2, plan_code),
          status = COALESCE($3, status),
          stripe_customer_id = COALESCE($4, stripe_customer_id),
          stripe_subscription_id = COALESCE($5, stripe_subscription_id),
          current_period_end = COALESCE($6, current_period_end),
          updated_at = NOW()
      WHERE user_id = $1
      `,
      [
        update.user_id,
        update.plan_code || null,
        update.status || null,
        update.stripe_customer_id ?? null,
        update.stripe_subscription_id ?? null,
        update.current_period_end ?? null,
      ],
      this.pool,
    )
  }
}




