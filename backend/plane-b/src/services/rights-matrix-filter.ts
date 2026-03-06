import { createLogger } from '../../../shared/logger'
import { isRightsMatrixCorridorEligible } from '../../../shared/rights-matrix-corridor'

export type RightsMatrixCountryFilter = {
  sourceCountries?: string[] | null
  destinationCountries?: string[] | null
}

export type PriorityQueues = {
  tier1: string[]
  tier2: string[]
  all: string[]
}

const logger = createLogger('plane-b.rights-matrix-filter')

const normalizeCountryList = (countries?: string[] | null): string[] => {
  if (!Array.isArray(countries)) return []
  return countries
    .map((code) => code?.trim().toUpperCase())
    .filter((code): code is string => Boolean(code))
}

const filterCorridors = (
  corridors: string[],
  rights: RightsMatrixCountryFilter,
): string[] => corridors.filter((corridorId) => isRightsMatrixCorridorEligible(corridorId, rights))

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
    return { tier1: [], tier2: [], all: [] }
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
    return { tier1: [], tier2: [], all: [] }
  }

  const filtered: PriorityQueues = {
    tier1: filterCorridors(queues.tier1, rights),
    tier2: filterCorridors(queues.tier2, rights),
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
  })

  return filtered
}
