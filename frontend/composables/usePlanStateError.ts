import type { Plan } from '~/composables/useEntitlements'

type PlanStateErrorData = {
  error?: string
  message?: string
  details?: {
    error?: string
    message?: string
    plan_failure?: string
    required_plan?: string
    capability?: string
    lifecycle_state?: string
    recovery_action?: string
  } | null
}

type RequestError = Error & {
  statusCode?: number
  data?: PlanStateErrorData
  requestId?: string
  cloudfrontRequestId?: string
}

export type PlanStateFailure = {
  statusCode: number | null
  legacyError: string | null
  planFailure: string | null
  requiredPlan: Plan | null
  capability: string | null
  lifecycleState: string | null
  recoveryAction: string | null
  message: string | null
  requestId?: string
  cloudfrontRequestId?: string
}

type PlanStateMessageOverride = string | ((failure: PlanStateFailure) => string)

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizePlan = (value: unknown): Plan | null => {
  return value === 'free' || value === 'plus' || value === 'enterprise' ? value : null
}

const normalizeErrorData = (value: unknown): PlanStateErrorData => {
  if (!value || typeof value !== 'object') return {}
  const data = value as Record<string, unknown>
  const detailsValue = data.details
  const details
    = detailsValue && typeof detailsValue === 'object'
      ? {
          error: toTrimmedString((detailsValue as Record<string, unknown>).error) || undefined,
          message: toTrimmedString((detailsValue as Record<string, unknown>).message) || undefined,
          plan_failure:
            toTrimmedString((detailsValue as Record<string, unknown>).plan_failure) || undefined,
          required_plan:
            toTrimmedString((detailsValue as Record<string, unknown>).required_plan) || undefined,
          capability:
            toTrimmedString((detailsValue as Record<string, unknown>).capability) || undefined,
          lifecycle_state:
            toTrimmedString((detailsValue as Record<string, unknown>).lifecycle_state) || undefined,
          recovery_action:
            toTrimmedString((detailsValue as Record<string, unknown>).recovery_action) || undefined,
        }
      : null

  return {
    error: toTrimmedString(data.error) || undefined,
    message: toTrimmedString(data.message) || undefined,
    details,
  }
}

export const extractPlanStateFailure = (error: unknown): PlanStateFailure => {
  const normalized = (error || {}) as RequestError
  const statusCode = typeof normalized.statusCode === 'number' ? normalized.statusCode : null
  const data = normalizeErrorData(normalized.data)

  return {
    statusCode,
    legacyError: data.details?.error || data.error || null,
    planFailure: data.details?.plan_failure ?? null,
    requiredPlan: normalizePlan(data.details?.required_plan),
    capability: data.details?.capability ?? null,
    lifecycleState: data.details?.lifecycle_state ?? null,
    recoveryAction: data.details?.recovery_action ?? null,
    message: data.details?.message || data.message || toTrimmedString(normalized.message),
    requestId: toTrimmedString(normalized.requestId) || undefined,
    cloudfrontRequestId: toTrimmedString(normalized.cloudfrontRequestId) || undefined,
  }
}

export const resolvePlanStateFailureCode = (failure: PlanStateFailure): string | null => {
  return failure.planFailure || failure.legacyError || null
}

const defaultMessageForFailure = (failure: PlanStateFailure): string | null => {
  const code = resolvePlanStateFailureCode(failure)
  if (code === 'plan_inactive') {
    if (failure.recoveryAction === 'billing_portal') {
      return 'Your paid plan is inactive. Reactivate billing to continue.'
    }
    if (failure.recoveryAction === 'upgrade') {
      return 'Your paid access has ended. Upgrade again to continue.'
    }
    return 'Your paid plan is inactive.'
  }
  if (code === 'plus_required') return 'This feature requires Plus.'
  if (code === 'enterprise_required') return 'This feature requires Enterprise.'
  if (code === 'indices_export_enterprise_only')
    return 'TEER / RCI / RVI exports require an Enterprise plan.'
  if (code === 'customer_not_found') return 'No billing profile was found for this account.'
  if (code === 'unsupported_plan_code') return 'That plan cannot be purchased here.'
  return null
}

export const mapPlanStateFailureMessage = (
  error: unknown,
  fallback: string,
  overrides: Partial<Record<string, PlanStateMessageOverride>> = {},
): string => {
  const failure = extractPlanStateFailure(error)
  const code = resolvePlanStateFailureCode(failure)
  if (code && overrides[code]) {
    const override = overrides[code]
    return typeof override === 'function' ? override(failure) : override
  }
  return defaultMessageForFailure(failure) || failure.message || fallback
}
