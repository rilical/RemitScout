// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, computed as vueComputed } from 'vue'
import { planToPulseLevel } from '~/composables/useEntitlements'

describe('useEntitlements helpers', () => {
  const stateStore = new Map<string, { value: unknown }>()
  const mockRequest = vi.fn()
  const mockApplyBackendProfile = vi.fn()

  beforeEach(() => {
    stateStore.clear()
    vi.clearAllMocks()

    vi.stubGlobal('computed', vueComputed)
    vi.stubGlobal('readonly', (value: unknown) => value)
    vi.stubGlobal('watch', vi.fn())
    vi.stubGlobal('onMounted', (fn: () => void) => fn())
    vi.stubGlobal('useState', (key: string, init: () => unknown) => {
      if (!stateStore.has(key)) {
        stateStore.set(key, ref(init()))
      }
      return stateStore.get(key)
    })
    vi.stubGlobal('useApi', () => ({
      request: mockRequest,
    }))
    vi.stubGlobal('useAuth', () => ({
      isLoggedIn: ref(true),
      applyBackendProfile: mockApplyBackendProfile,
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('planToPulseLevel maps free -> none', () => {
    expect(planToPulseLevel('free')).toBe('none')
  })

  it('planToPulseLevel maps plus -> lite', () => {
    expect(planToPulseLevel('plus')).toBe('lite')
  })

  it('planToPulseLevel maps enterprise -> full', () => {
    expect(planToPulseLevel('enterprise')).toBe('full')
  })

  it('hydrates stored and effective plan state separately from /me', async () => {
    mockRequest.mockResolvedValueOnce({
      success: true,
      timestamp: '2026-03-05T12:00:00.000Z',
      user: {
        user_id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      },
      plan: {
        plan_code: 'plus',
        status: 'past_due',
      },
      plan_effective: {
        plan_code: 'free',
        is_active: false,
        lifecycle_state: 'past_due',
        source: 'inactive_or_default',
        recovery_available: true,
        recovery_action: 'billing_portal',
      },
      billing: {
        next_billing_date: '2026-04-01T00:00:00.000Z',
        current_period_end: '2026-04-01T00:00:00.000Z',
        cancel_at_period_end: false,
        amount: 6,
        currency: 'USD',
        status: 'past_due',
        payment_method: null,
      },
      entitlements: {
        pulse_access: 'none',
        exports_enabled: false,
        exports_max_days: 0,
        alerts_max: 1,
        history_max_days: 30,
        watchlist_items: 3,
        api_access: false,
        api_tier: null,
        bulk_export: false,
        indices_api: false,
        daily_alerts_enabled: false,
        smart_alerts_enabled: false,
        index_threshold_alerts_enabled: false,
        indices_exports_enabled: false,
        pulse_embeds_enabled: false,
        indices_embeds_enabled: false,
        api_key_max: 0,
        api_rate_limit_rpm: 0,
      },
      usage: {},
    })

    vi.resetModules()
    const { useEntitlements } = await import('~/composables/useEntitlements')
    const entitlements = useEntitlements()

    await Promise.resolve()
    await Promise.resolve()

    expect(entitlements.plan.value).toBe('free')
    expect(entitlements.storedPlanCode.value).toBe('plus')
    expect(entitlements.planStatus.value).toBe('past_due')
    expect(entitlements.planLifecycleState.value).toBe('past_due')
    expect(entitlements.recoveryAvailable.value).toBe(true)
    expect(entitlements.recoveryAction.value).toBe('billing_portal')
    expect(entitlements.hasPaidAccess.value).toBe(false)
    expect(entitlements.limits.value).toEqual({
      watchlistItems: 3,
      alerts: 1,
      historyDays: 30,
      exports: false,
      exportsMaxDays: 0,
    })
    expect(entitlements.pulseLevel.value).toBe('none')
    expect(entitlements.billing.value?.current_period_end).toBe('2026-04-01T00:00:00.000Z')
    expect(mockApplyBackendProfile).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      email: 'user@example.com',
    }))
  })
})
