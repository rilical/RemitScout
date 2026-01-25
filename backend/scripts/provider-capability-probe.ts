import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { resolveProviderSupport } from '../plane-b/src/services/provider-capability'
import { providerRegistry } from '../plane-b/src/providers'

const logger = createLogger('script.provider-capability-probe')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const limitPerProvider = Math.max(1, toNumber(process.env.CAPABILITY_PROBE_LIMIT, 25))
const amountBucket = Math.max(1, toNumber(process.env.CAPABILITY_PROBE_AMOUNT_BUCKET, 500))
const payinMethod = process.env.CAPABILITY_PROBE_PAYIN_METHOD || 'bank_transfer'
const payoutMethod = process.env.CAPABILITY_PROBE_PAYOUT_METHOD || 'bank_deposit'

const targetTiers = (process.env.CAPABILITY_PROBE_TIERS || 'tier_1,tier_2')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)

const loadTierCorridors = async (pool: ReturnType<typeof createPool>) => {
  if (!targetTiers.length) return []
  const result = await query<{ corridor_id: string }>(
    `SELECT corridor_id
       FROM silver.corridor_priority
      WHERE priority_tier = ANY($1::text[])
      ORDER BY corridor_id`,
    [targetTiers],
    pool,
  )
  return result.rows.map(row => row.corridor_id).filter(Boolean)
}

const loadExistingCapability = async (pool: ReturnType<typeof createPool>, providerId: string) => {
  const result = await query<{ corridor_id: string }>(
    `SELECT corridor_id
       FROM silver.provider_corridor_capability
      WHERE provider_id = $1`,
    [providerId],
    pool,
  )
  return new Set(result.rows.map(row => row.corridor_id).filter(Boolean))
}

export const runProviderCapabilityProbe = async () => {
  const pool = createPool(config.db.planeBUrl)
  try {
    const tierCorridors = await loadTierCorridors(pool)
    if (!tierCorridors.length) {
      logger.warn('capability_probe_no_corridors', { tiers: targetTiers })
      return
    }

    for (const provider of providerRegistry) {
      const providerId = provider.providerId
      const existing = await loadExistingCapability(pool, providerId)
      const supportedList = provider.supportedCorridors
      const candidateSet = supportedList.length
        ? tierCorridors.filter(corridor => supportedList.includes(corridor))
        : tierCorridors
      const candidates = candidateSet.filter(corridor => !existing.has(corridor))

      if (!candidates.length) {
        logger.info('capability_probe_skip', { provider_id: providerId, reason: 'no_candidates' })
        continue
      }

      let probed = 0
      for (const corridorId of candidates) {
        if (probed >= limitPerProvider) break
        const decision = await resolveProviderSupport(
          pool,
          {
            provider_id: providerId,
            corridor_id: corridorId,
            amount_bucket: amountBucket,
            payin_method: payinMethod,
            payout_method: payoutMethod,
            send_amount: amountBucket,
            locale: 'en-US',
          },
          { allowProbe: true },
        )
        probed += 1
        logger.info('capability_probe_result', {
          provider_id: providerId,
          corridor_id: corridorId,
          supported: decision.supported,
          reason: decision.reason,
          source: decision.source,
        })
      }

      logger.info('capability_probe_summary', {
        provider_id: providerId,
        probed,
        candidates: candidates.length,
        limit: limitPerProvider,
      })
    }
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runProviderCapabilityProbe().catch((error) => {
    logger.error('capability_probe_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}
