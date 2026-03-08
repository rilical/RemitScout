import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockResolveAdminAccess = vi.fn()

vi.mock('../shared/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/config')>()
  return {
    ...actual,
    config: {
      ...actual.config,
      planeA: {
        ...actual.config.planeA,
        internalUsersGetEnterprise: true,
      },
    },
  }
})

vi.mock('../plane-a/src/services/admin-access', () => ({
  resolveAdminAccess: (...args: any[]) => mockResolveAdminAccess(...args),
}))

import { resolveEffectiveEntitlements } from '../plane-a/src/services/effective-entitlements'
import { getEntitlementsForPlan } from '../plane-a/src/services/entitlements'

const basePlan = {
  user_id: 'user-1',
  plan_code: 'plus',
  status: 'active',
  stripe_customer_id: 'cus_1',
  stripe_subscription_id: 'sub_1',
  current_period_end: '2026-04-01T00:00:00.000Z',
}

describe('resolveEffectiveEntitlements lifecycle matrix', () => {
  beforeEach(() => {
    mockResolveAdminAccess.mockReset()
    mockResolveAdminAccess.mockResolvedValue({
      appRole: 'user',
      email: null,
      hasAdminRole: false,
      allowlisted: false,
      requireAllowlist: false,
      hasAllowlistConfigured: false,
      allowed: false,
    })
  })

  it.each([
    {
      label: 'free defaults stay free and active',
      plan: { ...basePlan, plan_code: 'free', status: 'active', stripe_customer_id: null, stripe_subscription_id: null },
      expectedPlan: 'free',
      lifecycleState: 'active',
      recoveryAction: 'none',
      recoveryAvailable: false,
    },
    {
      label: 'plus active keeps plus entitlements',
      plan: { ...basePlan, plan_code: 'plus', status: 'active' },
      expectedPlan: 'plus',
      lifecycleState: 'active',
      recoveryAction: 'none',
      recoveryAvailable: false,
    },
    {
      label: 'plus trialing keeps plus entitlements',
      plan: { ...basePlan, plan_code: 'plus', status: 'trialing' },
      expectedPlan: 'plus',
      lifecycleState: 'trialing',
      recoveryAction: 'none',
      recoveryAvailable: false,
    },
    {
      label: 'cancel at period end stays active but exposes recovery',
      plan: { ...basePlan, plan_code: 'plus', status: 'active' },
      cancelAtPeriodEnd: true,
      expectedPlan: 'plus',
      lifecycleState: 'scheduled_cancel',
      recoveryAction: 'billing_portal',
      recoveryAvailable: true,
    },
    {
      label: 'past_due falls back to free immediately',
      plan: { ...basePlan, plan_code: 'plus', status: 'past_due' },
      expectedPlan: 'free',
      lifecycleState: 'past_due',
      recoveryAction: 'billing_portal',
      recoveryAvailable: true,
    },
    {
      label: 'canceled paid plan falls back to free with billing recovery',
      plan: { ...basePlan, plan_code: 'plus', status: 'canceled' },
      expectedPlan: 'free',
      lifecycleState: 'canceled',
      recoveryAction: 'billing_portal',
      recoveryAvailable: true,
    },
    {
      label: 'expired paid plan without customer falls back to free with upgrade recovery',
      plan: {
        ...basePlan,
        plan_code: 'plus',
        status: 'expired',
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
      expectedPlan: 'free',
      lifecycleState: 'expired',
      recoveryAction: 'upgrade',
      recoveryAvailable: true,
    },
    {
      label: 'unpaid paid plan falls back to free with billing recovery',
      plan: {
        ...basePlan,
        plan_code: 'plus',
        status: 'unpaid',
      },
      expectedPlan: 'free',
      lifecycleState: 'unpaid',
      recoveryAction: 'billing_portal',
      recoveryAvailable: true,
    },
    {
      label: 'incomplete_expired falls back to free with billing recovery',
      plan: {
        ...basePlan,
        plan_code: 'plus',
        status: 'incomplete_expired',
      },
      expectedPlan: 'free',
      lifecycleState: 'incomplete_expired',
      recoveryAction: 'billing_portal',
      recoveryAvailable: true,
    },
    {
      label: 'inactive default falls back to free',
      plan: { ...basePlan, plan_code: 'plus', status: 'inactive', stripe_customer_id: null },
      expectedPlan: 'free',
      lifecycleState: 'inactive',
      recoveryAction: 'upgrade',
      recoveryAvailable: true,
    },
    {
      label: 'enterprise inactive falls back to free capabilities',
      plan: { ...basePlan, plan_code: 'enterprise', status: 'unpaid' },
      expectedPlan: 'free',
      lifecycleState: 'unpaid',
      recoveryAction: 'billing_portal',
      recoveryAvailable: true,
    },
    {
      label: 'enterprise canceled without customer falls back to free with upgrade recovery',
      plan: {
        ...basePlan,
        plan_code: 'enterprise',
        status: 'canceled',
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
      expectedPlan: 'free',
      lifecycleState: 'canceled',
      recoveryAction: 'upgrade',
      recoveryAvailable: true,
    },
  ])('$label', async ({ plan, cancelAtPeriodEnd, expectedPlan, lifecycleState, recoveryAction, recoveryAvailable }) => {
    const result = await resolveEffectiveEntitlements({
      pool: {} as any,
      userId: plan.user_id,
      plan,
      cancelAtPeriodEnd,
    })

    expect(result.effectivePlanCode).toBe(expectedPlan)
    expect(result.lifecycleState).toBe(lifecycleState)
    expect(result.recoveryAction).toBe(recoveryAction)
    expect(result.recoveryAvailable).toBe(recoveryAvailable)
    expect(result.entitlements).toEqual(getEntitlementsForPlan(expectedPlan))
  })

  it('applies internal admin override without recovery metadata', async () => {
    mockResolveAdminAccess.mockResolvedValueOnce({
      appRole: 'super_admin',
      email: 'admin@example.com',
      hasAdminRole: true,
      allowlisted: true,
      requireAllowlist: false,
      hasAllowlistConfigured: true,
      allowed: true,
    })

    const result = await resolveEffectiveEntitlements({
      pool: {} as any,
      userId: 'admin-1',
      email: 'admin@example.com',
      plan: {
        ...basePlan,
        user_id: 'admin-1',
        plan_code: 'free',
        status: 'inactive',
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
    })

    expect(result.effectivePlanCode).toBe('enterprise')
    expect(result.lifecycleState).toBe('active')
    expect(result.recoveryAction).toBe('none')
    expect(result.recoveryAvailable).toBe(false)
    expect(result.source).toBe('internal_admin_override')
  })
})
