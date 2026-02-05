import { parseCorridorId } from './corridor'
import { config } from './config'

export type CorridorTier = 'tier_1' | 'tier_2'

export const TIER_1_CADENCE_SECONDS = 600       // 10 minutes
export const TIER_2_CADENCE_SECONDS = 10800     // 3 hours
export const TIER_1_SLO_MINUTES = 10
export const TIER_2_SLO_MINUTES = 180           // 3 hours

const DEFAULT_TIER_1_SOURCE_COUNTRIES = ['US'] as const

export const TIER_1_ADDITIONS: string[] = [
  // Add non-US corridors to tier_1:
  // 'GB-IN-GBP-INR',
]

export const TIER_1_EXCLUSIONS: string[] = [
  // Demote specific US corridors to tier_2:
  // 'US-XX-USD-XXX',
]

/**
 * Get the COLLECTION tier for a corridor (determines scraping cadence).
 * - Tier 1: USD-origin corridors, collected every 10 minutes
 * - Tier 2: Non-USD corridors, collected every 3 hours
 */
export function getCorridorTier(corridorId: string): CorridorTier {
  if (config.planeB?.disableTier1) return 'tier_2'
  if (TIER_1_ADDITIONS.includes(corridorId)) return 'tier_1'
  if (TIER_1_EXCLUSIONS.includes(corridorId)) return 'tier_2'

  const parsed = parseCorridorId(corridorId)
  if (!parsed) return 'tier_2'

  return DEFAULT_TIER_1_SOURCE_COUNTRIES.includes(
    parsed.sourceCountry.toUpperCase() as typeof DEFAULT_TIER_1_SOURCE_COUNTRIES[number],
  )
    ? 'tier_1'
    : 'tier_2'
}

/**
 * Check if a corridor is USD-origin (Tier 1 collection).
 */
export function isUsdOriginCorridor(corridorId: string): boolean {
  const parsed = parseCorridorId(corridorId)
  if (!parsed) return false
  return parsed.sourceCurrency.toUpperCase() === 'USD'
}

/**
 * Get the EXPORT tier for a corridor within a given API tier context.
 * 
 * Export model:
 * - Tier 1 API: Only USD-origin corridors (Tier 1 collection)
 * - Tier 2 API: ALL corridors (Tier 1 + Tier 2 collection data)
 * 
 * When serving USD corridors in Tier 2 context:
 * - Data comes from Tier 1 collection (fresher, every 10 min)
 * - Reported cadence is Tier 2 (3 hours) - the SLA guarantee
 * - No duplicate scraping needed
 */
export function getExportTierInfo(
  corridorId: string,
  apiTier: 1 | 2 = 2,
): {
  collectionTier: CorridorTier
  exportTier: 1 | 2
  cadenceMinutes: number
  availableInTier: number[]
} {
  const collectionTier = getCorridorTier(corridorId)
  const isUsd = isUsdOriginCorridor(corridorId)
  const tier1CadenceMinutes = config.planeB?.disableTier1
    ? Math.round(TIER_2_CADENCE_SECONDS / 60)
    : Math.round(TIER_1_CADENCE_SECONDS / 60)

  if (apiTier === 1) {
    return {
      collectionTier,
      exportTier: 1,
      cadenceMinutes: isUsd ? tier1CadenceMinutes : Math.round(TIER_2_CADENCE_SECONDS / 60),
      availableInTier: isUsd ? [1, 2] : [2],
    }
  }

  // Tier 2 API: All corridors available, USD data served at Tier 2 cadence
  return {
    collectionTier,
    exportTier: 2,
    cadenceMinutes: Math.round(TIER_2_CADENCE_SECONDS / 60),
    availableInTier: isUsd ? [1, 2] : [2],
  }
}

/**
 * Check if a corridor should be included in an API tier.
 * - Tier 1: Only USD-origin corridors
 * - Tier 2: ALL corridors (includes Tier 1 data)
 */
export function isCorridorAvailableInTier(corridorId: string, apiTier: 1 | 2): boolean {
  if (apiTier === 2) return true // Tier 2 includes all corridors
  return isUsdOriginCorridor(corridorId) // Tier 1 only USD-origin
}

export function getTierCadenceSeconds(tier: CorridorTier): number {
  if (tier === 'tier_1' && config.planeB?.disableTier1) return TIER_2_CADENCE_SECONDS
  return tier === 'tier_1' ? TIER_1_CADENCE_SECONDS : TIER_2_CADENCE_SECONDS
}

export function getTierSloMinutes(tier: CorridorTier): number {
  if (tier === 'tier_1' && config.planeB?.disableTier1) return TIER_2_SLO_MINUTES
  return tier === 'tier_1' ? TIER_1_SLO_MINUTES : TIER_2_SLO_MINUTES
}
