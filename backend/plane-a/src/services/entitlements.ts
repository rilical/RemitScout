export type PlanCode = 'free' | 'plus' | 'enterprise'

export type Entitlements = {
  pulse_access: 'none' | 'full'
  exports_enabled: boolean
  alerts_max: number | null
  history_max_days: number | null
  watchlist_items: number | null
}

const entitlementsByPlan: Record<PlanCode, Entitlements> = {
  free: {
    pulse_access: 'none',
    exports_enabled: false,
    alerts_max: 3,
    history_max_days: 30,
    watchlist_items: 3,
  },
  plus: {
    pulse_access: 'full',
    exports_enabled: true,
    alerts_max: null,
    history_max_days: 365,
    watchlist_items: null,
  },
  enterprise: {
    pulse_access: 'full',
    exports_enabled: true,
    alerts_max: null,
    history_max_days: null,
    watchlist_items: null,
  },
}

export const getEntitlementsForPlan = (planCode?: string): Entitlements => {
  if (planCode === 'plus' || planCode === 'enterprise' || planCode === 'free') {
    return entitlementsByPlan[planCode]
  }
  return entitlementsByPlan.free
}
