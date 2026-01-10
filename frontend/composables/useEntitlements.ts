export type Plan = 'free' | 'plus'

export type Limit = number | 'unlimited'

export type PlanLimits = {
  watchlistItems: Limit
  alerts: Limit
  historyDays: Limit
  exports: boolean
}

type MeResponse = {
  success: boolean
  timestamp: string
  user: {
    user_id: string
    email: string
    name: string | null
  }
  plan: {
    plan_code: string
    status: string
  }
  billing?: {
    next_billing_date: string | null
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
    pulse_access: 'none' | 'full'
    exports_enabled: boolean
    alerts_max: number | null
    history_max_days: number | null
    watchlist_items: number | null
  }
  usage: {
    alerts_count?: number
    watchlist_count?: number
  }
}

const mapEntitlementsToLimits = (entitlements: MeResponse['entitlements']): PlanLimits => {
  return {
    watchlistItems: entitlements.watchlist_items === null ? 'unlimited' : entitlements.watchlist_items,
    alerts: entitlements.alerts_max === null ? 'unlimited' : (entitlements.alerts_max === 0 ? 1 : entitlements.alerts_max),
    historyDays: entitlements.history_max_days === null ? 'unlimited' : entitlements.history_max_days,
    exports: entitlements.exports_enabled,
  }
}

export const useEntitlements = () => {
  const { request } = useApi()
  const { isLoggedIn, applyBackendProfile } = useAuth()

  const plan = useState<Plan>('entitlements:plan', () => 'free')
  const limits = useState<PlanLimits>('entitlements:limits', () => ({
    watchlistItems: 3,
    alerts: 3,
    historyDays: 30,
    exports: false,
  }))
  const billing = useState<MeResponse['billing'] | null>('entitlements:billing', () => null)
  const loading = useState<boolean>('entitlements:loading', () => false)
  const error = useState<string | null>('entitlements:error', () => null)
  const hydrated = useState<boolean>('entitlements:hydrated', () => false)
  const refreshInFlight = useState<boolean>('entitlements:refreshing', () => false)

  // Check for dev plan override
  const devPlanOverride = useState<Plan | null>('dev:plan-override', () => null)
  
  const isPlus = computed(() => {
    // In dev mode, use override if available
    if (import.meta.dev && devPlanOverride.value) {
      return devPlanOverride.value === 'plus'
    }
    return plan.value === 'plus'
  })

  async function fetchPlan() {
    if (!isLoggedIn.value) {
      plan.value = 'free'
      limits.value = {
        watchlistItems: 3,
        alerts: 3,
        historyDays: 30,
        exports: false,
      }
      billing.value = null
      hydrated.value = true
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await request<MeResponse>('/me')
      
      if (data.success && data.plan) {
        const planCode = data.plan.plan_code === 'plus' ? 'plus' : 'free'
        plan.value = planCode
        limits.value = mapEntitlementsToLimits(data.entitlements)
        billing.value = data.billing ?? null
        if (data.user) {
          applyBackendProfile(data.user)
        }
        hydrated.value = true
      } else {
        throw new Error('Invalid response from /me endpoint')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch plan'
      // Default to free plan on error
      plan.value = 'free'
      limits.value = {
        watchlistItems: 3,
        alerts: 3,
        historyDays: 30,
        exports: false,
      }
      billing.value = null
      hydrated.value = true
    } finally {
      loading.value = false
    }
  }

  async function refreshPlan() {
    if (refreshInFlight.value) return
    refreshInFlight.value = true
    try {
      await fetchPlan()
    } finally {
      refreshInFlight.value = false
    }
  }

  // Auto-fetch on mount if logged in
  onMounted(() => {
    if (isLoggedIn.value) {
      fetchPlan()
    } else {
      hydrated.value = true
    }
  })

  // Auto-fetch when auth state changes
  watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) {
      fetchPlan()
    } else {
      plan.value = 'free'
      limits.value = {
        watchlistItems: 3,
        alerts: 3,
        historyDays: 30,
        exports: false,
      }
      billing.value = null
      hydrated.value = true
    }
  })

  // Expose dev plan override for components that need it
  const getEffectivePlan = () => {
    if (import.meta.dev && devPlanOverride.value) {
      return devPlanOverride.value
    }
    return plan.value
  }

  return {
    plan: readonly(plan),
    limits: readonly(limits),
    billing: readonly(billing),
    hydrated: readonly(hydrated),
    loading: readonly(loading),
    error: readonly(error),
    isPlus,
    getEffectivePlan,
    refreshPlan,
  }
}
