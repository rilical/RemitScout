import { Pool } from 'pg'

export type UserPlan = {
  user_id: string
  plan_code: string
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
}

export const ensureUserPlan = async (pool: Pool, userId: string) => {
  await pool.query(
    `
    INSERT INTO silver.user_plan (user_id, plan_code, status)
    VALUES ($1, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING
    `,
    [userId]
  )
}

export const getUserPlan = async (pool: Pool, userId: string): Promise<UserPlan | null> => {
  const result = await pool.query<UserPlan>(
    `
    SELECT user_id, plan_code, status, stripe_customer_id, stripe_subscription_id, current_period_end
    FROM silver.user_plan
    WHERE user_id = $1
    `,
    [userId]
  )
  return result.rows[0] || null
}

export type StripePlanUpdate = {
  user_id: string
  plan_code?: string
  status?: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  current_period_end?: string | null
}

export const updatePlanFromStripe = async (pool: Pool, update: StripePlanUpdate) => {
  await pool.query(
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
    ]
  )
}
