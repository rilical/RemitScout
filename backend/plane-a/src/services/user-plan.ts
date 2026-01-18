import { Pool } from 'pg'
import { UserPlanRepository } from '../repositories'
import { config } from '../../../shared/config'
import { isSupabaseMockEnabled } from '../auth/mock-config'

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
  const plan = await repo.getUserPlan(userId)
  
  // In dev mode with mock auth, allow plan override via SUPABASE_MOCK_PLAN
  if (plan && isSupabaseMockEnabled() && config.auth.supabase.mock.planOverride) {
    const override = config.auth.supabase.mock.planOverride
    if (override === 'plus' || override === 'free' || override === 'enterprise') {
      return {
        ...plan,
        plan_code: override,
      }
    }
  }
  
  return plan
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
