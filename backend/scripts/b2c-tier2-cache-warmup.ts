/**
 * B2C Tier-2 Cache Warmup
 *
 * Usage:
 *   pnpm -C backend b2c:tier2-warmup
 *
 * Environment Variables:
 * - `B2C_TIER2_WARMUP_AMOUNT`: Send amount (default: 500)
 * - `B2C_TIER2_WARMUP_SHARD_COUNT`: Shard count for 24h spread (default: 24)
 * - `B2C_TIER2_WARMUP_SHARD_INDEX`: Override shard index (default: hour of day UTC)
 * - `B2C_TIER2_WARMUP_PAYIN_METHOD`: Payin method (default: bank_transfer)
 * - `B2C_TIER2_WARMUP_MAX_REQUESTS`: Cap enqueued requests (default: 0 = no cap)
 * - `B2C_TIER2_WARMUP_CONCURRENCY`: Enqueue concurrency (default: 10)
 * - `B2C_TIER2_WARMUP_LOCK_TTL_SECONDS`: Lock TTL (default: 900)
 * - `B2C_TIER2_WARMUP_USE_UTC`: Use UTC hour for shard (default: 1)
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { computeBucketSelection } from '../shared/amount-bucket'
import { createLogger } from '../shared/logger'
import { normalizeProviderId } from '../shared/provider-utils'
import { createShutdownHandler } from '../shared/shutdown'
import { applyShard } from '../shared/sharding'
import { QuoteRefreshRepository } from '../plane-a/src/repositories'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'

const logger = createLogger('script.b2c-tier2-warmup')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback = true) => {
  if (value === undefined) return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

const normalizeToken = (value: string | null | undefined) => value?.trim().toLowerCase() ?? ''

const allowedPayoutMethods = new Set([
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
  'airtime',
])

const amount = toNumber(process.env.B2C_TIER2_WARMUP_AMOUNT, 500)
const defaultPayinMethod = process.env.B2C_TIER2_WARMUP_PAYIN_METHOD || 'bank_transfer'
const b2cPayinMethodByProvider: Record<string, string> = {
  koronapay: 'debit_card',
  remitbee: 'debit_card',
  sendwave: 'debit_card',
  intermex: 'debit_card',
  placid: 'debit_card',
}
const resolveB2cPayinMethod = (providerId: string) => {
  return b2cPayinMethodByProvider[providerId] ?? defaultPayinMethod
}
const shardCount = Math.max(1, toNumber(process.env.B2C_TIER2_WARMUP_SHARD_COUNT, 24))
const shardIndexOverride = process.env.B2C_TIER2_WARMUP_SHARD_INDEX
const maxRequests = Math.max(0, toNumber(process.env.B2C_TIER2_WARMUP_MAX_REQUESTS, 0))
const concurrency = Math.max(1, toNumber(process.env.B2C_TIER2_WARMUP_CONCURRENCY, 10))
const lockTtlSeconds = Math.max(60, toNumber(process.env.B2C_TIER2_WARMUP_LOCK_TTL_SECONDS, 900))
const useUtc = toBoolean(process.env.B2C_TIER2_WARMUP_USE_UTC, true)

const resolveShardIndex = () => {
  if (shardIndexOverride !== undefined) {
    const parsed = Number(shardIndexOverride)
    if (Number.isFinite(parsed)) return Math.floor(parsed)
  }
  const now = new Date()
  return useUtc ? now.getUTCHours() : now.getHours()
}

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

const resolvePayoutMethods = (raw: string[] | null) => {
  const methods = Array.isArray(raw) ? raw : []
  const normalized = methods
    .map(method => normalizeToken(method))
    .filter(method => allowedPayoutMethods.has(method))
  return Array.from(new Set(normalized))
}

export const runB2cTier2CacheWarmup = async (): Promise<number> => {
  let lock: WorkerLock | null = null
  let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
  const pool = createPool(config.db.planeAUrl)
  const { isShutdownRequested } = createShutdownHandler({
    timeoutMs: 30000,
    logger,
    onShutdown: async () => {
      if (lockRefreshTimer) clearInterval(lockRefreshTimer)
      if (lock) await lock.release()
      await pool.end()
    },
  })

  lock = new WorkerLock('b2c-tier2-warmup', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('warmup_skipped', { reason: 'lock_already_held' })
    await pool.end()
    return 0
  }

  lockRefreshTimer = setInterval(() => {
    if (!lock) return
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'b2c-tier2-warmup',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2)))

  try {
    const tier2Corridors = await loadTier2Corridors(pool)
    if (!tier2Corridors.length) {
      logger.warn('warmup_skipped', { reason: 'no_corridors' })
      return 0
    }

    const shardIndex = resolveShardIndex()
    const selectedCorridors = applyShard(tier2Corridors, shardIndex, shardCount)
    if (!selectedCorridors.length) {
      logger.info('warmup_skipped', { reason: 'empty_shard', shard_index: shardIndex })
      return 0
    }

    const capabilityRows = await loadCapabilityRows(pool, selectedCorridors)
    const requests: Array<{
      providerId: string
      corridorId: string
      payoutMethod: string
      payinMethod: string
    }> = []
    const missingPayoutMethods = new Set<string>()

    for (const row of capabilityRows) {
      if (isShutdownRequested()) break
      const corridorId = row.corridor_id
      const providerId = normalizeProviderId(row.provider_id)
      if (!corridorId || !providerId) continue
      const payinMethod = resolveB2cPayinMethod(providerId)
      if (Array.isArray(row.payin_methods) && row.payin_methods.length > 0) {
        const normalizedPayins = row.payin_methods.map(method => normalizeToken(method))
        if (!normalizedPayins.includes(normalizeToken(payinMethod))) {
          continue
        }
      }

      const payoutMethods = resolvePayoutMethods(row.payout_methods)
      if (!payoutMethods.length) {
        missingPayoutMethods.add(corridorId)
        continue
      }

      for (const payoutMethod of payoutMethods) {
        requests.push({ providerId, corridorId, payoutMethod, payinMethod })
      }
    }

    const uniqueRequests = new Map<string, {
      providerId: string
      corridorId: string
      payoutMethod: string
      payinMethod: string
    }>()
    for (const request of requests) {
      const key = `${request.providerId}:${request.corridorId}:${request.payoutMethod}`
      uniqueRequests.set(key, request)
    }

    const finalRequests = Array.from(uniqueRequests.values())
    if (!finalRequests.length) {
      logger.warn('warmup_skipped', {
        reason: 'no_requests',
        shard_index: shardIndex,
        corridors: selectedCorridors.length,
        missing_methods: missingPayoutMethods.size,
      })
      return 0
    }

    const cappedRequests = maxRequests > 0
      ? finalRequests.slice(0, maxRequests)
      : finalRequests

    const { bucket_used: amountBucket } = computeBucketSelection(amount)
    const quoteRefreshRepository = new QuoteRefreshRepository(pool)
    const payinMethodsUsed = Array.from(new Set(cappedRequests.map(request => request.payinMethod)))

    let enqueued = 0
    const startTime = Date.now()

    for (let i = 0; i < cappedRequests.length; i += concurrency) {
      const batch = cappedRequests.slice(i, i + concurrency)
      const results = await Promise.all(
        batch.map(async (request) => {
          try {
            const requestId = await quoteRefreshRepository.enqueueRequest({
              providerId: request.providerId,
              corridorId: request.corridorId,
              amountBucket,
              payinMethod: request.payinMethod,
              payoutMethod: request.payoutMethod,
            })
            if (requestId) enqueued += 1
            return requestId
          } catch (error) {
            logger.warn('warmup_enqueue_failed', {
              provider_id: request.providerId,
              corridor_id: request.corridorId,
              payout_method: request.payoutMethod,
              error: error instanceof Error ? error.message : String(error),
            })
            return null
          }
        }),
      )
      if (isShutdownRequested()) break
      if (!results.some(Boolean)) continue
    }

    logger.info('warmup_complete', {
      shard_index: shardIndex,
      shard_count: shardCount,
      corridors: selectedCorridors.length,
      request_candidates: finalRequests.length,
      enqueued_count: enqueued,
      amount_bucket: amountBucket,
      amount,
      payin_methods: payinMethodsUsed,
      missing_methods_corridors: missingPayoutMethods.size,
      duration_ms: Date.now() - startTime,
    })

    return enqueued
  } finally {
    if (lockRefreshTimer) clearInterval(lockRefreshTimer)
    if (lock) await lock.release()
    await pool.end()
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runB2cTier2CacheWarmup()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('warmup_failed', { error: error instanceof Error ? error.message : String(error) })
      process.exit(1)
    })
}
