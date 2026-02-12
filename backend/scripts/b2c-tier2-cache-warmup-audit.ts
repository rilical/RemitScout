/**
 * B2C Tier-2 Cache Warmup Audit
 *
 * Usage:
 *   pnpm -C backend b2c:tier2-warmup:audit
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { normalizeProviderId } from '../shared/provider-utils'
import { createShutdownHandler } from '../shared/shutdown'

const logger = createLogger('script.b2c-tier2-warmup-audit')

const normalizeToken = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const allowedPayoutMethods = new Set([
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
  'airtime',
])

const loadTier2Corridors = async (pool: ReturnType<typeof createPool>): Promise<string[]> => {
  const result = await query<{ corridor_id: string }>(
    `SELECT corridor_id
       FROM silver.corridor_priority
      WHERE priority_tier = 'tier_2_reference'
        AND corridor_id IS NOT NULL
      ORDER BY corridor_id`,
    [],
    pool,
  )
  return result.rows.map(row => row.corridor_id).filter(Boolean)
}

const loadCapabilityRows = async (
  pool: ReturnType<typeof createPool>,
  corridorIds: string[],
) => {
  if (!corridorIds.length) return []
  const result = await query<{
    corridor_id: string
    provider_id: string
    payin_methods: string[] | null
    payout_methods: string[] | null
    is_supported: boolean
  }>(
    `SELECT pcc.corridor_id,
            pcc.provider_id,
            pcc.payin_methods,
            pcc.payout_methods,
            pcc.is_supported
       FROM silver.provider_corridor_capability pcc
       JOIN silver.rights_matrix rm
         ON rm.provider_id = pcc.provider_id
      WHERE pcc.corridor_id = ANY($1)
        AND pcc.is_supported = true
        AND rm.allowed_b2c = true
        AND rm.allowed_collect = true
        AND rm.stoplist_status = 'active'`,
    [corridorIds],
    pool,
  )
  return result.rows
}

const loadAllowedProviders = async (pool: ReturnType<typeof createPool>) => {
  const result = await query<{ provider_id: string }>(
    `SELECT provider_id
       FROM silver.rights_matrix
      WHERE allowed_b2c = true
        AND allowed_collect = true
        AND stoplist_status = 'active'`,
    [],
    pool,
  )
  return result.rows.map(row => normalizeProviderId(row.provider_id)).filter(Boolean)
}

export const runB2cTier2WarmupAudit = async (): Promise<void> => {
  const pool = createPool(config.db.planeAUrl)
  const { isShutdownRequested } = createShutdownHandler({
    timeoutMs: 30000,
    logger,
    onShutdown: async () => {
      await pool.end()
    },
  })

  try {
    const tier2Corridors = await loadTier2Corridors(pool)
    if (!tier2Corridors.length) {
      logger.warn('tier2_audit_empty', { reason: 'no_corridors' })
      return
    }

    const [allowedProviders, capabilityRows] = await Promise.all([
      loadAllowedProviders(pool),
      loadCapabilityRows(pool, tier2Corridors),
    ])

    const corridorProviders = new Map<string, Set<string>>()
    const corridorMethods = new Map<string, Set<string>>()
    const corridorsMissingMethods = new Set<string>()

    for (const row of capabilityRows) {
      if (isShutdownRequested()) return
      const corridorId = row.corridor_id
      const providerId = normalizeProviderId(row.provider_id)
      if (!corridorId || !providerId) continue

      if (!corridorProviders.has(corridorId)) {
        corridorProviders.set(corridorId, new Set())
      }
      corridorProviders.get(corridorId)!.add(providerId)

      const payoutMethods = Array.isArray(row.payout_methods) ? row.payout_methods : []
      if (!payoutMethods.length) {
        corridorsMissingMethods.add(corridorId)
        continue
      }
      if (!corridorMethods.has(corridorId)) {
        corridorMethods.set(corridorId, new Set())
      }
      for (const method of payoutMethods) {
        const normalized = normalizeToken(method)
        if (!allowedPayoutMethods.has(normalized)) continue
        corridorMethods.get(corridorId)!.add(normalized)
      }
    }

    const corridorsWithCapability = tier2Corridors.filter(id => corridorProviders.has(id))
    const corridorsWithoutCapability = tier2Corridors.filter(id => !corridorProviders.has(id))

    const payoutCoverageCounts = {
      bank_deposit: 0,
      cash_pickup: 0,
      mobile_wallet: 0,
      airtime: 0,
    }

    for (const methods of corridorMethods.values()) {
      for (const method of methods) {
        if (method in payoutCoverageCounts) {
          payoutCoverageCounts[method as keyof typeof payoutCoverageCounts] += 1
        }
      }
    }

    const providerCounts = Array.from(corridorProviders.values()).map(set => set.size)
    const minProviders = providerCounts.length ? Math.min(...providerCounts) : 0
    const maxProviders = providerCounts.length ? Math.max(...providerCounts) : 0
    const avgProviders = providerCounts.length
      ? providerCounts.reduce((sum, value) => sum + value, 0) / providerCounts.length
      : 0

    logger.info('tier2_warmup_audit', {
      total_corridors: tier2Corridors.length,
      allowed_providers: allowedProviders.length,
      corridors_with_capability: corridorsWithCapability.length,
      corridors_without_capability: corridorsWithoutCapability.length,
      corridors_missing_payout_methods: corridorsMissingMethods.size,
      payout_method_coverage: payoutCoverageCounts,
      provider_count_min: minProviders,
      provider_count_max: maxProviders,
      provider_count_avg: Number(avgProviders.toFixed(2)),
      sample_missing_capability: corridorsWithoutCapability.slice(0, 10),
      sample_missing_methods: Array.from(corridorsMissingMethods).slice(0, 10),
    })
  } finally {
    await pool.end()
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runB2cTier2WarmupAudit()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('tier2_warmup_audit_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}
