// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  extractPlanStateFailure,
  mapPlanStateFailureMessage,
  resolvePlanStateFailureCode,
} from '~/composables/usePlanStateError'

describe('usePlanStateError', () => {
  it('prefers canonical plan_failure details over legacy error codes', () => {
    const failure = extractPlanStateFailure({
      statusCode: 403,
      data: {
        error: 'enterprise_required',
        message: 'Legacy message',
        details: {
          plan_failure: 'plan_inactive',
          required_plan: 'enterprise',
          capability: 'api_access',
          lifecycle_state: 'past_due',
          recovery_action: 'billing_portal',
        },
      },
    })

    expect(resolvePlanStateFailureCode(failure)).toBe('plan_inactive')
    expect(failure.requiredPlan).toBe('enterprise')
    expect(failure.capability).toBe('api_access')
    expect(failure.lifecycleState).toBe('past_due')
    expect(failure.recoveryAction).toBe('billing_portal')
  })

  it('maps inactive paid-plan failures to recovery-aware copy', () => {
    const message = mapPlanStateFailureMessage(
      {
        statusCode: 403,
        data: {
          error: 'enterprise_required',
          details: {
            plan_failure: 'plan_inactive',
            recovery_action: 'billing_portal',
          },
        },
      },
      'Fallback',
    )

    expect(message).toBe('Your paid plan is inactive. Reactivate billing to continue.')
  })

  it('reads nested validation details for billing recovery errors', () => {
    const message = mapPlanStateFailureMessage(
      {
        statusCode: 400,
        data: {
          error: 'validation_error',
          message: 'Invalid request',
          details: {
            error: 'customer_not_found',
            message: 'No Stripe customer was found for this account.',
          },
        },
      },
      'Fallback',
    )

    expect(message).toBe('No billing profile was found for this account.')
  })
})
