export type PlanCode = 'free' | 'plus' | 'enterprise'

export type Entitlements = {
  pulse_access: 'none' | 'lite' | 'full'
  exports_enabled: boolean
  exports_max_days: number | null
  alerts_max: number | null
  history_max_days: number | null
  watchlist_items: number | null
  api_access: boolean
  api_tier: 1 | 2 | null
  bulk_export: boolean
  indices_api: boolean
}

/**
 * API Tier System (aligned with corridor tiers):
 * - Tier 1: USD-origin corridors, 10-minute freshness
 * - Tier 2: All other corridors, 3-hour freshness
 *
 * Enterprise accounts get access to both tiers.
 * Data freshness matches the underlying B2B sweep cadence.
 */
const entitlementsByPlan: Record<PlanCode, Entitlements> = {
  free: {
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
  },
  plus: {
    pulse_access: 'lite',
    exports_enabled: true,
    exports_max_days: 30,
    alerts_max: 16,
    history_max_days: 365,
    watchlist_items: 16,
    api_access: false,
    api_tier: null,
    bulk_export: false,
    indices_api: false,
  },
  enterprise: {
    pulse_access: 'full',
    exports_enabled: true,
    exports_max_days: null,
    alerts_max: null,
    history_max_days: null,
    watchlist_items: null,
    api_access: true,
    api_tier: 2,
    bulk_export: true,
    indices_api: true,
  },
}

export const getEntitlementsForPlan = (planCode?: string): Entitlements => {
  if (planCode === 'plus' || planCode === 'enterprise' || planCode === 'free') {
    return entitlementsByPlan[planCode]
  }
  return entitlementsByPlan.free
}
