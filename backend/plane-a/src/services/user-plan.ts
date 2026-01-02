import { Pool } from 'pg'
import { UserPlanRepository } from '../repositories'

export type UserPlan = {
  user_id: string
  plan_code: string
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
}

export const ensureUserPlan = async (pool: Pool, userId: string) => {
  const repo = new UserPlanRepository(pool)
  await repo.ensureUserPlan(userId)
}

export const getUserPlan = async (pool: Pool, userId: string): Promise<UserPlan | null> => {
  const repo = new UserPlanRepository(pool)
  return await repo.getUserPlan(userId)
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
  const repo = new UserPlanRepository(pool)
  await repo.updatePlan(update)
}
