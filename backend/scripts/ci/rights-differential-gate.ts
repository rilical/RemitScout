import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { createLogger } from '../../shared/logger'
import { parseCorridorId } from '../../shared/corridor'
import { resolveCorridorScope } from '../../shared/corridor-scope'
import { providerRegistry } from '../../plane-b/src/providers'

const logger = createLogger('script.ci.rights-differential-gate')

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

type CapabilityRow = {
  provider_id: string
  corridor_id: string
  payin_methods: string[] | null
  payout_methods: string[] | null
  is_supported: boolean | null
}

type RequestedMethod = 'bank' | 'cash' | 'wallet' | 'airtime'

const splitCsv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeUpper = (value: string): string => value.trim().toUpperCase()
const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const includesCountry = (list: string[] | null, country: string): boolean => {
  if (!list || !list.length) return false
  const needle = normalizeUpper(country)
  return list.some((value) => normalizeUpper(value) === needle)
}

const toMethod = (value?: string | null): RequestedMethod | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (!token) return null
  if (token === 'airtime' || token.includes('airtime') || token.includes('topup') || token.includes('top_up')) return 'airtime'
  if (token === 'wallet' || token.includes('wallet') || token.includes('mobile_money')) return 'wallet'
  if (token === 'cash' || token.includes('cash')) return 'cash'
  if (token === 'bank' || token.includes('bank') || token.includes('account') || token.includes('card')) return 'bank'
  return null
}

const parseMethods = (value: string | undefined): RequestedMethod[] => {
  const raw = splitCsv(value).map((v) => v.trim().toLowerCase())
  if (!raw.length) return ['bank']
  const mapped = raw
    .map((item): RequestedMethod | null => {
      if (item === 'bank') return 'bank'
      if (item === 'cash') return 'cash'
      if (item === 'wallet') return 'wallet'
      if (item === 'airtime') return 'airtime'
      return null
    })
    .filter((item): item is RequestedMethod => Boolean(item))
  return mapped.length ? Array.from(new Set(mapped)) : ['bank']
}

const normalizeProviderId = (value: string): string => value.trim().toLowerCase()
const sortedUnique = (values: string[]): string[] => Array.from(new Set(values.map(normalizeProviderId))).sort()
const arraysEqual = (a: string[], b: string[]): boolean => a.length === b.length && a.every((item, idx) => item === b[idx])

const isStrictB2cActive = (row: RightsRow | undefined): boolean => Boolean(
  row
  && row.allowed_collect
  && row.allowed_b2c
  && (row.stoplist_status || '').toLowerCase() === 'active'
  && (row.status || '').toLowerCase() === 'production',
)

const isStrictB2bActive = (row: RightsRow | undefined): boolean => Boolean(
  row
  && row.allowed_collect
  && row.allowed_b2b
  && (row.stoplist_status || '').toLowerCase() === 'active'
  && (row.status || '').toLowerCase() === 'production',
)

const capabilitySupportsMethod = (row: CapabilityRow, method: RequestedMethod): boolean => {
  const payin = (row.payin_methods || []).map((item) => toMethod(item)).filter((item): item is RequestedMethod => Boolean(item))
  const payoutFallback = row.payout_methods && row.payout_methods.length ? row.payout_methods : ['bank_deposit']
  const payout = payoutFallback.map((item) => toMethod(item)).filter((item): item is RequestedMethod => Boolean(item))
  return payin.includes(method) || payout.includes(method)
}

const run = async () => {
  const envName = String(config.envName || config.env || 'dev').toLowerCase()
  const prodLike = envName === 'staging' || envName === 'prod' || envName === 'production'
  const rightsScopeRaw = (process.env.RIGHTS_SCOPE || 'priority').trim().toLowerCase()
  if (rightsScopeRaw !== 'all' && rightsScopeRaw !== 'priority') {
    throw new Error(`Invalid RIGHTS_SCOPE: ${process.env.RIGHTS_SCOPE}`)
  }
  const rightsScope = rightsScopeRaw === 'all' ? 'all' : 'priority'
  const priorityCorridors = splitCsv(process.env.PRIORITY_CORRIDORS)
    .map(normalizeUpper)
    .filter((corridorId) => Boolean(parseCorridorId(corridorId)))
  const methods = parseMethods(process.env.METHODS)
  const maxRightsGap = Number(process.env.MAX_RIGHTS_GAP ?? '0')
  const maxActiveB2cCountrySetGaps = toNumber(process.env.MAX_ACTIVE_B2C_EMPTY_COUNTRY_ROWS, 0)
  const maxExcludedRightsDominantRows = toNumber(process.env.MAX_EXCLUDED_RIGHTS_DOMINANT_ROWS, 0)
  const expectedDisabledProviderSet = sortedUnique(
    splitCsv(process.env.EXPECTED_DISABLED_PROVIDERS).length
      ? splitCsv(process.env.EXPECTED_DISABLED_PROVIDERS)
      : ['wellsfargo'],
  )
  const expectedProviderUniverse = sortedUnique(providerRegistry.map((provider) => provider.providerId))

  const pool = createPool(config.db.planeBUrl)
  try {
    const scopeResult = rightsScope === 'all'
      ? await resolveCorridorScope(pool, {
          scopeEnv: 'all',
          includeCapabilityTableCorridors: true,
        })
      : null
    const corridors = rightsScope === 'all'
      ? (scopeResult?.corridorIds ?? [])
      : (
          priorityCorridors.length
            ? priorityCorridors
            : ['US-AL-USD-ALL', 'US-AR-USD-ARS']
        )

    const [scopeCapabilityResult, rightsCountrySetResult, rightsResult, rightsActiveResult, capResult] = await Promise.all([
      rightsScope === 'all'
        ? query<{ count: string | number }>(
            `SELECT COUNT(*)::bigint AS count
             FROM silver.provider_corridor_capability`,
            [],
            pool,
          )
        : query<{ count: string | number }>(
            `SELECT COUNT(*)::bigint AS count
             FROM silver.provider_corridor_capability
             WHERE corridor_id = ANY($1::text[])`,
            [corridors],
            pool,
          ),
      query<{ count: string | number }>(
        `SELECT COUNT(*)::bigint AS count
         FROM silver.rights_matrix
         WHERE allowed_collect = true
           AND allowed_b2c = true
           AND stoplist_status = 'active'
           AND (
             COALESCE(array_length(source_countries, 1), 0) = 0
             OR COALESCE(array_length(destination_countries, 1), 0) = 0
           )`,
        [],
        pool,
      ),
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
      query<RightsRow>(
        `SELECT provider_id,
                allowed_collect,
                allowed_b2c,
                allowed_b2b,
                stoplist_status,
                status,
                source_countries,
                destination_countries
           FROM silver.rights_matrix
           WHERE allowed_collect = true
             AND allowed_b2c = true
             AND stoplist_status = 'active'`,
        [],
        pool,
      ),
      query<CapabilityRow>(
        rightsScope === 'all'
          ? `SELECT provider_id, corridor_id, payin_methods, payout_methods, is_supported
             FROM silver.provider_corridor_capability`
          : `SELECT provider_id, corridor_id, payin_methods, payout_methods, is_supported
             FROM silver.provider_corridor_capability
             WHERE corridor_id = ANY($1::text[])`,
        rightsScope === 'all' ? [] : [corridors],
        pool,
      ),
    ])

    const capabilityTableRowCount = Number(scopeCapabilityResult.rows[0]?.count ?? 0)
    const activeB2cRightsWithEmptyCountrySets = Number(rightsCountrySetResult.rows[0]?.count ?? 0)
    const warnings: string[] = []
    const dataHealthViolations: string[] = []

    if (capabilityTableRowCount === 0) {
      dataHealthViolations.push('capability_table_empty_for_scope')
    }
    if (activeB2cRightsWithEmptyCountrySets > maxActiveB2cCountrySetGaps) {
      const detail = `active_b2c_empty_country_sets=${activeB2cRightsWithEmptyCountrySets} threshold=${maxActiveB2cCountrySetGaps}`
      if (prodLike) {
        dataHealthViolations.push(detail)
      } else {
        warnings.push(detail)
      }
    }
    const allRightsByProvider = new Map(
      rightsResult.rows.map((row) => [normalizeProviderId(row.provider_id), row]),
    )
    const disabledB2cProviders = expectedProviderUniverse.filter((providerId) => !isStrictB2cActive(allRightsByProvider.get(providerId)))
    const disabledB2bProviders = expectedProviderUniverse.filter((providerId) => !isStrictB2bActive(allRightsByProvider.get(providerId)))
    const activeB2cCount = expectedProviderUniverse.length - disabledB2cProviders.length
    const activeB2bCount = expectedProviderUniverse.length - disabledB2bProviders.length
    if (prodLike) {
      if (!arraysEqual(disabledB2cProviders, expectedDisabledProviderSet)) {
        dataHealthViolations.push(`disabled_b2c_set_mismatch=${disabledB2cProviders.join(',')}`)
      }
      if (!arraysEqual(disabledB2bProviders, expectedDisabledProviderSet)) {
        dataHealthViolations.push(`disabled_b2b_set_mismatch=${disabledB2bProviders.join(',')}`)
      }
    }

    const rightsByProvider = new Map(
      rightsActiveResult.rows.map((row) => [normalizeToken(row.provider_id), row]),
    )
    const capByCorridor = new Map<string, CapabilityRow[]>()
    for (const row of capResult.rows) {
      const corridorId = normalizeUpper(row.corridor_id)
      const bucket = capByCorridor.get(corridorId) ?? []
      bucket.push(row)
      capByCorridor.set(corridorId, bucket)
    }

    const findings: Array<{
      corridorId: string
      method: RequestedMethod
      enforce: number
      ignoreAll: number
      rightsGap: number
      excludedRightsDominant: boolean
    }> = []

    for (const corridorId of corridors) {
      const parsed = parseCorridorId(corridorId)
      if (!parsed) continue
      const rows = capByCorridor.get(corridorId) ?? []

      for (const method of methods) {
        let enforce = 0
        let ignoreAll = 0
        for (const row of rows) {
          if (!row.is_supported) continue
          if (!capabilitySupportsMethod(row, method)) continue
          ignoreAll += 1

          const rights = rightsByProvider.get(normalizeToken(row.provider_id))
          const eligible = Boolean(
            rights
            && includesCountry(rights.source_countries, parsed.sourceCountry)
            && includesCountry(rights.destination_countries, parsed.destCountry),
          )
          if (eligible) enforce += 1
        }

        const rightsGap = Math.max(0, ignoreAll - enforce)
        const excludedRightsDominant = ignoreAll > 0 && enforce === 0
        findings.push({
          corridorId,
          method,
          enforce,
          ignoreAll,
          rightsGap,
          excludedRightsDominant,
        })
      }
    }

    const violations = findings.filter(
      (row) => row.rightsGap > maxRightsGap,
    )
    const excludedRightsDominantRows = findings.filter((row) => row.excludedRightsDominant)

    logger.info('rights_differential_gate_summary', {
      environment: config.env,
      scope: rightsScope,
      scope_corridors: corridors.length,
      scope_provider_catalog_corridors: scopeResult?.providerCatalogCorridorCount ?? null,
      scope_capability_corridors: scopeResult?.capabilityCorridorCount ?? null,
      capability_table_row_count: capabilityTableRowCount,
      active_b2c_rights_with_empty_country_sets: activeB2cRightsWithEmptyCountrySets,
      expected_provider_universe: expectedProviderUniverse,
      expected_disabled_provider_set: expectedDisabledProviderSet,
      active_b2c_count: activeB2cCount,
      active_b2b_count: activeB2bCount,
      disabled_b2c_providers: disabledB2cProviders,
      disabled_b2b_providers: disabledB2bProviders,
      max_excluded_rights_dominant_rows: maxExcludedRightsDominantRows,
      excluded_rights_dominant_rows: excludedRightsDominantRows.length,
      warnings,
      data_health_violations: dataHealthViolations,
      corridors,
      methods,
      max_rights_gap: maxRightsGap,
      findings,
      violations,
    })

    for (const warning of warnings) {
      logger.warn('rights_differential_gate_warning', { warning })
    }

    if (
      dataHealthViolations.length > 0
      || violations.length > 0
      || excludedRightsDominantRows.length > maxExcludedRightsDominantRows
    ) {
      throw new Error(
        `rights_differential_gate_failed: data_health=${dataHealthViolations.length} rights=${violations.length} excluded_rights_dominant=${excludedRightsDominantRows.length}`,
      )
    }

    console.log('✅ rights differential gate passed')
  } finally {
    await pool.end().catch(() => {})
  }
}

run().catch((error) => {
  console.error(
    'rights differential gate failed:',
    error instanceof Error ? error.message : String(error),
  )
  process.exit(1)
})
