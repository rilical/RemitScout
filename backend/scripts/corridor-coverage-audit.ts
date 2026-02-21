/**
 * Corridor coverage audit (major send currencies)
 *
 * Purpose:
 * - Quantify “effective B2B provider coverage” per macro corridor for a send-currency set (USD/AED/GBP/EUR).
 * - Coverage is rights + capability + payout-method compatibility (scheduler-like).
 *
 * Output:
 * - Writes markdown + JSON to OUTPUT_DIR (defaults to /tmp/remit-scout-artifacts/coverage-audit).
 *
 * Notes:
 * - Rights matrix is provider-level (PK provider_id) with source/destination country arrays.
 * - Capability is corridor-level (provider_id + corridor_id) and is required for scheduler enqueue.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import { getMacroCorridors, type MacroCorridor } from '../shared/macro-corridors'

initTracing('corridor-coverage-audit')
initErrorTracking('corridor-coverage-audit')

const logger = createLogger('script.corridor-coverage-audit')

const splitCsv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)

const normalizeUpper = (value: string) => value.trim().toUpperCase()
const normalizeLower = (value: string) => value.trim().toLowerCase()

const ensureDir = (dir: string) => {
  fs.mkdirSync(dir, { recursive: true })
}

type RightsRow = {
  provider_id: string
  allowed_collect: boolean | null
  allowed_b2b: boolean | null
  allowed_b2c: boolean | null
  stoplist_status: string | null
  status: string | null
  source_countries: string[] | null
  destination_countries: string[] | null
}

type CapabilityRow = {
  provider_id: string
  corridor_id: string
  payout_methods: string[] | null
  is_supported: boolean | null
  source: string | null
  last_verified_at: string | null
}

type CapabilityLoadResult = {
  byCorridor: Map<string, Map<string, CapabilityRow>>
  capabilityTableRowCount: number
}

type CorridorCoverage = {
  corridorId: string
  sourceCountry: string
  destCountry: string
  sourceCurrency: string
  destCurrency: string
  rightsEligibleProviders: string[]
  supportedProviders: string[]
  gaps: {
    rights_none: boolean
    capability_missing: string[]
    capability_unsupported: Array<{ provider: string; source: string | null }>
    capability_method_mismatch: Array<{ provider: string; payout_methods: string[] | null }>
  }
}

type CurrencySummary = {
  sendCurrency: string
  corridorsTotal: number
  coverage: { sufficient: number; low: number; none: number }
  topNone: Array<{
    corridorId: string
    rightsEligible: number
    supported: number
    capabilityMissing: number
    capabilityUnsupported: number
    methodMismatch: number
  }>
}

const payoutMethodsDefaultForScheduler = (payoutMethods: string[] | null): string[] => {
  if (!payoutMethods || payoutMethods.length === 0) return ['bank_deposit']
  return payoutMethods.map(normalizeLower).filter(Boolean)
}

const capabilityAllowsPayout = (row: CapabilityRow, payoutMethod: string): boolean => {
  const normalized = normalizeLower(payoutMethod)
  if (!normalized) return true
  const methods = payoutMethodsDefaultForScheduler(row.payout_methods)
  return methods.includes(normalized)
}

const classifyCoverage = (providerCount: number): 'SUFFICIENT' | 'LOW' | 'NONE' => {
  if (providerCount >= 3) return 'SUFFICIENT'
  if (providerCount >= 1) return 'LOW'
  return 'NONE'
}

const loadRights = async (pool: ReturnType<typeof createPool>): Promise<Map<string, RightsRow>> => {
  const result = await query<RightsRow>(
    `SELECT provider_id,
            allowed_collect,
            allowed_b2b,
            allowed_b2c,
            stoplist_status,
            status,
            source_countries,
            destination_countries
       FROM silver.rights_matrix`,
    [],
    pool,
  )
  const map = new Map<string, RightsRow>()
  for (const row of result.rows) {
    if (!row.provider_id) continue
    map.set(row.provider_id, row)
  }
  return map
}

const chunk = <T>(items: T[], size: number): T[][] => {
  if (!Number.isFinite(size) || size <= 0) return [items]
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const loadCapabilitiesForCorridors = async (
  pool: ReturnType<typeof createPool>,
  corridorIds: string[],
): Promise<CapabilityLoadResult> => {
  const byCorridor = new Map<string, Map<string, CapabilityRow>>()
  let capabilityTableRowCount = 0
  if (!corridorIds.length) {
    return { byCorridor, capabilityTableRowCount }
  }

  const chunks = chunk(corridorIds, 1000)
  for (const ids of chunks) {
    const result = await query<CapabilityRow>(
      `SELECT provider_id,
              corridor_id,
              payout_methods,
              is_supported,
              source,
              last_verified_at
         FROM silver.provider_corridor_capability
        WHERE corridor_id = ANY($1::text[])`,
      [ids],
      pool,
    )
    capabilityTableRowCount += result.rows.length
    for (const row of result.rows) {
      if (!row.corridor_id || !row.provider_id) continue
      if (!byCorridor.has(row.corridor_id)) byCorridor.set(row.corridor_id, new Map())
      byCorridor.get(row.corridor_id)!.set(row.provider_id, row)
    }
  }
  return { byCorridor, capabilityTableRowCount }
}

const isActiveRightsRow = (row: RightsRow, requireProduction: boolean): boolean => {
  if (!row.allowed_collect || !row.allowed_b2b) return false
  if ((row.stoplist_status || '').toLowerCase() !== 'active') return false
  if (requireProduction && (row.status || '').toLowerCase() !== 'production') return false
  if (!row.source_countries || row.source_countries.length === 0) return false
  if (!row.destination_countries || row.destination_countries.length === 0) return false
  return true
}

const isActiveB2cRightsRow = (row: RightsRow, requireProduction: boolean): boolean => {
  if (!row.allowed_collect || !row.allowed_b2c) return false
  if ((row.stoplist_status || '').toLowerCase() !== 'active') return false
  if (requireProduction && (row.status || '').toLowerCase() !== 'production') return false
  return true
}

const inCountrySet = (set: string[] | null, code: string): boolean => {
  if (!set || set.length === 0) return false
  const upper = normalizeUpper(code)
  return set.some(c => normalizeUpper(c) === upper)
}

export const runCorridorCoverageAudit = async (): Promise<void> => {
  const runId = process.env.RUN_ID || null
  const sendCurrencies = new Set(
    (splitCsv(process.env.SEND_CURRENCIES).length ? splitCsv(process.env.SEND_CURRENCIES) : ['USD', 'AED', 'GBP', 'EUR'])
      .map(normalizeUpper),
  )
  const payoutMethod = normalizeLower(process.env.LANE_PAYOUT_METHOD || 'bank_deposit')
  const requireProduction = process.env.REQUIRE_STATUS_PRODUCTION === '1'
  const includeDetails = process.env.INCLUDE_DETAILS === '1'
  const strictDataHealth = process.env.STRICT_DATA_HEALTH === '1'

  const outputDir = process.env.OUTPUT_DIR
    ? path.resolve(process.env.OUTPUT_DIR)
    : path.join(os.tmpdir(), 'remit-scout-artifacts', 'coverage-audit')
  ensureDir(outputDir)

  const pool = createPool(config.db.planeBUrl)
  try {
    const allMacro = getMacroCorridors()
    const corridors: MacroCorridor[] = allMacro.filter(c => sendCurrencies.has(normalizeUpper(c.sourceCurrency)))
    const corridorIds = corridors.map(c => c.corridorId)

    const [rightsByProvider, capabilityLoad] = await Promise.all([
      loadRights(pool),
      loadCapabilitiesForCorridors(pool, corridorIds),
    ])
    const capsByCorridor = capabilityLoad.byCorridor
    const capabilityTableRowCount = capabilityLoad.capabilityTableRowCount

    const activeRightsProviders = Array.from(rightsByProvider.entries())
      .filter(([, row]) => isActiveRightsRow(row, requireProduction))
      .map(([providerId]) => providerId)
    const activeB2cRightsRows = Array.from(rightsByProvider.values())
      .filter((row) => isActiveB2cRightsRow(row, requireProduction))
    const activeB2cRightsCount = activeB2cRightsRows.length
    const activeB2cRightsWithCountrySetsCount = activeB2cRightsRows.filter((row) => (
      Array.isArray(row.source_countries)
      && row.source_countries.length > 0
      && Array.isArray(row.destination_countries)
      && row.destination_countries.length > 0
    )).length
    const dataHealthStatus = (
      capabilityTableRowCount > 0
      && activeB2cRightsWithCountrySetsCount > 0
    ) ? 'ok' : 'degraded'
    const strictDataHealthFailures: string[] = []
    if (capabilityTableRowCount === 0) {
      strictDataHealthFailures.push('capability_table_empty_for_scope')
    }
    if (activeB2cRightsWithCountrySetsCount === 0) {
      strictDataHealthFailures.push('active_b2c_rights_country_sets_empty')
    }

    const nowIso = new Date().toISOString()
    const details: CorridorCoverage[] = []

    const summaryByCurrency = new Map<string, CurrencySummary>()
    for (const ccy of Array.from(sendCurrencies.values()).sort()) {
      summaryByCurrency.set(ccy, {
        sendCurrency: ccy,
        corridorsTotal: 0,
        coverage: { sufficient: 0, low: 0, none: 0 },
        topNone: [],
      })
    }

    for (const corridor of corridors) {
      const keyCurrency = normalizeUpper(corridor.sourceCurrency)
      const summary = summaryByCurrency.get(keyCurrency)
      if (summary) summary.corridorsTotal += 1

      const rightsEligibleProviders: string[] = []
      for (const providerId of activeRightsProviders) {
        const rights = rightsByProvider.get(providerId)
        if (!rights) continue
        if (!inCountrySet(rights.source_countries, corridor.sourceCountry)) continue
        if (!inCountrySet(rights.destination_countries, corridor.destCountry)) continue
        rightsEligibleProviders.push(providerId)
      }

      const capMap = capsByCorridor.get(corridor.corridorId) ?? new Map<string, CapabilityRow>()
      const supportedProviders: string[] = []

      const capabilityMissing: string[] = []
      const capabilityUnsupported: Array<{ provider: string; source: string | null }> = []
      const methodMismatch: Array<{ provider: string; payout_methods: string[] | null }> = []

      for (const providerId of rightsEligibleProviders) {
        const cap = capMap.get(providerId) ?? null
        if (!cap) {
          capabilityMissing.push(providerId)
          continue
        }
        if (!cap.is_supported) {
          capabilityUnsupported.push({ provider: providerId, source: cap.source ?? null })
          continue
        }
        if (!capabilityAllowsPayout(cap, payoutMethod)) {
          methodMismatch.push({ provider: providerId, payout_methods: cap.payout_methods ?? null })
          continue
        }
        supportedProviders.push(providerId)
      }

      const bucketStatus = classifyCoverage(supportedProviders.length)
      if (summary) {
        if (bucketStatus === 'SUFFICIENT') summary.coverage.sufficient += 1
        if (bucketStatus === 'LOW') summary.coverage.low += 1
        if (bucketStatus === 'NONE') summary.coverage.none += 1
        if (bucketStatus === 'NONE') {
          summary.topNone.push({
            corridorId: corridor.corridorId,
            rightsEligible: rightsEligibleProviders.length,
            supported: supportedProviders.length,
            capabilityMissing: capabilityMissing.length,
            capabilityUnsupported: capabilityUnsupported.length,
            methodMismatch: methodMismatch.length,
          })
        }
      }

      if (includeDetails) {
        details.push({
          corridorId: corridor.corridorId,
          sourceCountry: corridor.sourceCountry,
          destCountry: corridor.destCountry,
          sourceCurrency: corridor.sourceCurrency,
          destCurrency: corridor.destCurrency,
          rightsEligibleProviders,
          supportedProviders,
          gaps: {
            rights_none: rightsEligibleProviders.length === 0,
            capability_missing: capabilityMissing,
            capability_unsupported: capabilityUnsupported,
            capability_method_mismatch: methodMismatch,
          },
        })
      }
    }

    const summaries: CurrencySummary[] = Array.from(summaryByCurrency.values()).map((s) => {
      s.topNone = s.topNone
        .sort((a, b) => {
          if (b.rightsEligible !== a.rightsEligible) return b.rightsEligible - a.rightsEligible
          return a.corridorId.localeCompare(b.corridorId)
        })
        .slice(0, 50)
      return s
    })

    const jsonPayload = {
      generatedAt: nowIso,
      runId,
      environment: config.envName || config.env,
      sendCurrencies: Array.from(sendCurrencies.values()).sort(),
      payoutMethod,
      requireStatusProduction: requireProduction,
      macroCorridors: corridors.length,
      capabilityTableRowCount,
      activeB2cRightsCount,
      activeB2cRightsWithCountrySetsCount,
      dataHealthStatus,
      summary: summaries,
      ...(includeDetails ? { corridors: details } : {}),
    }

    const baseName = `coverage-audit-${(config.envName || config.env || 'env').toString()}-${nowIso.replace(/[:.]/g, '-')}${runId ? `-${runId}` : ''}`
    const jsonPath = path.join(outputDir, `${baseName}.json`)
    const mdPath = path.join(outputDir, `${baseName}.md`)

    fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2))

    const mdLines: string[] = []
    mdLines.push(`# Corridor Coverage Audit`)
    mdLines.push('')
    mdLines.push(`- GeneratedAt: \`${nowIso}\``)
    mdLines.push(`- Env: \`${config.envName || config.env}\``)
    mdLines.push(`- Send currencies: \`${Array.from(sendCurrencies.values()).sort().join(',')}\``)
    mdLines.push(`- Lane payout method: \`${payoutMethod}\``)
    mdLines.push(`- Require status=production: \`${requireProduction ? 'yes' : 'no'}\``)
    mdLines.push(`- Macro corridors evaluated: \`${corridors.length}\``)
    mdLines.push(`- Capability table rows (scope): \`${capabilityTableRowCount}\``)
    mdLines.push(`- Active B2C rights rows: \`${activeB2cRightsCount}\``)
    mdLines.push(`- Active B2C rights rows with country sets: \`${activeB2cRightsWithCountrySetsCount}\``)
    mdLines.push(`- Data health: \`${dataHealthStatus}\``)
    mdLines.push('')

    mdLines.push(`## Summary`)
    mdLines.push('')
    mdLines.push(`| Send currency | Corridors | >=3 providers | 1-2 providers | 0 providers |`)
    mdLines.push(`|---|---:|---:|---:|---:|`)
    for (const s of summaries) {
      mdLines.push(`| ${s.sendCurrency} | ${s.corridorsTotal} | ${s.coverage.sufficient} | ${s.coverage.low} | ${s.coverage.none} |`)
    }
    mdLines.push('')

    for (const s of summaries) {
      mdLines.push(`## Top NONE corridors (${s.sendCurrency})`)
      mdLines.push('')
      mdLines.push(`| Corridor | Rights-eligible | Supported | Missing capability | Unsupported | Method mismatch |`)
      mdLines.push(`|---|---:|---:|---:|---:|---:|`)
      for (const row of s.topNone) {
        mdLines.push(`| ${row.corridorId} | ${row.rightsEligible} | ${row.supported} | ${row.capabilityMissing} | ${row.capabilityUnsupported} | ${row.methodMismatch} |`)
      }
      mdLines.push('')
    }

    fs.writeFileSync(mdPath, mdLines.join('\n'))

    logger.info('coverage_audit_complete', {
      run_id: runId,
      output_dir: outputDir,
      json: jsonPath,
      markdown: mdPath,
      send_currencies: Array.from(sendCurrencies.values()),
      payout_method: payoutMethod,
      macro_corridors: corridors.length,
      capability_table_row_count: capabilityTableRowCount,
      active_b2c_rights_count: activeB2cRightsCount,
      active_b2c_rights_with_country_sets_count: activeB2cRightsWithCountrySetsCount,
      data_health_status: dataHealthStatus,
      include_details: includeDetails,
      require_production: requireProduction,
      summary: summaries,
    })
    if (dataHealthStatus === 'degraded') {
      logger.warn('coverage_audit_data_health_degraded', {
        capability_table_row_count: capabilityTableRowCount,
        active_b2c_rights_count: activeB2cRightsCount,
        active_b2c_rights_with_country_sets_count: activeB2cRightsWithCountrySetsCount,
      })
    }
    if (strictDataHealth && strictDataHealthFailures.length > 0) {
      throw new Error(`strict_data_health_failed: ${strictDataHealthFailures.join(',')}`)
    }
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runCorridorCoverageAudit().catch((error) => {
    logger.error('coverage_audit_failed', {
      run_id: process.env.RUN_ID || null,
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
