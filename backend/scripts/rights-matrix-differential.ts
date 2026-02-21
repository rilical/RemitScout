/**
 * Rights-matrix differential audit (B2C lane focus)
 *
 * Goal:
 * - Compare provider eligibility under three modes:
 *   1) enforce: full rights + country checks + capability + method
 *   2) ignore_country: rights active checks only (country arrays ignored) + capability + method
 *   3) ignore_all: capability + method only (rights ignored)
 *
 * Output:
 * - Writes JSON + Markdown ranked report to OUTPUT_DIR.
 *
 * Env:
 * - SEND_CURRENCIES=USD,AED,GBP,EUR (default: all macro send currencies)
 * - METHODS=bank,cash,wallet,airtime (default: all)
 * - AMOUNT=500 (default: 500) -> amount bucket used for quote-presence checks
 * - RIGHTS_CHANNEL=b2c|b2b (default: b2c)
 * - REQUIRE_STATUS_PRODUCTION=1 (optional)
 * - TOP_N=200 (default: 200)
 * - OUTPUT_DIR=/tmp/remit-scout-artifacts/rights-differential (default)
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import { computeBucketSelection } from '../shared/amount-bucket'
import { parseCorridorId } from '../shared/corridor'
import { resolveCorridorScope } from '../shared/corridor-scope'

initTracing('rights-matrix-differential')
initErrorTracking('rights-matrix-differential')

const logger = createLogger('script.rights-matrix-differential')

type RequestedMethod = 'bank' | 'cash' | 'wallet' | 'airtime'
type RightsChannel = 'b2c' | 'b2b'

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
  payin_methods: string[] | null
  payout_methods: string[] | null
  is_supported: boolean | null
  source: string | null
}

type CapabilityLoadResult = {
  byCorridor: Map<string, Map<string, CapabilityRow>>
  capabilityTableRowCount: number
}

type LatestQuoteRow = {
  provider_id: string
  corridor_id: string
  amount_bucket: number
  payin: string | null
  payout: string | null
  collected_at: string | null
}

type DifferentialRow = {
  corridorId: string
  sourceCountry: string
  destCountry: string
  sourceCurrency: string
  destCurrency: string
  method: RequestedMethod
  enforce: number
  ignoreCountry: number
  ignoreAll: number
  rightsGap: number
  rightsCountryGap: number
  rightsPolicyGap: number
  capabilityMissing: number
  capabilityUnsupported: number
  methodMismatch: number
  noQuotes: number
  enforceProviders: string[]
}

const splitCsv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const normalizeUpper = (value: string): string => value.trim().toUpperCase()
const normalizeLower = (value: string): string => value.trim().toLowerCase()

const normalizeToken = (value: string): string => {
  if (!value || typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

const toAvailableMethod = (value?: string | null): RequestedMethod | null => {
  if (!value) return null
  const token = normalizeToken(value)
  if (!token) return null
  if (token === 'airtime' || token.includes('airtime') || token.includes('topup') || token.includes('top_up')) {
    return 'airtime'
  }
  if (
    token === 'mobile_wallet'
    || token === 'mobile_money'
    || token === 'wallet'
    || token.includes('wallet')
    || token.includes('mobile_money')
  ) {
    return 'wallet'
  }
  if (token === 'cash_pickup' || token === 'cash' || token.includes('cash')) {
    return 'cash'
  }
  if (
    token === 'bank_deposit'
    || token === 'bank_transfer'
    || token === 'bank_account'
    || token === 'bank'
    || token === 'account'
    || token === 'card'
    || token === 'card_deposit'
    || token === 'debit_card'
    || token === 'credit_card'
    || token.includes('bank')
    || token.includes('account')
    || token.includes('card')
  ) {
    return 'bank'
  }
  return null
}

const parseMethods = (value: string | undefined): RequestedMethod[] => {
  const defaults: RequestedMethod[] = ['bank', 'cash', 'wallet', 'airtime']
  const raw = splitCsv(value).map((v) => normalizeLower(v))
  if (!raw.length) return defaults
  const parsed = raw
    .map((v): RequestedMethod | null => {
      if (v === 'bank') return 'bank'
      if (v === 'cash') return 'cash'
      if (v === 'wallet') return 'wallet'
      if (v === 'airtime') return 'airtime'
      return null
    })
    .filter((v): v is RequestedMethod => Boolean(v))
  return parsed.length ? Array.from(new Set(parsed)) : defaults
}

const ensureDir = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true })
}

const chunk = <T>(items: T[], size: number): T[][] => {
  if (!Number.isFinite(size) || size <= 0) return [items]
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const includesCountry = (list: string[] | null, code: string): boolean => {
  if (!list || !list.length) return false
  const upper = normalizeUpper(code)
  return list.some((c) => c && normalizeUpper(c) === upper)
}

const isRightsActive = (
  row: RightsRow | null | undefined,
  channel: RightsChannel,
  requireProduction: boolean,
): boolean => {
  if (!row) return false
  if (!row.allowed_collect) return false
  if (channel === 'b2c' && !row.allowed_b2c) return false
  if (channel === 'b2b' && !row.allowed_b2b) return false
  if ((row.stoplist_status || '').toLowerCase() !== 'active') return false
  if (requireProduction && (row.status || '').toLowerCase() !== 'production') return false
  return true
}

const capabilitySupportsMethod = (row: CapabilityRow, method: RequestedMethod): boolean => {
  const payin = (row.payin_methods || []).map((m) => toAvailableMethod(m)).filter((m): m is RequestedMethod => Boolean(m))
  const payoutSource = row.payout_methods && row.payout_methods.length ? row.payout_methods : ['bank_deposit']
  const payout = payoutSource.map((m) => toAvailableMethod(m)).filter((m): m is RequestedMethod => Boolean(m))
  return payin.includes(method) || payout.includes(method)
}

const quoteSupportsMethod = (row: LatestQuoteRow, method: RequestedMethod): boolean => {
  const payin = toAvailableMethod(row.payin)
  const payout = toAvailableMethod(row.payout)
  return payin === method || payout === method
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

const loadCapabilities = async (
  pool: ReturnType<typeof createPool>,
  corridorIds: string[],
): Promise<CapabilityLoadResult> => {
  const byCorridor = new Map<string, Map<string, CapabilityRow>>()
  let capabilityTableRowCount = 0
  if (!corridorIds.length) {
    return { byCorridor, capabilityTableRowCount }
  }

  for (const ids of chunk(corridorIds, 1000)) {
    const result = await query<CapabilityRow>(
      `SELECT provider_id,
              corridor_id,
              payin_methods,
              payout_methods,
              is_supported,
              source
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

const loadLatestQuotes = async (
  pool: ReturnType<typeof createPool>,
  corridorIds: string[],
  amountBucket: number,
): Promise<Map<string, Map<string, LatestQuoteRow[]>>> => {
  const byCorridor = new Map<string, Map<string, LatestQuoteRow[]>>()
  if (!corridorIds.length) return byCorridor

  for (const ids of chunk(corridorIds, 1000)) {
    const result = await query<LatestQuoteRow>(
      `SELECT provider_id,
              corridor_id,
              amount_bucket,
              payin,
              payout,
              collected_at
         FROM silver.latest_quote_by_provider
        WHERE corridor_id = ANY($1::text[])
          AND amount_bucket = $2`,
      [ids, amountBucket],
      pool,
    )
    for (const row of result.rows) {
      if (!row.corridor_id || !row.provider_id) continue
      if (!byCorridor.has(row.corridor_id)) byCorridor.set(row.corridor_id, new Map())
      const byProvider = byCorridor.get(row.corridor_id)!
      const list = byProvider.get(row.provider_id) ?? []
      list.push(row)
      byProvider.set(row.provider_id, list)
    }
  }

  return byCorridor
}

export const runRightsMatrixDifferential = async (): Promise<void> => {
  const runId = process.env.RUN_ID || null
  const methods = parseMethods(process.env.METHODS)
  const channel: RightsChannel = normalizeLower(process.env.RIGHTS_CHANNEL || 'b2c') === 'b2b' ? 'b2b' : 'b2c'
  const rightsScope = (process.env.RIGHTS_SCOPE || 'all').trim().toLowerCase()
  const requireProduction = process.env.REQUIRE_STATUS_PRODUCTION === '1'
  const strictDataHealth = process.env.STRICT_DATA_HEALTH === '1'
  const amount = Number(process.env.AMOUNT ?? '500')
  const amountBucket = computeBucketSelection(Number.isFinite(amount) && amount > 0 ? amount : 500).bucket_used
  const topN = Math.max(1, Number(process.env.TOP_N || '200'))

  const outputDir = process.env.OUTPUT_DIR
    ? path.resolve(process.env.OUTPUT_DIR)
    : path.join(os.tmpdir(), 'remit-scout-artifacts', 'rights-differential')
  ensureDir(outputDir)

  const pool = createPool(config.db.planeBUrl)
  try {
    const [rightsByProvider, scopeResult] = await Promise.all([
      loadRights(pool),
      resolveCorridorScope(pool, {
        scopeEnv: rightsScope,
        corridorIdsEnv: process.env.CORRIDOR_IDS,
        sendCurrenciesEnv: process.env.SEND_CURRENCIES,
        defaultSendCurrencies: ['USD', 'AED', 'GBP', 'EUR'],
        includeCapabilityTableCorridors: true,
      }),
    ])
    const corridors = scopeResult.corridorIds.map((corridorId) => {
      const parsed = parseCorridorId(corridorId)
      if (!parsed) {
        throw new Error(`Invalid corridor id in scope: ${corridorId}`)
      }
      return {
        corridorId,
        sourceCountry: parsed.sourceCountry,
        destCountry: parsed.destCountry,
        sourceCurrency: parsed.sourceCurrency,
        destCurrency: parsed.destCurrency,
      }
    })
    const corridorIds = corridors.map((corridor) => corridor.corridorId)
    const [capabilityLoad, quotesByCorridor] = await Promise.all([
      loadCapabilities(pool, corridorIds),
      loadLatestQuotes(pool, corridorIds, amountBucket),
    ])
    const capsByCorridor = capabilityLoad.byCorridor
    const capabilityTableRowCount = capabilityLoad.capabilityTableRowCount
    const activeRightsProviderIds = Array.from(rightsByProvider.entries())
      .filter(([, rights]) => isRightsActive(rights, channel, requireProduction))
      .map(([providerId]) => providerId)
    const activeB2cRightsRows = Array.from(rightsByProvider.values())
      .filter((rights) => isRightsActive(rights, 'b2c', requireProduction))
    const activeB2cRightsCount = activeB2cRightsRows.length
    const activeB2cRightsWithCountrySetsCount = activeB2cRightsRows.filter((rights) => (
      Array.isArray(rights.source_countries)
      && rights.source_countries.length > 0
      && Array.isArray(rights.destination_countries)
      && rights.destination_countries.length > 0
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

    const rows: DifferentialRow[] = []

    for (const corridor of corridors) {
      const capMap = capsByCorridor.get(corridor.corridorId) ?? new Map<string, CapabilityRow>()
      const quoteMap = quotesByCorridor.get(corridor.corridorId) ?? new Map<string, LatestQuoteRow[]>()

      for (const method of methods) {
        const rightsCountryEligible = new Set<string>()
        const rightsIgnoreCountryEligible = new Set<string>()
        const capabilityMissingProviders = new Set<string>()
        const capabilityUnsupportedProviders = new Set<string>()
        const methodMismatchProviders = new Set<string>()

        const providerUniverse = new Set<string>([
          ...activeRightsProviderIds,
          ...capMap.keys(),
        ])

        const enforceCandidates = new Set<string>()
        const ignoreCountryCandidates = new Set<string>()
        const ignoreAllCandidates = new Set<string>()

        for (const providerId of activeRightsProviderIds) {
          const rights = rightsByProvider.get(providerId)
          if (!rights) continue
          rightsIgnoreCountryEligible.add(providerId)
          const inCountry =
            includesCountry(rights.source_countries, corridor.sourceCountry)
            && includesCountry(rights.destination_countries, corridor.destCountry)
          if (inCountry) rightsCountryEligible.add(providerId)
        }

        for (const providerId of providerUniverse) {
          const cap = capMap.get(providerId) ?? null
          if (!cap) {
            if (rightsCountryEligible.has(providerId)) capabilityMissingProviders.add(providerId)
            continue
          }

          if (!cap.is_supported) {
            if (rightsCountryEligible.has(providerId)) capabilityUnsupportedProviders.add(providerId)
            continue
          }
          const supportsMethod = capabilitySupportsMethod(cap, method)
          if (!supportsMethod) {
            if (rightsCountryEligible.has(providerId)) methodMismatchProviders.add(providerId)
            continue
          }

          ignoreAllCandidates.add(providerId)
          if (rightsIgnoreCountryEligible.has(providerId)) {
            ignoreCountryCandidates.add(providerId)
          }
          if (rightsCountryEligible.has(providerId)) {
            enforceCandidates.add(providerId)
          }
        }

        let noQuotes = 0
        for (const providerId of enforceCandidates) {
          const providerQuotes = quoteMap.get(providerId) ?? []
          const hasQuote = providerQuotes.some((q) => quoteSupportsMethod(q, method))
          if (!hasQuote) noQuotes += 1
        }

        const enforce = enforceCandidates.size
        const ignoreCountry = ignoreCountryCandidates.size
        const ignoreAll = ignoreAllCandidates.size
        const rightsCountryGap = Math.max(0, ignoreCountry - enforce)
        const rightsPolicyGap = Math.max(0, ignoreAll - ignoreCountry)
        const rightsGap = Math.max(0, ignoreAll - enforce)

        rows.push({
          corridorId: corridor.corridorId,
          sourceCountry: corridor.sourceCountry,
          destCountry: corridor.destCountry,
          sourceCurrency: corridor.sourceCurrency,
          destCurrency: corridor.destCurrency,
          method,
          enforce,
          ignoreCountry,
          ignoreAll,
          rightsGap,
          rightsCountryGap,
          rightsPolicyGap,
          capabilityMissing: capabilityMissingProviders.size,
          capabilityUnsupported: capabilityUnsupportedProviders.size,
          methodMismatch: methodMismatchProviders.size,
          noQuotes,
          enforceProviders: Array.from(enforceCandidates).sort(),
        })
      }
    }

    rows.sort((a, b) => {
      if (b.rightsGap !== a.rightsGap) return b.rightsGap - a.rightsGap
      if (b.noQuotes !== a.noQuotes) return b.noQuotes - a.noQuotes
      if (b.capabilityMissing !== a.capabilityMissing) return b.capabilityMissing - a.capabilityMissing
      if (b.capabilityUnsupported !== a.capabilityUnsupported) return b.capabilityUnsupported - a.capabilityUnsupported
      if (b.methodMismatch !== a.methodMismatch) return b.methodMismatch - a.methodMismatch
      return a.corridorId.localeCompare(b.corridorId)
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseName = `rights-differential-${config.env}-${timestamp}`
    const jsonPath = path.join(outputDir, `${baseName}.json`)
    const mdPath = path.join(outputDir, `${baseName}.md`)

    const report = {
      runId,
      env: config.env,
      generatedAt: new Date().toISOString(),
      rightsChannel: channel,
      scope: scopeResult.scope,
      requireStatusProduction: requireProduction,
      amount,
      amountBucket,
      corridorIdsFilter: scopeResult.corridorIdsFilter,
      sendCurrencies: scopeResult.sendCurrencies,
      corridorCount: scopeResult.corridorCount,
      providerCatalogCorridorCount: scopeResult.providerCatalogCorridorCount,
      capabilityCorridorCount: scopeResult.capabilityCorridorCount,
      methods,
      scopedCorridors: corridors.length,
      rows: rows.length,
      capabilityTableRowCount,
      activeB2cRightsCount,
      activeB2cRightsWithCountrySetsCount,
      dataHealthStatus,
      topN,
      top: rows.slice(0, topN),
      totals: {
        withRightsGap: rows.filter((r) => r.rightsGap > 0).length,
        withNoQuotes: rows.filter((r) => r.noQuotes > 0).length,
        withCapabilityMissing: rows.filter((r) => r.capabilityMissing > 0).length,
        withCapabilityUnsupported: rows.filter((r) => r.capabilityUnsupported > 0).length,
        withMethodMismatch: rows.filter((r) => r.methodMismatch > 0).length,
      },
    }
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8')

    const lines: string[] = []
    lines.push('# Rights Matrix Differential')
    lines.push('')
    lines.push(`- Environment: ${config.env}`)
    lines.push(`- Rights channel: ${channel}`)
    lines.push(`- Scope: ${scopeResult.scope}`)
    lines.push(`- Require production status: ${requireProduction ? 'yes' : 'no'}`)
    lines.push(`- Amount: ${amount}`)
    lines.push(`- Amount bucket used: ${amountBucket}`)
    lines.push(`- Corridors scanned: ${corridors.length}`)
    lines.push(`- Scope corridor count: ${scopeResult.corridorCount}`)
    lines.push(`- Scope send currencies: ${scopeResult.sendCurrencies ? scopeResult.sendCurrencies.join(', ') : '(none)'}`)
    lines.push(`- Provider catalog corridors: ${scopeResult.providerCatalogCorridorCount}`)
    lines.push(`- Capability table corridors: ${scopeResult.capabilityCorridorCount}`)
    lines.push(`- Methods: ${methods.join(', ')}`)
    lines.push(`- Rows scanned: ${rows.length}`)
    lines.push(`- Capability table rows (scope): ${capabilityTableRowCount}`)
    lines.push(`- Active B2C rights rows: ${activeB2cRightsCount}`)
    lines.push(`- Active B2C rights rows with country sets: ${activeB2cRightsWithCountrySetsCount}`)
    lines.push(`- Data health: ${dataHealthStatus}`)
    lines.push('')
    lines.push('## Totals')
    lines.push('')
    lines.push(`- Rows with rights gap: ${report.totals.withRightsGap}`)
    lines.push(`- Rows with no quotes: ${report.totals.withNoQuotes}`)
    lines.push(`- Rows with capability missing: ${report.totals.withCapabilityMissing}`)
    lines.push(`- Rows with capability unsupported: ${report.totals.withCapabilityUnsupported}`)
    lines.push(`- Rows with method mismatch: ${report.totals.withMethodMismatch}`)
    lines.push('')
    lines.push(`## Top ${topN} gaps`)
    lines.push('')
    lines.push('| corridor | method | enforce | ignore_country | ignore_all | rights_gap | rights_country_gap | rights_policy_gap | capability_missing | capability_unsupported | method_mismatch | no_quotes |')
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
    for (const row of rows.slice(0, topN)) {
      lines.push(
        `| ${row.corridorId} | ${row.method} | ${row.enforce} | ${row.ignoreCountry} | ${row.ignoreAll} | ${row.rightsGap} | ${row.rightsCountryGap} | ${row.rightsPolicyGap} | ${row.capabilityMissing} | ${row.capabilityUnsupported} | ${row.methodMismatch} | ${row.noQuotes} |`,
      )
    }
    fs.writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')

    logger.info('rights_matrix_differential_complete', {
      run_id: runId,
      output_dir: outputDir,
      json: jsonPath,
      markdown: mdPath,
      rights_channel: channel,
      scope: scopeResult.scope,
      require_production: requireProduction,
      amount,
      amount_bucket: amountBucket,
      corridor_count: scopeResult.corridorCount,
      provider_catalog_corridor_count: scopeResult.providerCatalogCorridorCount,
      capability_corridor_count: scopeResult.capabilityCorridorCount,
      capability_table_row_count: capabilityTableRowCount,
      active_b2c_rights_count: activeB2cRightsCount,
      active_b2c_rights_with_country_sets_count: activeB2cRightsWithCountrySetsCount,
      data_health_status: dataHealthStatus,
      methods,
      scoped_corridors: corridors.length,
      rows: rows.length,
      totals: report.totals,
    })
    if (dataHealthStatus === 'degraded') {
      logger.warn('rights_matrix_differential_data_health_degraded', {
        capability_table_row_count: capabilityTableRowCount,
        active_b2c_rights_count: activeB2cRightsCount,
        active_b2c_rights_with_country_sets_count: activeB2cRightsWithCountrySetsCount,
      })
    }
    if (strictDataHealth && strictDataHealthFailures.length > 0) {
      throw new Error(`strict_data_health_failed: ${strictDataHealthFailures.join(',')}`)
    }
  } finally {
    await pool.end().catch(() => {})
  }
}

if (require.main === module) {
  runRightsMatrixDifferential().catch((error) => {
    logger.error('rights_matrix_differential_failed', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    })
    process.exit(1)
  })
}
