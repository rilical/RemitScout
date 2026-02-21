/**
 * Rights matrix capability delta
 *
 * Builds an evidence-driven proposal to widen source/destination country arrays
 * in silver.rights_matrix only where provider_corridor_capability is_supported=true.
 *
 * Defaults:
 * - CHANNEL=b2c
 * - RIGHTS_SCOPE=all
 * - TOP_N=100
 * - APPLY=0 (dry-run; no DB writes)
 *
 * Optional:
 * - RIGHTS_SCOPE=macro + SEND_CURRENCIES=USD,AED,GBP,EUR
 * - RIGHTS_SCOPE=ids + CORRIDOR_IDS=US-AR-USD-ARS,US-AL-USD-ALL
 * - CORRIDOR_IDS=US-AR-USD-ARS,US-AL-USD-ALL
 * - APPLY=1 APPLY_PROVIDERS=wise,remitly
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import { parseCorridorId } from '../shared/corridor'
import { resolveCorridorScope } from '../shared/corridor-scope'

initTracing('rights-matrix-capability-delta')
initErrorTracking('rights-matrix-capability-delta')

const logger = createLogger('script.rights-matrix-capability-delta')

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
  is_supported: boolean | null
}

type ProviderDelta = {
  providerId: string
  existingSourceCountries: string[]
  existingDestinationCountries: string[]
  missingSourceCountries: string[]
  missingDestinationCountries: string[]
  proposedSourceCountries: string[]
  proposedDestinationCountries: string[]
  impactedCorridors: string[]
  impactedCorridorCount: number
}

const splitCsv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const normalizeUpper = (value: string): string => value.trim().toUpperCase()
const normalizeLower = (value: string): string => value.trim().toLowerCase()

const ensureDir = (dir: string): void => {
  fs.mkdirSync(dir, { recursive: true })
}

const chunk = <T>(items: T[], size: number): T[][] => {
  if (!Number.isFinite(size) || size <= 0) return [items]
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const includesCountry = (list: string[] | null, country: string): boolean => {
  if (!list || !list.length) return false
  const needle = normalizeUpper(country)
  return list.some((value) => normalizeUpper(value) === needle)
}

const sortedUnique = (values: Iterable<string>): string[] =>
  Array.from(new Set(Array.from(values).map(normalizeUpper).filter(Boolean))).sort()

const isRightsActive = (row: RightsRow, channel: RightsChannel): boolean => {
  if (!row.allowed_collect) return false
  if (channel === 'b2c' && !row.allowed_b2c) return false
  if (channel === 'b2b' && !row.allowed_b2b) return false
  return (row.stoplist_status || '').toLowerCase() === 'active'
}

export const runRightsMatrixCapabilityDelta = async (): Promise<void> => {
  const channel: RightsChannel = normalizeLower(process.env.CHANNEL || 'b2c') === 'b2b' ? 'b2b' : 'b2c'
  const rightsScope = (process.env.RIGHTS_SCOPE || 'all').trim().toLowerCase()
  const topN = Math.max(1, Number(process.env.TOP_N || '100'))
  const apply = process.env.APPLY === '1'
  const applyProviders = new Set(splitCsv(process.env.APPLY_PROVIDERS).map(normalizeLower))
  const outputDir = process.env.OUTPUT_DIR
    ? path.resolve(process.env.OUTPUT_DIR)
    : path.join(os.tmpdir(), 'remit-scout-artifacts', 'rights-delta')
  ensureDir(outputDir)

  const pool = createPool(config.db.planeBUrl)
  try {
    const rightsResult = await query<RightsRow>(
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
    const rightsByProvider = new Map(
      rightsResult.rows
        .filter((row) => row.provider_id && isRightsActive(row, channel))
        .map((row) => [normalizeLower(row.provider_id), row]),
    )

    const scopeResult = await resolveCorridorScope(pool, {
      scopeEnv: rightsScope,
      corridorIdsEnv: process.env.CORRIDOR_IDS,
      sendCurrenciesEnv: process.env.SEND_CURRENCIES,
      defaultSendCurrencies: ['USD', 'AED', 'GBP', 'EUR'],
      includeCapabilityTableCorridors: true,
    })

    const capabilityRows: CapabilityRow[] = []
    for (const corridorChunk of chunk(scopeResult.corridorIds, 1000)) {
      if (corridorChunk.length === 0) continue
      const result = await query<CapabilityRow>(
        `SELECT provider_id, corridor_id, is_supported
         FROM silver.provider_corridor_capability
         WHERE is_supported = true
           AND corridor_id = ANY($1::text[])`,
        [corridorChunk],
        pool,
      )
      capabilityRows.push(...result.rows)
    }

    const deltaByProvider = new Map<string, {
      missingSources: Set<string>
      missingDestinations: Set<string>
      impactedCorridors: Set<string>
    }>()

    for (const row of capabilityRows) {
      const providerId = normalizeLower(row.provider_id)
      const rights = rightsByProvider.get(providerId)
      if (!rights) continue

      const corridor = parseCorridorId(normalizeUpper(row.corridor_id))
      if (!corridor) continue

      const missingSource = !includesCountry(rights.source_countries, corridor.sourceCountry)
      const missingDestination = !includesCountry(rights.destination_countries, corridor.destCountry)
      if (!missingSource && !missingDestination) continue

      const bucket = deltaByProvider.get(providerId) ?? {
        missingSources: new Set<string>(),
        missingDestinations: new Set<string>(),
        impactedCorridors: new Set<string>(),
      }

      if (missingSource) bucket.missingSources.add(corridor.sourceCountry)
      if (missingDestination) bucket.missingDestinations.add(corridor.destCountry)
      bucket.impactedCorridors.add(normalizeUpper(row.corridor_id))
      deltaByProvider.set(providerId, bucket)
    }

    const deltas: ProviderDelta[] = Array.from(deltaByProvider.entries()).map(([providerId, delta]) => {
      const rights = rightsByProvider.get(providerId)!
      const existingSourceCountries = sortedUnique(rights.source_countries ?? [])
      const existingDestinationCountries = sortedUnique(rights.destination_countries ?? [])
      const missingSourceCountries = sortedUnique(delta.missingSources)
      const missingDestinationCountries = sortedUnique(delta.missingDestinations)
      const proposedSourceCountries = sortedUnique([...existingSourceCountries, ...missingSourceCountries])
      const proposedDestinationCountries = sortedUnique([...existingDestinationCountries, ...missingDestinationCountries])
      const impactedCorridors = sortedUnique(delta.impactedCorridors)

      return {
        providerId,
        existingSourceCountries,
        existingDestinationCountries,
        missingSourceCountries,
        missingDestinationCountries,
        proposedSourceCountries,
        proposedDestinationCountries,
        impactedCorridors,
        impactedCorridorCount: impactedCorridors.length,
      }
    })

    deltas.sort((a, b) => {
      if (b.impactedCorridorCount !== a.impactedCorridorCount) return b.impactedCorridorCount - a.impactedCorridorCount
      return a.providerId.localeCompare(b.providerId)
    })

    const selectedForApply = deltas.filter((delta) => (
      applyProviders.size === 0 || applyProviders.has(normalizeLower(delta.providerId))
    ))
    const appliedSnapshots = selectedForApply.map((delta) => ({
      providerId: delta.providerId,
      before: {
        sourceCountries: delta.existingSourceCountries,
        destinationCountries: delta.existingDestinationCountries,
      },
      after: {
        sourceCountries: delta.proposedSourceCountries,
        destinationCountries: delta.proposedDestinationCountries,
      },
      impactedCorridors: delta.impactedCorridors,
      impactedCorridorCount: delta.impactedCorridorCount,
    }))

    let applied = 0
    if (apply) {
      for (const delta of selectedForApply) {
        await query(
          `UPDATE silver.rights_matrix
           SET source_countries = $2::text[],
               destination_countries = $3::text[],
               updated_at = NOW()
           WHERE provider_id = $1`,
          [delta.providerId, delta.proposedSourceCountries, delta.proposedDestinationCountries],
          pool,
        )
        applied += 1
      }
    }

    const generatedAt = new Date().toISOString()
    const timestamp = generatedAt.replace(/[:.]/g, '-')
    const baseName = `rights-delta-${config.env}-${timestamp}`
    const jsonPath = path.join(outputDir, `${baseName}.json`)
    const mdPath = path.join(outputDir, `${baseName}.md`)

    const report = {
      generatedAt,
      environment: config.env,
      channel,
      scope: scopeResult.scope,
      filters: {
        corridorIds: scopeResult.corridorIdsFilter,
        sendCurrencies: scopeResult.sendCurrencies,
        corridorCount: scopeResult.corridorCount,
        providerCatalogCorridorCount: scopeResult.providerCatalogCorridorCount,
        capabilityCorridorCount: scopeResult.capabilityCorridorCount,
      },
      capabilityRowsEvaluated: capabilityRows.length,
      totalProvidersWithDelta: deltas.length,
      topN,
      applyRequested: apply,
      applyProviders: applyProviders.size ? Array.from(applyProviders.values()) : null,
      appliedProviders: applied,
      appliedSnapshots: apply ? appliedSnapshots : null,
      top: deltas.slice(0, topN),
    }
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8')

    const lines: string[] = []
    lines.push('# Rights Matrix Capability Delta')
    lines.push('')
    lines.push(`- Environment: ${config.env}`)
    lines.push(`- Channel: ${channel}`)
    lines.push(`- Scope: ${scopeResult.scope}`)
    lines.push(`- Scope corridor count: ${scopeResult.corridorCount}`)
    lines.push(`- Scope corridor ids filter: ${scopeResult.corridorIdsFilter ? scopeResult.corridorIdsFilter.join(', ') : '(none)'}`)
    lines.push(`- Scope send currencies: ${scopeResult.sendCurrencies ? scopeResult.sendCurrencies.join(', ') : '(none)'}`)
    lines.push(`- Provider catalog corridors: ${scopeResult.providerCatalogCorridorCount}`)
    lines.push(`- Capability table corridors: ${scopeResult.capabilityCorridorCount}`)
    lines.push(`- Capability rows evaluated: ${capabilityRows.length}`)
    lines.push(`- Providers with proposed deltas: ${deltas.length}`)
    lines.push(`- Apply requested: ${apply ? 'yes' : 'no'}`)
    lines.push(`- Applied providers: ${applied}`)
    lines.push('')
    lines.push(`## Top ${topN} providers by impact`)
    lines.push('')
    lines.push('| provider | impacted_corridors | missing_source_countries | missing_destination_countries |')
    lines.push('|---|---:|---|---|')
    for (const delta of deltas.slice(0, topN)) {
      lines.push(
        `| ${delta.providerId} | ${delta.impactedCorridorCount} | ${delta.missingSourceCountries.join(',')} | ${delta.missingDestinationCountries.join(',')} |`,
      )
    }
    fs.writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')

    logger.info('rights_matrix_capability_delta_complete', {
      environment: config.env,
      channel,
      total_providers_with_delta: deltas.length,
      applied_providers: applied,
      output_dir: outputDir,
      json: jsonPath,
      markdown: mdPath,
    })
  } finally {
    await pool.end().catch(() => {})
  }
}

if (require.main === module) {
  runRightsMatrixCapabilityDelta().catch((error) => {
    logger.error('rights_matrix_capability_delta_failed', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    })
    process.exit(1)
  })
}
