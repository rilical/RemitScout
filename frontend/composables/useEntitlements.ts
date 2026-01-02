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
  }
  plan: {
    plan_code: string
    status: string
  }
  entitlements: {
    pulse_access: 'none' | 'full'
    exports_enabled: boolean
    alerts_max: number | null
    history_max_days: number | null
  }
  usage: {
    alerts_count?: number
    watchlist_count?: number
  }
}

const mapEntitlementsToLimits = (entitlements: MeResponse['entitlements']): PlanLimits => {
  return {
    watchlistItems: entitlements.pulse_access === 'full' ? 'unlimited' : 3,
    alerts: entitlements.alerts_max === null ? 'unlimited' : (entitlements.alerts_max === 0 ? 1 : entitlements.alerts_max),
    historyDays: entitlements.history_max_days === null ? 'unlimited' : entitlements.history_max_days,
    exports: entitlements.exports_enabled,
  }
}

export const useEntitlements = () => {
  const { request } = useApi()
  const { isLoggedIn } = useAuth()

  const plan = useState<Plan>('entitlements:plan', () => 'free')
  const limits = useState<PlanLimits>('entitlements:limits', () => ({
    watchlistItems: 3,
    alerts: 1,
    historyDays: 30,
    exports: false,
  }))
  const loading = useState<boolean>('entitlements:loading', () => false)
  const error = useState<string | null>('entitlements:error', () => null)
  const hydrated = useState<boolean>('entitlements:hydrated', () => false)

  const isPlus = computed(() => plan.value === 'plus')

  async function fetchPlan() {
    if (!isLoggedIn.value) {
      plan.value = 'free'
      limits.value = {
        watchlistItems: 3,
        alerts: 1,
        historyDays: 30,
        exports: false,
      }
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
        hydrated.value = true
      } else {
        throw new Error('Invalid response from /api/me')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch plan'
      // Default to free plan on error
      plan.value = 'free'
      limits.value = {
        watchlistItems: 3,
        alerts: 1,
        historyDays: 30,
        exports: false,
      }
      hydrated.value = true
    } finally {
      loading.value = false
    }
  }

  async function refreshPlan() {
    await fetchPlan()
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
        alerts: 1,
        historyDays: 30,
        exports: false,
      }
      hydrated.value = true
    }
  })

  return {
    plan: readonly(plan),
    limits: readonly(limits),
    hydrated: readonly(hydrated),
    loading: readonly(loading),
    error: readonly(error),
    isPlus,
    refreshPlan,
  }
}
