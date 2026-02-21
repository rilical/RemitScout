/**
 * Provider capability seed
 *
 * Purpose:
 * - Deterministically backfill `silver.provider_corridor_capability` from provider registry
 *   supported corridors.
 * - Useful when dev/staging capability table is sparse/empty and diagnostics cannot
 *   distinguish rights-vs-capability gaps.
 *
 * Safety:
 * - Does not overwrite fresh `source='probe'` rows.
 * - Uses upsert for idempotent reruns.
 *
 * Env:
 * - CAPABILITY_SEED_SCOPE=all|macro (default: all)
 * - CAPABILITY_SEED_SEND_CURRENCIES=USD,AED,GBP,EUR (macro scope only)
 * - CAPABILITY_SEED_PROVIDERS=wise,remitly (optional)
 * - CAPABILITY_SEED_PAYOUT_METHODS=bank_deposit (default)
 * - CAPABILITY_SEED_SOURCE=catalog_global_seed|catalog_macro_seed (default depends on scope)
 * - CAPABILITY_SEED_SKIP_RECENT_HOURS=24 (default)
 * - CAPABILITY_SEED_BATCH_SIZE=2000 (default)
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import { resolveCorridorScope, type RightsScopeMode } from '../shared/corridor-scope'
import { providerRegistry } from '../plane-b/src/providers'

initTracing('provider-capability-macro-seed')
initErrorTracking('provider-capability-macro-seed')

const logger = createLogger('script.provider-capability-macro-seed')

const splitList = (value: string | undefined): string[] => (
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
)

const normalizeUpper = (value: string): string => value.trim().toUpperCase()
const normalizeLower = (value: string): string => value.trim().toLowerCase()

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

type SeedCandidate = {
  providerId: string
  corridorId: string
}

const chunk = <T>(items: T[], size: number): T[][] => {
  if (!Number.isFinite(size) || size <= 0) return [items]
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

type ExistingCapabilityRow = {
  provider_id: string
  corridor_id: string
  source: string | null
  last_verified_at: string | null
}

const shouldSkipExistingProbe = (
  existing: ExistingCapabilityRow,
  nowMs: number,
  recentHours: number,
): boolean => {
  if ((existing.source || '').toLowerCase() !== 'probe') return false
  const lastVerifiedAtMs = existing.last_verified_at
    ? new Date(existing.last_verified_at).getTime()
    : NaN
  if (!Number.isFinite(lastVerifiedAtMs)) return false
  const ageMs = Math.max(0, nowMs - lastVerifiedAtMs)
  return ageMs < recentHours * 60 * 60 * 1000
}

const parseScope = (value: string | undefined): RightsScopeMode => {
  const normalized = (value || '').trim().toLowerCase()
  if (!normalized || normalized === 'all') return 'all'
  if (normalized === 'macro') return 'macro'
  throw new Error(`Invalid CAPABILITY_SEED_SCOPE: ${value}`)
}

const loadExistingRows = async (
  pool: ReturnType<typeof createPool>,
  providerIds: string[],
  corridorIds: string[],
): Promise<Map<string, ExistingCapabilityRow>> => {
  const byKey = new Map<string, ExistingCapabilityRow>()
  if (!providerIds.length || !corridorIds.length) return byKey

  for (const corridorChunk of chunk(corridorIds, 1000)) {
    const result = await query<ExistingCapabilityRow>(
      `SELECT provider_id, corridor_id, source, last_verified_at
         FROM silver.provider_corridor_capability
        WHERE provider_id = ANY($1::text[])
          AND corridor_id = ANY($2::text[])`,
      [providerIds, corridorChunk],
      pool,
    )
    for (const row of result.rows) {
      if (!row.provider_id || !row.corridor_id) continue
      byKey.set(`${row.provider_id}:${row.corridor_id}`, row)
    }
  }

  return byKey
}

const upsertCapabilityBatch = async (
  pool: ReturnType<typeof createPool>,
  rows: SeedCandidate[],
  payoutMethods: string[],
  source: string,
) => {
  if (rows.length === 0) return
  await query(
    `WITH batch AS (
       SELECT *
       FROM UNNEST($1::text[], $2::text[]) AS t(provider_id, corridor_id)
     )
     INSERT INTO silver.provider_corridor_capability
       (provider_id, corridor_id, payin_methods, payout_methods, is_supported, source, last_verified_at)
     SELECT b.provider_id, b.corridor_id, NULL, $3::text[], true, $4, NOW()
     FROM batch b
     ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
       payin_methods = EXCLUDED.payin_methods,
       payout_methods = EXCLUDED.payout_methods,
       is_supported = EXCLUDED.is_supported,
       source = EXCLUDED.source,
       last_verified_at = EXCLUDED.last_verified_at,
       updated_at = NOW()`,
    [
      rows.map((row) => row.providerId),
      rows.map((row) => row.corridorId),
      payoutMethods,
      source,
    ],
    pool,
  )
}

export const runProviderCapabilityMacroSeed = async (): Promise<void> => {
  const scope = parseScope(process.env.CAPABILITY_SEED_SCOPE)
  const providerFilter = new Set(
    splitList(process.env.CAPABILITY_SEED_PROVIDERS).map(normalizeLower),
  )
  const payoutMethodsRaw = splitList(process.env.CAPABILITY_SEED_PAYOUT_METHODS).map(normalizeLower)
  const payoutMethods = payoutMethodsRaw.length > 0 ? payoutMethodsRaw : ['bank_deposit']
  const source = (
    process.env.CAPABILITY_SEED_SOURCE
    || (scope === 'macro' ? 'catalog_macro_seed' : 'catalog_global_seed')
  ).trim()
  const recentHours = Math.max(0, toNumber(process.env.CAPABILITY_SEED_SKIP_RECENT_HOURS, 24))
  const batchSize = Math.max(1, toNumber(process.env.CAPABILITY_SEED_BATCH_SIZE, 2000))

  const selectedProviders = providerRegistry.filter((provider) => (
    providerFilter.size === 0 || providerFilter.has(normalizeLower(provider.providerId))
  ))

  const pool = createPool(config.db.planeBUrl)
  try {
    const scopeResult = await resolveCorridorScope(pool, {
      scopeEnv: scope,
      sendCurrenciesEnv: process.env.CAPABILITY_SEED_SEND_CURRENCIES,
      defaultSendCurrencies: ['USD', 'AED', 'GBP', 'EUR'],
      includeCapabilityTableCorridors: true,
    })
    const scopeCorridors = new Set(scopeResult.corridorIds.map(normalizeUpper))
    const providerIds = selectedProviders.map((provider) => provider.providerId)
    const candidatePairs: SeedCandidate[] = []
    const corridorUniverse = new Set<string>()
    for (const provider of selectedProviders) {
      for (const corridorId of provider.supportedCorridors || []) {
        const normalizedCorridor = normalizeUpper(corridorId)
        if (!scopeCorridors.has(normalizedCorridor)) continue
        corridorUniverse.add(normalizedCorridor)
        candidatePairs.push({
          providerId: provider.providerId,
          corridorId: normalizedCorridor,
        })
      }
    }

    const existingByKey = await loadExistingRows(
      pool,
      providerIds,
      Array.from(corridorUniverse.values()),
    )

    let considered = 0
    let inserted = 0
    let updated = 0
    let skippedFreshProbe = 0
    const nowMs = Date.now()
    const pendingRows: SeedCandidate[] = []

    for (const candidate of candidatePairs) {
      considered += 1
      const key = `${candidate.providerId}:${candidate.corridorId}`
      const existing = existingByKey.get(key)
      if (existing && shouldSkipExistingProbe(existing, nowMs, recentHours)) {
        skippedFreshProbe += 1
        continue
      }

      if (existing) {
        updated += 1
      } else {
        inserted += 1
      }

      pendingRows.push(candidate)
      if (pendingRows.length >= batchSize) {
        await upsertCapabilityBatch(pool, pendingRows, payoutMethods, source)
        pendingRows.length = 0
      }
    }
    if (pendingRows.length > 0) {
      await upsertCapabilityBatch(pool, pendingRows, payoutMethods, source)
    }

    logger.info('provider_capability_macro_seed_complete', {
      environment: config.env,
      scope: scopeResult.scope,
      send_currencies: scopeResult.sendCurrencies,
      providers: providerIds.length,
      unique_corridors: corridorUniverse.size,
      scope_corridors: scopeResult.corridorCount,
      provider_catalog_corridors: scopeResult.providerCatalogCorridorCount,
      capability_table_corridors: scopeResult.capabilityCorridorCount,
      payout_methods: payoutMethods,
      source,
      recent_skip_hours: recentHours,
      batch_size: batchSize,
      considered,
      inserted,
      updated,
      skipped_fresh_probe: skippedFreshProbe,
    })
  } finally {
    await pool.end().catch(() => {})
  }
}

if (require.main === module) {
  runProviderCapabilityMacroSeed().catch((error) => {
    logger.error('provider_capability_macro_seed_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
