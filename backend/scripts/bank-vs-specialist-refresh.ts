/**
 * Bank vs Specialist Refresh Job - Enqueue refresh requests for the fixed corridor.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend bank-vs-specialist:refresh
 * ```
 *
 * **Environment Variables**:
 * - `BANK_VS_SPECIALIST_CORRIDOR_ID`: Corridor ID (default: US-MX-USD-MXN)
 * - `BANK_VS_SPECIALIST_AMOUNT`: Send amount (default: 500)
 * - `BANK_VS_SPECIALIST_PAYIN_METHOD`: Payin method (default: bank_transfer)
 * - `BANK_VS_SPECIALIST_PAYOUT_METHOD`: Payout method (default: bank_deposit)
 * - `BANK_VS_SPECIALIST_PROVIDERS`: Comma list of provider IDs (default: all providers)
 * - `BANK_VS_SPECIALIST_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 300)
 */

import { computeBucketSelection } from '../shared/amount-bucket'
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createShutdownHandler } from '../shared/shutdown'
import { QuoteRefreshRepository } from '../plane-a/src/repositories'
import { getProviderIds, hasProvider } from '../plane-b/src/providers'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'

const logger = createLogger('script.bank-vs-specialist-refresh')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toList = (value: string | undefined) => {
  if (!value) return []
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

const lockTtlSeconds = toNumber(process.env.BANK_VS_SPECIALIST_LOCK_TTL_SECONDS, 300)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))

const corridorId = process.env.BANK_VS_SPECIALIST_CORRIDOR_ID || 'US-MX-USD-MXN'
const amount = toNumber(process.env.BANK_VS_SPECIALIST_AMOUNT, 500)
const payinMethod = process.env.BANK_VS_SPECIALIST_PAYIN_METHOD || 'bank_transfer'
const payoutMethod = process.env.BANK_VS_SPECIALIST_PAYOUT_METHOD || 'bank_deposit'

let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let pool: ReturnType<typeof createPool> | null = null

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
  onShutdown: async () => {
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    if (lock) {
      await lock.release().catch((error) => {
        logger.warn('lock_release_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (pool) {
      await pool.end()
    }
  },
})

const resolveProviders = () => {
  const requested = toList(process.env.BANK_VS_SPECIALIST_PROVIDERS)
  if (!requested.length) return getProviderIds()

  const unique = Array.from(new Set(requested))
  const unknown = unique.filter(providerId => !hasProvider(providerId))
  if (unknown.length) {
    logger.warn('unknown_provider_ids', { provider_ids: unknown })
  }
  const providers = unique.filter(providerId => hasProvider(providerId))
  return providers.length ? providers : getProviderIds()
}

export const runBankVsSpecialistRefresh = async (): Promise<number> => {
  if (isShutdownRequested()) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return 0
  }

  lock = new WorkerLock('bank-vs-specialist-refresh', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    return 0
  }

  lockRefreshTimer = setInterval(() => {
    if (!lock) return
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'bank-vs-specialist-refresh',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  pool = createPool(config.db.planeAUrl)
  const quoteRefreshRepository = new QuoteRefreshRepository(pool)

  const bucket = computeBucketSelection(amount)
  const amountBucket = bucket.bucket_used
  const providers = resolveProviders()

  const startTime = Date.now()
  let enqueued = 0

  try {
    const results = await Promise.all(
      providers.map(async (providerId) => {
        try {
          const requestId = await quoteRefreshRepository.enqueueRequest({
            providerId,
            corridorId,
            amountBucket,
            payinMethod,
            payoutMethod,
          })
          if (requestId) {
            enqueued += 1
          }
          return { providerId, requestId }
        } catch (error) {
          logger.warn('refresh_enqueue_failed', {
            provider_id: providerId,
            corridor_id: corridorId,
            error: error instanceof Error ? error.message : String(error),
          })
          return { providerId, requestId: null }
        }
      }),
    )

    logger.info('bank_vs_specialist_refresh_complete', {
      corridor_id: corridorId,
      amount_bucket: amountBucket,
      payin_method: payinMethod,
      payout_method: payoutMethod,
      provider_count: providers.length,
      enqueued_count: enqueued,
      duration_ms: Date.now() - startTime,
      queued: results.filter(result => result.requestId).map(result => result.providerId),
    })

    return enqueued
  } finally {
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    if (lock) {
      await lock.release()
    }
    if (pool) {
      await pool.end()
    }
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runBankVsSpecialistRefresh()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('bank_vs_specialist_refresh_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    })
}
