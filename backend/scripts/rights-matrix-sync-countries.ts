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
import { TRANSFERGO_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/transfergo/supported-corridors'
import { PAYSEND_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/paysend/supported-corridors'
import { PANGEA_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/pangea/supported-corridors'
import { RIA_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/ria/supported-corridors'
import { DAHABSHIIL_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/dahabshiil/supported-corridors'
import { SENDWAVE_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/sendwave/supported-corridors'
import { MUKURU_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/mukuru/supported-corridors'
import { WORLDREMIT_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/worldremit/supported-corridors'
import { WESTERNUNION_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/westernunion/supported-corridors'
import { WELLSFARGO_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/wellsfargo/supported-corridors'
import { XOOM_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/xoom/supported-corridors'
import { INSTAREM_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/instarem/supported-corridors'
import { WIREBARLEY_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/wirebarley/supported-corridors'
import { ALANSARI_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/alansari/supported-corridors'
import { INTERMEX_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/intermex/supported-corridors'
import {
  KORONAPAY_DESTINATION_COUNTRIES,
  KORONAPAY_SOURCE_COUNTRIES,
  KORONAPAY_SUPPORTED_CORRIDORS,
} from '../plane-b/src/providers/koronapay/supported-corridors'
import {
  REMITBEE_DESTINATION_COUNTRIES,
  REMITBEE_SOURCE_COUNTRIES,
  REMITBEE_SUPPORTED_CORRIDORS,
} from '../plane-b/src/providers/remitbee/supported-corridors'
import { SINGX_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/singx/supported-corridors'
import { PLACID_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/placid/supported-corridors'

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
  {
    providerId: 'koronapay',
    sourceCountries: normalizeCountryList(KORONAPAY_SOURCE_COUNTRIES),
    destinationCountries: normalizeCountryList(KORONAPAY_DESTINATION_COUNTRIES),
  },
  {
    providerId: 'remitbee',
    sourceCountries: normalizeCountryList(REMITBEE_SOURCE_COUNTRIES),
    destinationCountries: normalizeCountryList(REMITBEE_DESTINATION_COUNTRIES),
  },
]

const corridorSupportEntries: CorridorSupport[] = [
  { providerId: 'wise', corridors: WISE_SUPPORTED_CORRIDORS },
  { providerId: 'xe', corridors: XE_SUPPORTED_CORRIDORS },
  { providerId: 'transfergo', corridors: TRANSFERGO_SUPPORTED_CORRIDORS },
  { providerId: 'paysend', corridors: PAYSEND_SUPPORTED_CORRIDORS },
  { providerId: 'pangea', corridors: PANGEA_SUPPORTED_CORRIDORS },
  { providerId: 'ria', corridors: RIA_SUPPORTED_CORRIDORS },
  { providerId: 'worldremit', corridors: WORLDREMIT_SUPPORTED_CORRIDORS },
  { providerId: 'westernunion', corridors: WESTERNUNION_SUPPORTED_CORRIDORS },
  { providerId: 'wellsfargo', corridors: WELLSFARGO_SUPPORTED_CORRIDORS },
  { providerId: 'xoom', corridors: XOOM_SUPPORTED_CORRIDORS },
  { providerId: 'remitly', corridors: REMITLY_SUPPORTED_CORRIDORS },
  { providerId: 'instarem', corridors: INSTAREM_SUPPORTED_CORRIDORS },
  { providerId: 'wirebarley', corridors: WIREBARLEY_SUPPORTED_CORRIDORS },
  { providerId: 'alansari', corridors: ALANSARI_SUPPORTED_CORRIDORS },
  { providerId: 'intermex', corridors: INTERMEX_SUPPORTED_CORRIDORS },
  { providerId: 'koronapay', corridors: KORONAPAY_SUPPORTED_CORRIDORS },
  { providerId: 'remitbee', corridors: REMITBEE_SUPPORTED_CORRIDORS },
  { providerId: 'singx', corridors: SINGX_SUPPORTED_CORRIDORS },
  { providerId: 'placid', corridors: PLACID_SUPPORTED_CORRIDORS },
  { providerId: 'dahabshiil', corridors: DAHABSHIIL_SUPPORTED_CORRIDORS },
  { providerId: 'sendwave', corridors: SENDWAVE_SUPPORTED_CORRIDORS },
  { providerId: 'mukuru', corridors: MUKURU_SUPPORTED_CORRIDORS },
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
