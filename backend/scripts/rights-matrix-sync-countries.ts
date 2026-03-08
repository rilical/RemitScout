import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { parseCorridorId } from '../shared/corridor'
import { initTracing } from '../shared/tracing'
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
import {
  BOSSMONEY_DESTINATION_COUNTRIES,
  BOSSMONEY_SOURCE_COUNTRIES,
  BOSSMONEY_SUPPORTED_CORRIDORS,
} from '../plane-b/src/providers/bossmoney/supported-corridors'
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
import {
  ORBITREMIT_DESTINATION_COUNTRIES,
  ORBITREMIT_SOURCE_COUNTRIES,
  ORBITREMIT_SUPPORTED_CORRIDORS,
} from '../plane-b/src/providers/orbitremit/supported-corridors'
import { SINGX_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/singx/supported-corridors'
import { PLACID_SUPPORTED_CORRIDORS } from '../plane-b/src/providers/placid/supported-corridors'

initTracing('rights-matrix-sync-countries')

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
    providerId: 'bossmoney',
    sourceCountries: normalizeCountryList(BOSSMONEY_SOURCE_COUNTRIES),
    destinationCountries: normalizeCountryList(BOSSMONEY_DESTINATION_COUNTRIES),
  },
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
  {
    providerId: 'orbitremit',
    sourceCountries: normalizeCountryList(ORBITREMIT_SOURCE_COUNTRIES),
    destinationCountries: normalizeCountryList(ORBITREMIT_DESTINATION_COUNTRIES),
  },
]

const corridorSupportEntries: CorridorSupport[] = [
  { providerId: 'wise', corridors: WISE_SUPPORTED_CORRIDORS },
  { providerId: 'xe', corridors: XE_SUPPORTED_CORRIDORS },
  { providerId: 'transfergo', corridors: TRANSFERGO_SUPPORTED_CORRIDORS },
  { providerId: 'paysend', corridors: PAYSEND_SUPPORTED_CORRIDORS },
  { providerId: 'pangea', corridors: PANGEA_SUPPORTED_CORRIDORS },
  { providerId: 'bossmoney', corridors: BOSSMONEY_SUPPORTED_CORRIDORS },
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
  { providerId: 'orbitremit', corridors: ORBITREMIT_SUPPORTED_CORRIDORS },
  { providerId: 'singx', corridors: SINGX_SUPPORTED_CORRIDORS },
  { providerId: 'placid', corridors: PLACID_SUPPORTED_CORRIDORS },
  { providerId: 'dahabshiil', corridors: DAHABSHIIL_SUPPORTED_CORRIDORS },
  { providerId: 'sendwave', corridors: SENDWAVE_SUPPORTED_CORRIDORS },
  { providerId: 'mukuru', corridors: MUKURU_SUPPORTED_CORRIDORS },
]

export const runRightsMatrixSyncCountries = async (): Promise<void> => {
  const strictCountrySync = process.env.STRICT_COUNTRY_SYNC === '1'
  const pool = createPool(config.db.planeBUrl)

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

    const valid = results.filter((entry) => {
      if (entry.sourceCountries.length && entry.destinationCountries.length) return true
      console.warn('[rights-matrix] skipping empty support list', {
        provider_id: entry.providerId,
        source_count: entry.sourceCountries.length,
        destination_count: entry.destinationCountries.length,
      })
      return false
    })

    if (valid.length > 0) {
      // NOTE: pg's array encoding for nested arrays is inconsistent across runtime/build configs.
      // A simple per-provider upsert is deterministic and fast enough (~24 providers).
      for (const entry of valid) {
        await query(
          `INSERT INTO silver.rights_matrix (provider_id, source_countries, destination_countries)
           VALUES ($1, $2::text[], $3::text[])
           ON CONFLICT (provider_id) DO UPDATE SET
             source_countries = EXCLUDED.source_countries,
             destination_countries = EXCLUDED.destination_countries,
             updated_at = NOW()`,
          [entry.providerId, entry.sourceCountries, entry.destinationCountries],
          pool,
        )
      }
    }

    for (const entry of valid) {
      console.log('[rights-matrix] updated country support', {
        provider_id: entry.providerId,
        source_count: entry.sourceCountries.length,
        destination_count: entry.destinationCountries.length,
      })
    }

    const activeB2cEmptyCountrySet = await query<{ provider_id: string }>(
      `SELECT provider_id
         FROM silver.rights_matrix
        WHERE allowed_collect = true
          AND allowed_b2c = true
          AND stoplist_status = 'active'
          AND (
            COALESCE(array_length(source_countries, 1), 0) = 0
            OR COALESCE(array_length(destination_countries, 1), 0) = 0
          )
        ORDER BY provider_id`,
      [],
      pool,
    )

    if (activeB2cEmptyCountrySet.rows.length > 0) {
      console.warn('[rights-matrix] active b2c providers with empty country sets', {
        count: activeB2cEmptyCountrySet.rows.length,
        providers: activeB2cEmptyCountrySet.rows.map((row) => row.provider_id),
      })
    }

    if (strictCountrySync && activeB2cEmptyCountrySet.rows.length > 0) {
      throw new Error(
        `strict_country_sync_failed: ${activeB2cEmptyCountrySet.rows.map((row) => row.provider_id).join(',')}`,
      )
    }
  } finally {
    await pool.end().catch(() => {
      // Ignore pool close errors.
    })
  }
}

if (require.main === module) {
  runRightsMatrixSyncCountries()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('[rights-matrix] country support sync failed', error)
      process.exit(1)
    })
}
