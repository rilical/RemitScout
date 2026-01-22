import type { Pool } from 'pg'

import { query } from '../../../shared/db'
import { parseCorridorId } from '../../../shared/corridor'

export type TierSuggestion = {
  corridorId: string
  providerCount: number
  suggestedTier: 'tier_2_reference' | 'tier_3_discovery'
}

export type TierSuggestionSummary = {
  corridors: number
  suggestedTier2: number
  suggestedTier3: number
  mismatched: number
  suggestedPromotions: number
  suggestedDemotions: number
}

export const loadTierSuggestions = async (
  pool: Pool,
  minProvidersForTier2: number,
): Promise<Map<string, TierSuggestion>> => {
  const threshold = Math.max(1, Math.floor(minProvidersForTier2))
  const result = await query<{
    corridor_id: string
    provider_id: string
    source_countries: string[] | null
    destination_countries: string[] | null
  }>(
    `SELECT pcc.corridor_id,
            pcc.provider_id,
            rm.source_countries,
            rm.destination_countries
       FROM silver.provider_corridor_capability pcc
       JOIN silver.rights_matrix rm
         ON rm.provider_id = pcc.provider_id
      WHERE pcc.is_supported = true
        AND rm.allowed_collect = true
        AND rm.allowed_b2b = true
        AND rm.stoplist_status = 'active'`,
    [],
    pool,
  )

  const normalizeCountryList = (countries?: string[] | null): string[] => {
    if (!Array.isArray(countries)) return []
    return countries
      .map((code) => code?.trim().toUpperCase())
      .filter((code): code is string => Boolean(code))
  }

  const corridorProviders = new Map<string, Set<string>>()

  for (const row of result.rows) {
    if (!row.corridor_id || !row.provider_id) continue
    const parsed = parseCorridorId(row.corridor_id)
    if (!parsed) continue

    const sourceCountries = normalizeCountryList(row.source_countries)
    const destinationCountries = normalizeCountryList(row.destination_countries)
    if (sourceCountries.length === 0 || destinationCountries.length === 0) {
      continue
    }

    if (
      !sourceCountries.includes(parsed.sourceCountry.toUpperCase()) ||
      !destinationCountries.includes(parsed.destCountry.toUpperCase())
    ) {
      continue
    }

    const providers = corridorProviders.get(row.corridor_id) ?? new Set<string>()
    providers.add(row.provider_id)
    corridorProviders.set(row.corridor_id, providers)
  }

  const suggestions = new Map<string, TierSuggestion>()
  for (const [corridorId, providers] of corridorProviders.entries()) {
    const providerCount = providers.size
    const suggestedTier =
      Number.isFinite(providerCount) && providerCount >= threshold
        ? 'tier_2_reference'
        : 'tier_3_discovery'
    suggestions.set(corridorId, {
      corridorId,
      providerCount: Number.isFinite(providerCount) ? providerCount : 0,
      suggestedTier,
    })
  }

  return suggestions
}

export const summarizeTierSuggestions = (
  suggestions: Map<string, TierSuggestion>,
  assignedTiers?: Map<string, string>,
): TierSuggestionSummary => {
  let suggestedTier2 = 0
  let suggestedTier3 = 0
  let mismatched = 0
  let suggestedPromotions = 0
  let suggestedDemotions = 0

  for (const suggestion of suggestions.values()) {
    if (suggestion.suggestedTier === 'tier_2_reference') {
      suggestedTier2 += 1
    } else {
      suggestedTier3 += 1
    }

    if (!assignedTiers) continue

    const assigned = assignedTiers.get(suggestion.corridorId) ?? 'tier_2_reference'
    if (assigned === suggestion.suggestedTier) continue

    mismatched += 1
    if (assigned === 'tier_3_discovery' && suggestion.suggestedTier === 'tier_2_reference') {
      suggestedPromotions += 1
    } else if (assigned !== 'tier_3_discovery' && suggestion.suggestedTier === 'tier_3_discovery') {
      suggestedDemotions += 1
    }
  }

  return {
    corridors: suggestions.size,
    suggestedTier2,
    suggestedTier3,
    mismatched,
    suggestedPromotions,
    suggestedDemotions,
  }
}
