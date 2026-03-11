export type UserPlanRecord = {
  user_id: string
  plan_code: string
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  version: number
}

export type UserPlanUpdate = {
  user_id: string
  plan_code?: string
  status?: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  current_period_end?: string | null
  expected_version?: number
}

export interface IUserPlanRepository {
  ensureUserPlan(userId: string): Promise<void>
  getUserPlan(userId: string): Promise<UserPlanRecord | null>
  getUserPlanByCustomerId(customerId: string): Promise<UserPlanRecord | null>
  updatePlan(update: UserPlanUpdate): Promise<void>
}





