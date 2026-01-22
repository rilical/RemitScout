export type PlanCode = 'free' | 'plus' | 'enterprise'

export type Entitlements = {
  pulse_access: 'none' | 'full'
  exports_enabled: boolean
  alerts_max: number | null
  history_max_days: number | null
  watchlist_items: number | null
  api_access: boolean
  api_tier: number | null
  api_cadence_hours: number | null
}

const entitlementsByPlan: Record<PlanCode, Entitlements> = {
  free: {
    pulse_access: 'none',
    exports_enabled: false,
    alerts_max: 3,
    history_max_days: 30,
    watchlist_items: 3,
    api_access: false,
    api_tier: null,
    api_cadence_hours: null,
  },
  plus: {
    pulse_access: 'full',
    exports_enabled: true,
    alerts_max: null,
    history_max_days: 365,
    watchlist_items: null,
    api_access: false,
    api_tier: null,
    api_cadence_hours: null,
  },
  enterprise: {
    pulse_access: 'full',
    exports_enabled: true,
    alerts_max: null,
    history_max_days: null,
    watchlist_items: null,
    api_access: true,
    api_tier: 2,
    api_cadence_hours: 6,
  },
}

export const getEntitlementsForPlan = (planCode?: string): Entitlements => {
  if (planCode === 'plus' || planCode === 'enterprise' || planCode === 'free') {
    return entitlementsByPlan[planCode]
  }
  return entitlementsByPlan.free
}
