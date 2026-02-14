/**
 * Provider capability canary seed (dev-only utility)
 *
 * Problem:
 * - The B2B sweep scheduler builds lane/provider tasks from `silver.provider_corridor_capability`.
 * - In a fresh dev DB (or after resets), capability coverage can be sparse, causing the scheduler
 *   to log `scheduler_no_tasks` and enqueue nothing.
 *
 * This script seeds "catalog-derived" capability rows for a fixed corridor allowlist so the
 * Tier-2 canary sweep becomes deterministic without running full probe passes.
 *
 * Safety rules:
 * - Never overwrite existing `source='probe'` rows.
 * - Never overwrite a row that was recently verified.
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { providerRegistry } from '../plane-b/src/providers'
import { initErrorTracking } from '../shared/error-tracker'

initTracing('provider-capability-canary-seed')
initErrorTracking('provider-capability-canary-seed')

const logger = createLogger('script.provider-capability-canary-seed')

const DEFAULT_CANARY_CORRIDORS = [
  'GB-NG-GBP-NGN',
  'GB-IN-GBP-INR',
  'AE-IN-AED-INR',
  'AE-PK-AED-PKR',
  'DE-TR-EUR-TRY',
  'FR-MA-EUR-MAD',
  'IT-PH-EUR-PHP',
  'ES-CO-EUR-COP',
  'CA-PH-CAD-PHP',
  'JP-PH-JPY-PHP',
  // Major-currency + high-signal canaries (helps debug “provider missing” incidents).
  'US-JO-USD-JOD',
  'AE-JO-AED-JOD',
  'GB-JO-GBP-JOD',
  'DE-JO-EUR-JOD',
]

const splitList = (value: string | undefined): string[] => {
  return (value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

type ExistingCapabilityRow = {
  provider_id: string
  corridor_id: string
  source: string | null
  last_verified_at: string | null
}

const loadExistingRows = async (
  pool: ReturnType<typeof createPool>,
  providerIds: string[],
  corridorIds: string[],
) => {
  if (providerIds.length === 0 || corridorIds.length === 0) {
    return new Map<string, ExistingCapabilityRow>()
  }
  const result = await query<ExistingCapabilityRow>(
    `SELECT provider_id, corridor_id, source, last_verified_at
       FROM silver.provider_corridor_capability
      WHERE provider_id = ANY($1::text[])
        AND corridor_id = ANY($2::text[])`,
    [providerIds, corridorIds],
    pool,
  )
  const map = new Map<string, ExistingCapabilityRow>()
  for (const row of result.rows) {
    if (!row.provider_id || !row.corridor_id) continue
    map.set(`${row.provider_id}:${row.corridor_id}`, row)
  }
  return map
}

const shouldSkipExisting = (existing: ExistingCapabilityRow, nowMs: number, recentHours: number): boolean => {
  const source = (existing.source || '').toLowerCase()
  if (source === 'probe') return true
  const lastVerifiedAtMs = existing.last_verified_at ? new Date(existing.last_verified_at).getTime() : NaN
  if (Number.isFinite(lastVerifiedAtMs)) {
    const ageMs = Math.max(0, nowMs - lastVerifiedAtMs)
    if (ageMs < recentHours * 60 * 60 * 1000) return true
  }
  return false
}

export const runProviderCapabilityCanarySeed = async (): Promise<void> => {
  const corridors = (splitList(process.env.CAPABILITY_SEED_CORRIDORS) || [])
    .map(v => v.toUpperCase())
    .filter(Boolean)
  const resolvedCorridors = corridors.length ? corridors : DEFAULT_CANARY_CORRIDORS

  const providers = splitList(process.env.CAPABILITY_SEED_PROVIDERS)
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
  const resolvedProviders = providers.length
    ? providers
    : providerRegistry.map(p => p.providerId)

  const payoutMethods = splitList(process.env.CAPABILITY_SEED_PAYOUT_METHODS)
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
  const resolvedPayoutMethods = payoutMethods.length ? payoutMethods : ['bank_deposit']

  const source = (process.env.CAPABILITY_SEED_SOURCE || 'catalog_seed').trim()
  const recentHours = Math.max(0, toNumber(process.env.CAPABILITY_SEED_SKIP_RECENT_HOURS, 24))

  const pool = createPool(config.db.planeBUrl)
  try {
    const existingByKey = await loadExistingRows(pool, resolvedProviders, resolvedCorridors)
    const providerById = new Map(providerRegistry.map(p => [p.providerId, p]))
    const nowMs = Date.now()

    let considered = 0
    let inserted = 0
    let skipped = 0
    let unsupported = 0

    for (const providerId of resolvedProviders) {
      const provider = providerById.get(providerId)
      if (!provider) {
        logger.warn('capability_seed_skip_provider', { provider_id: providerId, reason: 'not_in_registry' })
        continue
      }
      const supportedSet = provider.supportedCorridors?.length
        ? new Set(provider.supportedCorridors.map(c => c.toUpperCase()))
        : null

      for (const corridorId of resolvedCorridors) {
        considered += 1

        if (supportedSet && !supportedSet.has(corridorId.toUpperCase())) {
          unsupported += 1
          continue
        }

        const key = `${providerId}:${corridorId}`
        const existing = existingByKey.get(key)
        if (existing && shouldSkipExisting(existing, nowMs, recentHours)) {
          skipped += 1
          continue
        }

        await query(
          `INSERT INTO silver.provider_corridor_capability
           (provider_id, corridor_id, payin_methods, payout_methods, is_supported, source, last_verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
             payin_methods = EXCLUDED.payin_methods,
             payout_methods = EXCLUDED.payout_methods,
             is_supported = EXCLUDED.is_supported,
             source = EXCLUDED.source,
             last_verified_at = EXCLUDED.last_verified_at,
             updated_at = NOW()`,
          [providerId, corridorId, null, resolvedPayoutMethods, true, source],
          pool,
        )
        inserted += 1
      }
    }

    logger.info('capability_seed_complete', {
      corridors: resolvedCorridors.length,
      providers: resolvedProviders.length,
      payout_methods: resolvedPayoutMethods,
      source,
      considered,
      inserted,
      skipped,
      unsupported,
      recent_skip_hours: recentHours,
    })
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runProviderCapabilityCanarySeed().catch((error) => {
    logger.error('capability_seed_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
