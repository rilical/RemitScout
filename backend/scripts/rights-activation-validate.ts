import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import { providerRegistry } from '../plane-b/src/providers'

initTracing('rights-activation-validate')
initErrorTracking('rights-activation-validate')

const logger = createLogger('script.rights-activation-validate')

type RightsRow = {
  provider_id: string
  allowed_collect: boolean | null
  allowed_b2c: boolean | null
  allowed_b2b: boolean | null
  stoplist_status: string | null
  status: string | null
  source_countries: string[] | null
  destination_countries: string[] | null
}

const normalizeLower = (value: string): string => value.trim().toLowerCase()

const normalizeList = (values: string[]): string[] =>
  Array.from(new Set(values.map(normalizeLower).filter(Boolean))).sort()

const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false
  return a.every((item, idx) => item === b[idx])
}

const isB2cActive = (row: RightsRow | undefined): boolean => {
  if (!row) return false
  return Boolean(
    row.allowed_collect
    && row.allowed_b2c
    && (row.stoplist_status || '').toLowerCase() === 'active'
    && (row.status || '').toLowerCase() === 'production',
  )
}

const isB2bActive = (row: RightsRow | undefined): boolean => {
  if (!row) return false
  return Boolean(
    row.allowed_collect
    && row.allowed_b2b
    && (row.stoplist_status || '').toLowerCase() === 'active'
    && (row.status || '').toLowerCase() === 'production',
  )
}

const hasCountrySets = (row: RightsRow | undefined): boolean =>
  Boolean(
    row
    && Array.isArray(row.source_countries)
    && row.source_countries.length > 0
    && Array.isArray(row.destination_countries)
    && row.destination_countries.length > 0,
  )

export const runRightsActivationValidate = async (): Promise<void> => {
  const expectedProviders = normalizeList(providerRegistry.map((provider) => provider.providerId))
  const expectedDisabled = ['wellsfargo']

  const pool = createPool(config.db.planeBUrl)
  try {
    const [rightsResult, capabilityCountResult] = await Promise.all([
      query<RightsRow>(
        `SELECT provider_id,
                allowed_collect,
                allowed_b2c,
                allowed_b2b,
                stoplist_status,
                status,
                source_countries,
                destination_countries
           FROM silver.rights_matrix`,
        [],
        pool,
      ),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
           FROM silver.provider_corridor_capability
          WHERE is_supported = true`,
        [],
        pool,
      ),
    ])

    const rightsByProvider = new Map<string, RightsRow>()
    for (const row of rightsResult.rows) {
      if (!row.provider_id) continue
      rightsByProvider.set(normalizeLower(row.provider_id), row)
    }

    const activeB2cProviders = expectedProviders.filter((providerId) => isB2cActive(rightsByProvider.get(providerId)))
    const activeB2bProviders = expectedProviders.filter((providerId) => isB2bActive(rightsByProvider.get(providerId)))
    const disabledB2cProviders = expectedProviders.filter((providerId) => !isB2cActive(rightsByProvider.get(providerId)))
    const disabledB2bProviders = expectedProviders.filter((providerId) => !isB2bActive(rightsByProvider.get(providerId)))
    const activeB2cWithCountrySets = activeB2cProviders.filter((providerId) => hasCountrySets(rightsByProvider.get(providerId)))

    const capabilityTableRowCount = Number(capabilityCountResult.rows[0]?.count ?? '0')
    const expectedActiveCount = Math.max(0, expectedProviders.length - expectedDisabled.length)

    const summary = {
      environment: config.env,
      providerUniverseCount: expectedProviders.length,
      expectedDisabledProviders: expectedDisabled,
      activeB2cCount: activeB2cProviders.length,
      activeB2bCount: activeB2bProviders.length,
      disabledB2cProviders,
      disabledB2bProviders,
      capabilityTableRowCount,
      activeB2cRightsWithCountrySetsCount: activeB2cWithCountrySets.length,
      activeB2cRightsCount: activeB2cProviders.length,
    }

    logger.info('rights_activation_validation_summary', summary)
    console.log(JSON.stringify(summary, null, 2))

    const violations: string[] = []
    if (capabilityTableRowCount <= 0) {
      violations.push('capability_table_empty')
    }
    if (activeB2cProviders.length !== expectedActiveCount) {
      violations.push(`active_b2c_count_mismatch:${activeB2cProviders.length}`)
    }
    if (activeB2bProviders.length !== expectedActiveCount) {
      violations.push(`active_b2b_count_mismatch:${activeB2bProviders.length}`)
    }
    if (!arraysEqual(disabledB2cProviders, expectedDisabled)) {
      violations.push(`disabled_b2c_set_mismatch:${disabledB2cProviders.join(',')}`)
    }
    if (!arraysEqual(disabledB2bProviders, expectedDisabled)) {
      violations.push(`disabled_b2b_set_mismatch:${disabledB2bProviders.join(',')}`)
    }
    if (activeB2cWithCountrySets.length !== activeB2cProviders.length) {
      violations.push('active_b2c_country_sets_incomplete')
    }

    if (violations.length > 0) {
      throw new Error(`rights_activation_validation_failed: ${violations.join(';')}`)
    }
  } finally {
    await pool.end().catch(() => {})
  }
}

if (require.main === module) {
  runRightsActivationValidate().catch((error) => {
    logger.error('rights_activation_validation_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
