import type { PlanCode } from './entitlements'
import type { EffectiveEntitlementsResult } from './effective-entitlements'

export type PlanLifecycleState =
  | 'active'
  | 'trialing'
  | 'scheduled_cancel'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete_expired'
  | 'expired'
  | 'inactive'

export type PlanRecoveryAction = 'none' | 'billing_portal' | 'upgrade'

export type PlanFailureCode =
  | 'plan_inactive'
  | 'plus_required'
  | 'enterprise_required'
  | 'indices_export_enterprise_only'
  | 'capability_not_included'

type PlanStateContext = Pick<
  EffectiveEntitlementsResult,
  | 'normalizedPlanCode'
  | 'effectivePlanCode'
  | 'isPlanActive'
  | 'internalEnterpriseOverride'
  | 'lifecycleState'
  | 'recoveryAction'
>

type PlanStateErrorDetails = {
  plan_failure: string
  required_plan?: PlanCode
  capability?: string
  lifecycle_state: PlanLifecycleState
  recovery_action: PlanRecoveryAction
  purchased_plan: PlanCode
  effective_plan: PlanCode
}

export type PlanStateErrorResponse = {
  error: string
  message: string
  details: PlanStateErrorDetails & Record<string, unknown>
}

const resolvePlanFailureFromRequiredPlan = (requiredPlan?: PlanCode): PlanFailureCode => {
  if (requiredPlan === 'enterprise') return 'enterprise_required'
  if (requiredPlan === 'plus') return 'plus_required'
  return 'capability_not_included'
}

export const createPlanStateErrorResponse = (input: {
  legacyError: string
  message: string
  context: PlanStateContext
  planFailure?: string
  requiredPlan?: PlanCode
  capability?: string
  extraDetails?: Record<string, unknown>
}): PlanStateErrorResponse => {
  const planFailure = input.planFailure ?? resolvePlanFailureFromRequiredPlan(input.requiredPlan)

  return {
    error: input.legacyError,
    message: input.message,
    details: {
      plan_failure: planFailure,
      lifecycle_state: input.context.lifecycleState,
      recovery_action: input.context.recoveryAction,
      purchased_plan: input.context.normalizedPlanCode,
      effective_plan: input.context.effectivePlanCode,
      ...(input.requiredPlan ? { required_plan: input.requiredPlan } : {}),
      ...(input.capability ? { capability: input.capability } : {}),
      ...(input.extraDetails ?? {}),
    },
  }
}

export const createCapabilityAccessDeniedResponse = (input: {
  context: PlanStateContext
  capability: string
  requiredPlan?: PlanCode
  inactiveMessage: string
  insufficientMessage: string
  insufficientLegacyError: string
  insufficientPlanFailure?: string
  extraDetails?: Record<string, unknown>
}): PlanStateErrorResponse => {
  const isInactivePaidPlan =
    !input.context.internalEnterpriseOverride
    && !input.context.isPlanActive
    && input.context.normalizedPlanCode !== 'free'

  if (isInactivePaidPlan) {
    return createPlanStateErrorResponse({
      legacyError: 'plan_inactive',
      message: input.inactiveMessage,
      context: input.context,
      planFailure: 'plan_inactive',
      requiredPlan: input.requiredPlan,
      capability: input.capability,
      extraDetails: input.extraDetails,
    })
  }

  return createPlanStateErrorResponse({
    legacyError: input.insufficientLegacyError,
    message: input.insufficientMessage,
    context: input.context,
    planFailure: input.insufficientPlanFailure,
    requiredPlan: input.requiredPlan,
    capability: input.capability,
    extraDetails: input.extraDetails,
  })
}
