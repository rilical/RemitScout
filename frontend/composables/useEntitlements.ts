import { UI_BOOTSTRAP_RETRIES } from '~/composables/requestPolicies'

export type Plan = 'free' | 'plus' | 'enterprise'
export type PlanLifecycleState
  = | 'active'
    | 'trialing'
    | 'scheduled_cancel'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'incomplete_expired'
    | 'expired'
    | 'inactive'

export type PlanRecoveryAction = 'none' | 'billing_portal' | 'upgrade'

export type PulseLevel = 'none' | 'lite' | 'full'

export function planToPulseLevel(plan: Plan): PulseLevel {
  if (plan === 'enterprise') return 'full'
  if (plan === 'plus') return 'lite'
  return 'none'
}

type BackendPulseAccess = 'none' | 'lite' | 'full'

const pulseAccessToPulseLevel = (access: BackendPulseAccess): PulseLevel => {
  if (access === 'full') return 'full'
  if (access === 'lite') return 'lite'
  return 'none'
}

export type Limit = number | 'unlimited'

export type PlanLimits = {
  watchlistItems: Limit
  alerts: Limit
  historyDays: Limit
  exports: boolean
  exportsMaxDays: Limit
}

type MeResponse = {
  success: boolean
  timestamp: string
  user: {
    user_id: string
    email: string
    name: string | null
    role?: string | null
    app_role?: string | null
    is_admin?: boolean
  }
  plan: {
    plan_code: string
    status: string
  }
  plan_effective?: {
    plan_code: string
    is_active: boolean
    lifecycle_state?: PlanLifecycleState
    source?: 'internal_admin_override' | 'stored_plan' | 'inactive_or_default'
    recovery_available?: boolean
    recovery_action?: PlanRecoveryAction
  }
  billing?: {
    next_billing_date: string | null
    current_period_end?: string | null
    cancel_at_period_end?: boolean
    amount: number | null
    currency: string | null
    status: string | null
    payment_method: {
      type: string | null
      last4: string | null
      brand: string | null
      exp_month: number | null
      exp_year: number | null
    } | null
  }
  entitlements: {
    pulse_access: BackendPulseAccess
    exports_enabled: boolean
    exports_max_days: number | null
    alerts_max: number | null
    history_max_days: number | null
    watchlist_items: number | null
    api_access: boolean
    api_tier: number | null
    bulk_export: boolean
    indices_api: boolean
    daily_alerts_enabled: boolean
    smart_alerts_enabled: boolean
    index_threshold_alerts_enabled: boolean
    indices_exports_enabled: boolean
    pulse_embeds_enabled: boolean
    indices_embeds_enabled: boolean
    api_key_max: number | null
    api_rate_limit_rpm: number | null
  }
  usage: {
    alerts_count?: number
    watchlist_count?: number
  }
}

const mapEntitlementsToLimits = (entitlements: MeResponse['entitlements']): PlanLimits => {
  return {
    watchlistItems: entitlements.watchlist_items === null ? 'unlimited' : entitlements.watchlist_items,
    alerts: entitlements.alerts_max === null ? 'unlimited' : entitlements.alerts_max,
    historyDays: entitlements.history_max_days === null ? 'unlimited' : entitlements.history_max_days,
    exports: entitlements.exports_enabled,
    exportsMaxDays: entitlements.exports_max_days === null ? 'unlimited' : entitlements.exports_max_days,
  }
}

export const useEntitlements = () => {
  const { request } = useApi()
  const { isLoggedIn, applyBackendProfile } = useAuth()

  const plan = useState<Plan>('entitlements:plan', () => 'enterprise' as Plan) // DEV OVERRIDE – remove before deploy
  const storedPlanCode = useState<Plan>('entitlements:stored-plan', () => 'enterprise' as Plan) // DEV OVERRIDE
  const planStatus = useState<string>('entitlements:plan-status', () => 'active')
  const planLifecycleState = useState<PlanLifecycleState>('entitlements:plan-lifecycle', () => 'active')
  const recoveryAvailable = useState<boolean>('entitlements:recovery-available', () => false)
  const recoveryAction = useState<PlanRecoveryAction>('entitlements:recovery-action', () => 'none')
  const limits = useState<PlanLimits>('entitlements:limits', () => ({
    watchlistItems: 500,
    alerts: 100,
    historyDays: 180,
    exports: true,
    exportsMaxDays: 180,
  })) // DEV OVERRIDE – remove before deploy
  const apiAccess = useState<boolean>('entitlements:api-access', () => true) // DEV OVERRIDE
  const apiTier = useState<number | null>('entitlements:api-tier', () => null)
  const apiKeyMax = useState<number | null>('entitlements:api-key-max', () => null)
  const apiRateLimitRpm = useState<number | null>('entitlements:api-rate-limit-rpm', () => null)
  const pulseAccess = useState<BackendPulseAccess>('entitlements:pulse-access', () => 'full') // DEV OVERRIDE
  const bulkExportEnabled = useState<boolean>('entitlements:bulk-export-enabled', () => true) // DEV OVERRIDE
  const indicesApiEnabled = useState<boolean>('entitlements:indices-api-enabled', () => true) // DEV OVERRIDE
  const dailyAlertsEnabled = useState<boolean>('entitlements:daily-alerts-enabled', () => true) // DEV OVERRIDE
  const smartAlertsEnabled = useState<boolean>('entitlements:smart-alerts-enabled', () => true) // DEV OVERRIDE
  const indexThresholdAlertsEnabled = useState<boolean>('entitlements:index-threshold-alerts-enabled', () => true) // DEV OVERRIDE
  const indicesExportsEnabled = useState<boolean>('entitlements:indices-exports-enabled', () => true) // DEV OVERRIDE
  const pulseEmbedsEnabled = useState<boolean>('entitlements:pulse-embeds-enabled', () => true) // DEV OVERRIDE
  const indicesEmbedsEnabled = useState<boolean>('entitlements:indices-embeds-enabled', () => true) // DEV OVERRIDE
  const billing = useState<MeResponse['billing'] | null>('entitlements:billing', () => null)
  const loading = useState<boolean>('entitlements:loading', () => false)
  const error = useState<string | null>('entitlements:error', () => null)
  const hydrated = useState<boolean>('entitlements:hydrated', () => false)
  const refreshInFlight = useState<boolean>('entitlements:refreshing', () => false)

  const isPlus = computed(() => {
    return plan.value === 'plus' || plan.value === 'enterprise'
  })

  const isEnterprise = computed(() => {
    return plan.value === 'enterprise'
  })

  const pulseLevel = computed(() => {
    // Prefer backend entitlements (authoritative). Fallback to plan mapping if missing.
    const access = pulseAccess.value
    return access ? pulseAccessToPulseLevel(access) : planToPulseLevel(plan.value)
  })

  const hasPaidAccess = computed(() => plan.value === 'plus' || plan.value === 'enterprise')

  const resetToFree = () => {
    return // DEV OVERRIDE – prevent reset to free (remove before deploy)
    storedPlanCode.value = 'free'
    planStatus.value = 'active'
    planLifecycleState.value = 'active'
    recoveryAvailable.value = false
    recoveryAction.value = 'none'
    limits.value = {
      watchlistItems: 3,
      alerts: 1,
      historyDays: 30,
      exports: false,
      exportsMaxDays: 0,
    }
    apiAccess.value = false
    apiTier.value = null
    apiKeyMax.value = null
    apiRateLimitRpm.value = null
    pulseAccess.value = 'none'
    bulkExportEnabled.value = false
    indicesApiEnabled.value = false
    dailyAlertsEnabled.value = false
    smartAlertsEnabled.value = false
    indexThresholdAlertsEnabled.value = false
    indicesExportsEnabled.value = false
    pulseEmbedsEnabled.value = false
    indicesEmbedsEnabled.value = false
    billing.value = null
  }

  async function fetchPlan() {
    if (!isLoggedIn.value) {
      resetToFree()
      hydrated.value = true
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await request<MeResponse>('/me', {
        retries: UI_BOOTSTRAP_RETRIES,
      })

      if (data.success && data.plan) {
        const storedPlan
          = data.plan.plan_code === 'enterprise'
            ? 'enterprise'
            : (data.plan.plan_code === 'plus' ? 'plus' : 'free')
        const effectivePlanCode = data.plan_effective?.plan_code || data.plan.plan_code
        const planCode
          = effectivePlanCode === 'enterprise'
            ? 'enterprise'
            : (effectivePlanCode === 'plus' ? 'plus' : 'free')
        plan.value = planCode
        storedPlanCode.value = storedPlan
        planStatus.value = data.plan.status || 'active'
        planLifecycleState.value = data.plan_effective?.lifecycle_state || 'active'
        recoveryAvailable.value = Boolean(data.plan_effective?.recovery_available)
        recoveryAction.value = data.plan_effective?.recovery_action || 'none'
        limits.value = mapEntitlementsToLimits(data.entitlements)
        apiAccess.value = Boolean(data.entitlements.api_access)
        apiTier.value = data.entitlements.api_tier
        apiKeyMax.value = data.entitlements.api_key_max ?? null
        apiRateLimitRpm.value = data.entitlements.api_rate_limit_rpm ?? null
        pulseAccess.value = data.entitlements.pulse_access
        bulkExportEnabled.value = Boolean(data.entitlements.bulk_export)
        indicesApiEnabled.value = Boolean(data.entitlements.indices_api)
        dailyAlertsEnabled.value = Boolean(data.entitlements.daily_alerts_enabled)
        smartAlertsEnabled.value = Boolean(data.entitlements.smart_alerts_enabled)
        indexThresholdAlertsEnabled.value = Boolean(data.entitlements.index_threshold_alerts_enabled)
        indicesExportsEnabled.value = Boolean(data.entitlements.indices_exports_enabled)
        pulseEmbedsEnabled.value = Boolean(data.entitlements.pulse_embeds_enabled)
        indicesEmbedsEnabled.value = Boolean(data.entitlements.indices_embeds_enabled)
        billing.value = data.billing ?? null
        if (data.user) {
          applyBackendProfile(data.user)
        }
        hydrated.value = true
      }
      else {
        throw new Error('Invalid response from /me endpoint')
      }
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch plan'
      if (!hydrated.value) {
        resetToFree()
      }
      hydrated.value = true
    }
    finally {
      loading.value = false
    }
  }

  async function refreshPlan() {
    if (refreshInFlight.value) return
    refreshInFlight.value = true
    try {
      await fetchPlan()
    }
    finally {
      refreshInFlight.value = false
    }
  }

  // Auto-fetch on mount if logged in
  onMounted(() => {
    if (isLoggedIn.value) {
      fetchPlan()
    }
    else {
      hydrated.value = true
    }
  })

  // Auto-fetch when auth state changes
  watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) {
      fetchPlan()
    }
    else {
      resetToFree()
      hydrated.value = true
    }
  })

  return {
    plan: readonly(plan),
    storedPlanCode: readonly(storedPlanCode),
    planStatus: readonly(planStatus),
    planLifecycleState: readonly(planLifecycleState),
    recoveryAvailable: readonly(recoveryAvailable),
    recoveryAction: readonly(recoveryAction),
    hasPaidAccess,
    limits: readonly(limits),
    billing: readonly(billing),
    hydrated: readonly(hydrated),
    loading: readonly(loading),
    error: readonly(error),
    isPlus,
    isEnterprise,
    pulseLevel,
    apiAccess: readonly(apiAccess),
    apiTier: readonly(apiTier),
    apiKeyMax: readonly(apiKeyMax),
    apiRateLimitRpm: readonly(apiRateLimitRpm),
    bulkExportEnabled: readonly(bulkExportEnabled),
    indicesApiEnabled: readonly(indicesApiEnabled),
    dailyAlertsEnabled: readonly(dailyAlertsEnabled),
    smartAlertsEnabled: readonly(smartAlertsEnabled),
    indexThresholdAlertsEnabled: readonly(indexThresholdAlertsEnabled),
    indicesExportsEnabled: readonly(indicesExportsEnabled),
    pulseEmbedsEnabled: readonly(pulseEmbedsEnabled),
    indicesEmbedsEnabled: readonly(indicesEmbedsEnabled),
    refreshPlan,
  }
}
