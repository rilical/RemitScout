export type PlanCode = 'free' | 'plus' | 'enterprise'

export type PlanStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete_expired'
  | 'expired'
  | 'inactive'

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
  daily_alerts_enabled: boolean
  smart_alerts_enabled: boolean
  index_threshold_alerts_enabled: boolean
  indices_exports_enabled: boolean
  pulse_embeds_enabled: boolean
  indices_embeds_enabled: boolean
  api_key_max: number
  api_rate_limit_rpm: number
}

const ENTERPRISE_HISTORY_MAX_DAYS = 365
const ENTERPRISE_EXPORTS_MAX_DAYS = 365

export const normalizePlanCode = (planCode?: string | null): PlanCode => {
  if (planCode === 'plus' || planCode === 'enterprise' || planCode === 'free') {
    return planCode
  }
  return 'free'
}

export const normalizePlanStatus = (status?: string | null): PlanStatus => {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
    case 'expired':
    case 'inactive':
      return status
    default:
      return 'inactive'
  }
}

export const isPlanActiveStatus = (status?: string | null): boolean => {
  const normalized = normalizePlanStatus(status)
  return normalized === 'active' || normalized === 'trialing'
}

export const resolveEffectivePlanCode = (planCode?: string | null, status?: string | null): PlanCode => {
  return isPlanActiveStatus(status) ? normalizePlanCode(planCode) : 'free'
}

export const getEffectiveEntitlementsForPlanStatus = (
  planCode?: string | null,
  status?: string | null,
): Entitlements => {
  return getEntitlementsForPlan(resolveEffectivePlanCode(planCode, status))
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
    daily_alerts_enabled: false,
    smart_alerts_enabled: false,
    index_threshold_alerts_enabled: false,
    indices_exports_enabled: false,
    pulse_embeds_enabled: false,
    indices_embeds_enabled: false,
    api_key_max: 0,
    api_rate_limit_rpm: 0,
  },
  plus: {
    pulse_access: 'lite',
    exports_enabled: true,
    exports_max_days: 30,
    alerts_max: 16,
    history_max_days: 90,
    watchlist_items: 16,
    api_access: false,
    api_tier: null,
    bulk_export: false,
    indices_api: false,
    daily_alerts_enabled: true,
    smart_alerts_enabled: true,
    index_threshold_alerts_enabled: false,
    indices_exports_enabled: false,
    pulse_embeds_enabled: false,
    indices_embeds_enabled: false,
    api_key_max: 0,
    api_rate_limit_rpm: 0,
  },
  enterprise: {
    pulse_access: 'full',
    exports_enabled: true,
    exports_max_days: ENTERPRISE_EXPORTS_MAX_DAYS,
    alerts_max: null,
    history_max_days: ENTERPRISE_HISTORY_MAX_DAYS,
    watchlist_items: null,
    api_access: true,
    api_tier: 2,
    bulk_export: true,
    indices_api: true,
    daily_alerts_enabled: true,
    smart_alerts_enabled: true,
    index_threshold_alerts_enabled: true,
    indices_exports_enabled: true,
    pulse_embeds_enabled: true,
    indices_embeds_enabled: true,
    api_key_max: 5,
    api_rate_limit_rpm: 600,
  },
}

export const getEntitlementsForPlan = (planCode?: string): Entitlements => {
  return entitlementsByPlan[normalizePlanCode(planCode)]
}
