export type Plan = 'free' | 'plus'

export type Limit = number | 'unlimited'

export type PlanLimits = {
  watchlistItems: Limit
  alerts: Limit
  historyDays: Limit
  exports: boolean
}

const FREE_LIMITS: PlanLimits = {
  watchlistItems: 1,
  alerts: 1,
  historyDays: 7,
  exports: false,
}

const PLUS_LIMITS: PlanLimits = {
  watchlistItems: 'unlimited',
  alerts: 'unlimited',
  historyDays: 365,
  exports: true,
}

export const useEntitlements = () => {
  const { state: plan, hydrated, reset } = usePersistedState<Plan>('entitlements:plan', () => 'free')

  const isPlus = computed(() => plan.value === 'plus')
  const limits = computed<PlanLimits>(() => isPlus.value ? PLUS_LIMITS : FREE_LIMITS)

  function setPlan(next: Plan) {
    plan.value = next
  }

  function togglePlan() {
    plan.value = plan.value === 'plus' ? 'free' : 'plus'
  }

  return {
    plan,
    hydrated,
    isPlus,
    limits,
    setPlan,
    togglePlan,
    reset,
  }
}
