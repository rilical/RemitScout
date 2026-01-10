import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { parseCorridorId } from '../shared/corridor'
import { RightsMatrixRepository } from '../plane-b/src/repositories/implementations/rights-matrix-repository'
import {
  REMITLY_DESTINATION_COUNTRIES,
  REMITLY_SOURCE_COUNTRIES,
  REMITLY_SUPPORTED_CORRIDORS,
} from '../plane-b/src/providers/remitly/supported-corridors'
import { WISE_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/wise/supported-corridors'
import { XE_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/xe/supported-corridors'
import { WORLDREMIT_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/worldremit/supported-corridors'
import { WESTERNUNION_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/westernunion/supported-corridors'
import { WELLSFARGO_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/wellsfargo/supported-corridors'

type CountrySupport = {
  providerId: string
  sourceCountries: string[]
  destinationCountries: string[]
}

type CorridorSupport = {
  providerId: string
  corridors: string[]
}

const normalizeCountryList = (values: string[]) => {
  const normalized = values
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length === 2)
  return Array.from(new Set(normalized)).sort()
}

const buildFromCorridors = (corridors: string[]): { sourceCountries: string[]; destinationCountries: string[] } => {
  const sources = new Set<string>()
  const destinations = new Set<string>()

  for (const corridor of corridors) {
    const parsed = parseCorridorId(corridor)
    if (!parsed) continue
    if (parsed.sourceCountry?.length === 2) {
      sources.add(parsed.sourceCountry.toUpperCase())
    }
    if (parsed.destCountry?.length === 2) {
      destinations.add(parsed.destCountry.toUpperCase())
    }
  }

  return {
    sourceCountries: Array.from(sources).sort(),
    destinationCountries: Array.from(destinations).sort(),
  }
}

const countrySupportEntries: CountrySupport[] = [
  {
    providerId: 'remitly',
    sourceCountries: normalizeCountryList(REMITLY_SOURCE_COUNTRIES),
    destinationCountries: normalizeCountryList(REMITLY_DESTINATION_COUNTRIES),
  },
]

const corridorSupportEntries: CorridorSupport[] = [
  { providerId: 'wise', corridors: WISE_SUPPORTED_CORRIDORS },
  { providerId: 'xe', corridors: XE_SUPPORTED_CORRIDORS },
  { providerId: 'worldremit', corridors: WORLDREMIT_SUPPORTED_CORRIDORS },
  { providerId: 'westernunion', corridors: WESTERNUNION_SUPPORTED_CORRIDORS },
  { providerId: 'wellsfargo', corridors: WELLSFARGO_SUPPORTED_CORRIDORS },
  { providerId: 'remitly', corridors: REMITLY_SUPPORTED_CORRIDORS },
]

const main = async () => {
  const pool = createPool(config.db.planeBUrl)
  const repo = new RightsMatrixRepository(pool)

  try {
    const results: CountrySupport[] = [...countrySupportEntries]

    for (const entry of corridorSupportEntries) {
      if (results.some((existing) => existing.providerId === entry.providerId)) {
        continue
      }
      const { sourceCountries, destinationCountries } = buildFromCorridors(entry.corridors)
      results.push({
        providerId: entry.providerId,
        sourceCountries,
        destinationCountries,
      })
    }

    for (const entry of results) {
      if (!entry.sourceCountries.length || !entry.destinationCountries.length) {
        console.warn('[rights-matrix] skipping empty support list', {
          provider_id: entry.providerId,
          source_count: entry.sourceCountries.length,
          destination_count: entry.destinationCountries.length,
        })
        continue
      }
      await repo.upsertProviderCountrySupport({
        providerId: entry.providerId,
        sourceCountries: entry.sourceCountries,
        destinationCountries: entry.destinationCountries,
      })
      console.log('[rights-matrix] updated country support', {
        provider_id: entry.providerId,
        source_count: entry.sourceCountries.length,
        destination_count: entry.destinationCountries.length,
      })
    }
  } finally {
    await pool.end().catch(() => {
      // Ignore pool close errors.
    })
  }
}

main().catch((error) => {
  console.error('[rights-matrix] country support sync failed', error)
  process.exitCode = 1
})
