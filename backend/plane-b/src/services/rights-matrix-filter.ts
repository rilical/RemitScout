import { parseCorridorId } from '../../../shared/corridor'
import { createLogger } from '../../../shared/logger'

export type RightsMatrixCountryFilter = {
  sourceCountries?: string[] | null
  destinationCountries?: string[] | null
}

export type PriorityQueues = {
  tier1: string[]
  tier2: string[]
  tier3: string[]
  all: string[]
}

const logger = createLogger('plane-b.rights-matrix-filter')

const normalizeCountryList = (countries?: string[] | null): string[] => {
  if (!Array.isArray(countries)) return []
  return countries
    .map((code) => code?.trim().toUpperCase())
    .filter((code): code is string => Boolean(code))
}

const isCountryAllowed = (list: string[], code: string): boolean => {
  return list.length > 0 && list.includes(code.toUpperCase())
}

const filterCorridors = (
  corridors: string[],
  rights: RightsMatrixCountryFilter,
): string[] => {
  const sourceCountries = normalizeCountryList(rights.sourceCountries)
  const destinationCountries = normalizeCountryList(rights.destinationCountries)
  if (sourceCountries.length === 0 || destinationCountries.length === 0) {
    return []
  }

  return corridors.filter((corridorId) => {
    const parsed = parseCorridorId(corridorId)
    if (!parsed) return false
    return isCountryAllowed(sourceCountries, parsed.sourceCountry)
      && isCountryAllowed(destinationCountries, parsed.destCountry)
  })
}

export const filterQueuesByRightsMatrix = (
  queues: PriorityQueues,
  rights: RightsMatrixCountryFilter | undefined,
  providerId: string,
): PriorityQueues => {
  if (!rights) {
    logger.info('rights_matrix_filter_skipped', {
      provider_id: providerId,
      reason: 'missing_rights_entry',
    })
    return { tier1: [], tier2: [], tier3: [], all: [] }
  }

  const sourceCountries = normalizeCountryList(rights.sourceCountries)
  const destinationCountries = normalizeCountryList(rights.destinationCountries)
  if (sourceCountries.length === 0 || destinationCountries.length === 0) {
    logger.info('rights_matrix_filter_skipped', {
      provider_id: providerId,
      reason: 'missing_country_sets',
      source_count: sourceCountries.length,
      destination_count: destinationCountries.length,
    })
    return { tier1: [], tier2: [], tier3: [], all: [] }
  }

  const filtered: PriorityQueues = {
    tier1: filterCorridors(queues.tier1, rights),
    tier2: filterCorridors(queues.tier2, rights),
    tier3: filterCorridors(queues.tier3, rights),
    all: filterCorridors(queues.all, rights),
  }

  logger.info('rights_matrix_filter_applied', {
    provider_id: providerId,
    before_all: queues.all.length,
    after_all: filtered.all.length,
    before_tier1: queues.tier1.length,
    after_tier1: filtered.tier1.length,
    before_tier2: queues.tier2.length,
    after_tier2: filtered.tier2.length,
    before_tier3: queues.tier3.length,
    after_tier3: filtered.tier3.length,
  })

  return filtered
}
