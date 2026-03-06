import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import {
  getEntitlementsForPlan,
  isPlanActiveStatus,
  normalizePlanCode,
  normalizePlanStatus,
  resolveEffectivePlanCode,
  type Entitlements,
  type PlanCode,
} from './entitlements'
import { resolveAdminAccess, type AdminAccessResult } from './admin-access'
import type { UserPlan } from './user-plan'
import type { PlanLifecycleState, PlanRecoveryAction } from './plan-state'

export type EffectiveEntitlementsInput = {
  pool: Pool
  userId: string
  email?: string | null
  supabaseRole?: string | null
  plan?: UserPlan | null
  cancelAtPeriodEnd?: boolean | null
  currentPeriodEnd?: string | null
}

export type EffectiveEntitlementsResult = {
  plan: UserPlan | null
  normalizedPlanCode: PlanCode
  effectivePlanCode: PlanCode
  entitlements: Entitlements
  isPlanActive: boolean
  internalEnterpriseOverride: boolean
  lifecycleState: PlanLifecycleState
  recoveryAvailable: boolean
  recoveryAction: PlanRecoveryAction
  source: 'internal_admin_override' | 'stored_plan' | 'inactive_or_default'
  adminAccess: AdminAccessResult
}

const resolveLifecycleState = (input: {
  plan: UserPlan | null | undefined
  cancelAtPeriodEnd?: boolean | null
}): PlanLifecycleState => {
  const normalizedStatus = normalizePlanStatus(input.plan?.status)
  const normalizedPlanCode = normalizePlanCode(input.plan?.plan_code)
  if (
    normalizedPlanCode !== 'free'
    && (normalizedStatus === 'active' || normalizedStatus === 'trialing')
    && input.cancelAtPeriodEnd === true
  ) {
    return 'scheduled_cancel'
  }
  return normalizedStatus
}

const resolveRecoveryAction = (input: {
  plan: UserPlan | null | undefined
  lifecycleState: PlanLifecycleState
}): PlanRecoveryAction => {
  const normalizedPlanCode = normalizePlanCode(input.plan?.plan_code)
  if (normalizedPlanCode === 'free') return 'none'

  if (input.lifecycleState === 'scheduled_cancel' || input.lifecycleState === 'past_due') {
    return input.plan?.stripe_customer_id ? 'billing_portal' : 'upgrade'
  }

  if (
    input.lifecycleState === 'canceled'
    || input.lifecycleState === 'unpaid'
    || input.lifecycleState === 'incomplete_expired'
    || input.lifecycleState === 'expired'
    || input.lifecycleState === 'inactive'
  ) {
    return input.plan?.stripe_customer_id ? 'billing_portal' : 'upgrade'
  }

  return 'none'
}

export const resolveEffectiveEntitlements = async (
  input: EffectiveEntitlementsInput,
): Promise<EffectiveEntitlementsResult> => {
  const normalizedPlanCode = normalizePlanCode(input.plan?.plan_code)
  const isPlanActive = isPlanActiveStatus(input.plan?.status)
  const lifecycleState = resolveLifecycleState({
    plan: input.plan,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd,
  })
  const adminAccess = await resolveAdminAccess({
    pool: input.pool,
    userId: input.userId,
    email: input.email ?? null,
    supabaseRole: input.supabaseRole ?? null,
  })

  const internalEnterpriseOverride = Boolean(
    adminAccess.allowed && config.planeA.internalUsersGetEnterprise,
  )
  const effectivePlanCode: PlanCode = internalEnterpriseOverride
    ? 'enterprise'
    : resolveEffectivePlanCode(input.plan?.plan_code, input.plan?.status)
  const recoveryAction = internalEnterpriseOverride
    ? 'none'
    : resolveRecoveryAction({
        plan: input.plan,
        lifecycleState,
      })

  return {
    plan: input.plan ?? null,
    normalizedPlanCode,
    effectivePlanCode,
    entitlements: getEntitlementsForPlan(effectivePlanCode),
    isPlanActive,
    internalEnterpriseOverride,
    lifecycleState: internalEnterpriseOverride ? 'active' : lifecycleState,
    recoveryAvailable: internalEnterpriseOverride ? false : recoveryAction !== 'none',
    recoveryAction,
    source: internalEnterpriseOverride ? 'internal_admin_override' : isPlanActive ? 'stored_plan' : 'inactive_or_default',
    adminAccess,
  }
}
