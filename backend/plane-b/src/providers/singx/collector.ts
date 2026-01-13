import { createHash, randomUUID } from 'node:crypto'
import type { Pool } from 'pg'

import { createPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { detectBlock } from '../../collectors/block-detection'
import { notifyBlockAlert } from '../../collectors/alert-routing'
import { persistAttemptMetrics } from '../../collectors/attempt-metrics'
import { resolveProviderRates } from '../../collectors/rate-config'
import { applyRpmRamp } from '../../collectors/rpm-ramp'
import {
  createIngestionRun,
  ensureCorridor,
  ensureProvider,
  finishIngestionRun,
  insertAttempt,
  insertOpsAlert,
  loadUnsupportedCorridors,
  markCorridorUnsupported,
  pauseProviderForBlock,
  persistNormalizedQuote,
  runAnomalyDetection,
  resumeProviderIfCooldownExpired,
} from '../../collectors/base'
import {
  checkCircuitState,
  closeCircuit,
  openCircuit,
  penalizeRpmImmediately,
} from '../../lib/redis-circuit-breaker'
import {
  getDefaultProxyTierForCollector,
  getProxyTierForCorridor,
  type ProxyTier,
} from '../../lib/proxy-router'
import { dispatchSignal } from '../../notifications/dispatcher'
import { writeBronzePayload } from '../../collectors/bronze-writer'
import { createScheduler } from '../../collectors/scheduler'
import { resolveRateLimitScope } from '../../collectors/rate-limit-scope'
import type { CollectorRequest } from '../../collectors/types'
import { LatestQuoteRepository, ProviderCapabilityRepository } from '../../repositories'
import { normalizeQuote } from '../../normalize/quote-normalizer'
import { amountBuckets as defaultAmountBuckets } from './catalog'
import { SINGX_SUPPORTED_CORRIDORS } from './supported-corridors'
import { httpLimits } from './limits'
import { fetchSingxQuote } from './fetch'
import { extractSingxMethodPairs, parseSingxPayload } from './parse'

type SingxCollectorOptions = {
  pool?: Pool
  corridors?: string[]
  delayMs?: number
  jitterMs?: number
  rateLimitBackoffMs?: number
  rateLimitJitterMs?: number
  rateLimitMaxRetries?: number
  corridorDelayMs?: number
  corridorJitterMs?: number
  amountBuckets?: number[]
  payinMethod?: string
  payoutMethod?: string
  locale?: string
  collectorType?: string
  freshnessSloMinutes?: number
  freshnessSloEnabled?: boolean
  rpmOverride?: number
  perCorridorRpmOverride?: number
  closePool?: boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const logger = createLogger('plane-b.singx.collector')

const upsertCapability = async (
  pool: Pool,
  corridorId: string,
  payload: Record<string, unknown>,
) => {
  const pairs = extractSingxMethodPairs(payload)
  const payinMethods = Array.from(new Set(pairs.map(pair => pair.payin_method))).filter(
    method => method !== 'other',
  )
  const payoutMethods = Array.from(new Set(pairs.map(pair => pair.payout_method))).filter(
    method => method !== 'other',
  )
  const payinValue = payinMethods.length ? payinMethods : null
  const payoutValue = payoutMethods.length ? payoutMethods : null

  const repo = new ProviderCapabilityRepository(pool)
  await repo.upsertCapability({
    providerId: 'singx',
    corridorId,
    payinMethods: payinValue,
    payoutMethods: payoutValue,
    isSupported: true,
    source: 'observed',
  })
}

const getLatestQuoteAgeMinutes = async (
  pool: Pool,
  providerId: string,
  corridorId: string,
  amountBucket: number,
  payinMethod: string,
  payoutMethod: string,
) => {
  const repo = new LatestQuoteRepository(pool)
  return repo.getLatestQuoteAgeMinutes(
    providerId,
    corridorId,
    amountBucket,
    payinMethod,
    payoutMethod,
  )
}

export const runSingxCollector = async (options: SingxCollectorOptions = {}) => {
  const providerId = 'singx'
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const shouldClose = options.closePool ?? !options.pool
  let corridors: string[]

  if (options.corridors?.length) {
    corridors = options.corridors
  } else {
    const allPossibleCorridors = SINGX_SUPPORTED_CORRIDORS
    const unsupportedCorridors = await loadUnsupportedCorridors(pool, providerId)
    corridors = allPossibleCorridors.filter(
      corridor => !unsupportedCorridors.has(corridor),
    )
  }
  const buckets = options.amountBuckets ?? defaultAmountBuckets
  const payinMethod = options.payinMethod ?? 'bank_transfer'
  const payoutMethod = options.payoutMethod ?? 'bank_deposit'
  const locale = options.locale ?? 'en-US'
  const delayMs = options.delayMs ?? config.planeB.singx.delayMs
  const jitterMs = options.jitterMs ?? config.planeB.singx.jitterMs
  const rateLimitBackoffMs = options.rateLimitBackoffMs ?? config.planeB.singx.rateLimitBackoffMs
  const rateLimitJitterMs = options.rateLimitJitterMs ?? config.planeB.singx.rateLimitJitterMs
  const rateLimitMaxRetries = options.rateLimitMaxRetries ?? config.planeB.singx.rateLimitMaxRetries
  const corridorDelayMs = options.corridorDelayMs ?? config.planeB.singx.corridorDelayMs
  const corridorJitterMs = options.corridorJitterMs ?? config.planeB.singx.corridorJitterMs
  const collectorType = options.collectorType ?? 'collector'
  const freshnessSloMinutes = options.freshnessSloMinutes ?? config.planeB.singx.freshnessSloMinutes
  const freshnessSloEnabled = options.freshnessSloEnabled ?? config.planeB.singx.freshnessSloEnabled
  const blockCooldownMs = config.planeB.singx.blockCooldownMs
  const startedAt = new Date()
  const capabilityUpdated = new Set<string>()
  let freshnessChecked = 0
  let freshnessSkipped = 0
  let freshnessStale = 0
  let extraDelayMs = 0
  let extraJitterMs = 0
  const providerRates = await resolveProviderRates(
    pool,
    providerId,
    {
      rpm: httpLimits.rpm,
      perCorridorRpm: httpLimits.perCorridorRpm,
    },
    {
      rpm: options.rpmOverride,
      perCorridorRpm: options.perCorridorRpmOverride,
    },
  )
  let currentRates = {
    rpm: providerRates.rpm,
    perCorridorRpm: providerRates.perCorridorRpm,
  }
  const scheduler = createScheduler({
    providerId,
    rpm: currentRates.rpm,
    perCorridorRpm: currentRates.perCorridorRpm,
    baseDelayMs: delayMs,
    jitterMs,
    globalEnabled: Boolean(config.redis.url),
    locale,
    perLocale: httpLimits.perLocale,
    scope: resolveRateLimitScope(collectorType),
  })

  const runId = randomUUID()
  const amountBuckets = buckets.length ? buckets : [100]
  const hasProvider = await ensureProvider(pool, providerId, 'SingX')
  if (!hasProvider) {
    logger.error('provider_missing', { provider_id: providerId })
    if (shouldClose) await pool.end()
    return false
  }

  const run = await createIngestionRun(pool, {
    runId,
    providerId,
    collectorType,
    corridors: corridors.length,
    amountBuckets: amountBuckets.length,
    payinMethod,
    payoutMethod,
    startedAt,
    rpm: currentRates.rpm,
    perCorridorRpm: currentRates.perCorridorRpm,
  })

  let blocked = false
  let successCount = 0
  let failureCount = 0
  let lastError: string | null = null
  let lastErrorType: string | null = null

  const defaultProxyTier = getDefaultProxyTierForCollector(providerId, collectorType)

  for (const corridorId of corridors) {
    if (blocked) break
    const corridor = await ensureCorridor(pool, corridorId)
    if (!corridor) {
      logger.warn('corridor_missing', { corridor_id: corridorId })
      continue
    }

    const corridorProxyTier = getProxyTierForCorridor(providerId, corridorId)
    const proxyTier: ProxyTier = corridorProxyTier ?? defaultProxyTier

    for (const amountBucket of amountBuckets) {
      if (blocked) break

      const skipReason = await resumeProviderIfCooldownExpired(pool, providerId)
      if (skipReason?.paused) {
        logger.warn('provider_paused', { provider_id: providerId, reason: skipReason.reason })
        blocked = true
        break
      }

      if (freshnessSloEnabled) {
        const ageMinutes = await getLatestQuoteAgeMinutes(
          pool,
          providerId,
          corridorId,
          amountBucket,
          payinMethod,
          payoutMethod,
        )
        freshnessChecked += 1
        if (ageMinutes !== null && ageMinutes < freshnessSloMinutes) {
          freshnessSkipped += 1
          continue
        }
        freshnessStale += 1
      }

      await scheduler.acquireSlot()

      if (extraDelayMs > 0) {
        await sleep(extraDelayMs)
      }
      if (extraJitterMs > 0) {
        await sleep(Math.floor(Math.random() * extraJitterMs))
      }

      const request: CollectorRequest = {
        provider_id: providerId,
        corridor_id: corridorId,
        amount_bucket: amountBucket,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        send_amount: amountBucket,
        locale,
      }

      const requestHash = createHash('sha256')
        .update(JSON.stringify(request))
        .digest('hex')

      const circuit = await checkCircuitState(pool, providerId, corridorId)
      if (circuit.state === 'open') {
        logger.warn('circuit_open', {
          provider_id: providerId,
          corridor_id: corridorId,
          reason: circuit.reason,
        })
        continue
      }

      let attemptSuccess = false
      let payload: Record<string, unknown> | null = null
      let responseStatus: number | null = null
      let responseBody: string | null = null
      let errorType: string | null = null
      let errorMessage: string | null = null

      try {
        const result = await fetchSingxQuote(request, {
          jitterMs,
          proxyTier,
        })

        responseStatus = result.status
        responseBody = result.bodyText
        payload = result.payload as Record<string, unknown>

        await writeBronzePayload({
          providerId,
          corridorId,
          amountBucket,
          payload: result.payload,
          status: responseStatus,
        })

        const blockResult = detectBlock(responseStatus, responseBody)
        if (blockResult.blocked) {
          errorType = blockResult.reason ?? 'blocked'
          errorMessage = `blocked: ${errorType}`
          await openCircuit(pool, providerId, corridorId, errorType, blockCooldownMs)
          await pauseProviderForBlock(pool, providerId, corridorId, errorType, blockCooldownMs)
          await insertOpsAlert(pool, {
            providerId,
            corridorId,
            errorType,
            errorMessage,
            requestFingerprint: requestHash,
            httpStatus: responseStatus,
          })
          await notifyBlockAlert(providerId, corridorId, errorType, responseStatus)
          blocked = true
          lastErrorType = errorType
          lastError = errorMessage
        }

        if (!blocked) {
          const parsed = parseSingxPayload(payload as Record<string, unknown>, request)
          if (!parsed) {
            errorType = 'parse_error'
            errorMessage = 'singx parse returned null'
          } else {
            const normalized = normalizeQuote({
              providerId,
              corridorId,
              amountBucket,
              payinMethod: parsed.payin_method,
              payoutMethod: parsed.payout_method,
              sendAmount: parsed.send_amount,
              receiveAmount: parsed.receive_amount,
              feeAmount: parsed.fee_amount,
              totalDebitAmount: parsed.total_debit_amount,
              impliedFxRate: parsed.base_rate,
              promotionalRate: parsed.promotional_rate,
              baseRate: parsed.base_rate,
              promotionalFeeAmount: parsed.promotional_fee_amount,
              promotionalCapAmount: parsed.promotional_cap_amount,
              deliveryTimeMinMinutes: parsed.delivery_time_min_minutes,
              deliveryTimeMaxMinutes: parsed.delivery_time_max_minutes,
              qualityFlags: parsed.parse_flags,
              collectedAt: parsed.collected_at,
              providerPayload: payload,
            })

            await persistNormalizedQuote(pool, normalized)

            await runAnomalyDetection(pool, normalized)

            await dispatchSignal('quote_captured', {
              provider_id: providerId,
              corridor_id: corridorId,
              amount_bucket: amountBucket,
            })

            attemptSuccess = true
            successCount += 1

            if (!capabilityUpdated.has(corridorId)) {
              await upsertCapability(pool, corridorId, payload as Record<string, unknown>)
              capabilityUpdated.add(corridorId)
            }
          }
        }
      } catch (error: unknown) {
        errorType = error instanceof Error ? error.name : 'fetch_error'
        errorMessage = error instanceof Error ? error.message : String(error)
        responseStatus = responseStatus ?? null
        responseBody = responseBody ?? null
      }

      if (!attemptSuccess) {
        failureCount += 1
        lastErrorType = errorType
        lastError = errorMessage
        if (errorType === 'parse_error') {
          await markCorridorUnsupported(pool, providerId, corridorId, errorType)
        }
      } else {
        await closeCircuit(pool, providerId, corridorId)
        extraDelayMs = Math.max(0, extraDelayMs - 200)
        extraJitterMs = Math.max(0, extraJitterMs - 100)
      }

      await insertAttempt(pool, {
        providerId,
        corridorId,
        amountBucket,
        payinMethod,
        payoutMethod,
        sendAmount: amountBucket,
        attemptSuccess,
        httpStatus: responseStatus,
        errorType,
        errorMessage,
        requestFingerprint: requestHash,
      })

      await persistAttemptMetrics({
        providerId,
        corridorId,
        amountBucket,
        payinMethod,
        payoutMethod,
        httpStatus: responseStatus,
        success: attemptSuccess,
        errorType,
      })

      if (!attemptSuccess && responseStatus === 429) {
        extraDelayMs += rateLimitBackoffMs
        extraJitterMs += rateLimitJitterMs
        await penalizeRpmImmediately(pool, providerId, corridorId)
      }

      if (corridorDelayMs > 0) {
        await sleep(corridorDelayMs)
      }
      if (corridorJitterMs > 0) {
        await sleep(Math.floor(Math.random() * corridorJitterMs))
      }
    }
  }

  const finishedAt = new Date()
  await finishIngestionRun(pool, run.id, {
    finishedAt,
    successCount,
    failureCount,
    lastError,
    lastErrorType,
    freshnessChecked,
    freshnessSkipped,
    freshnessStale,
  })

  currentRates = applyRpmRamp({
    providerId,
    currentRates,
    successCount,
    failureCount,
    baseRates: providerRates,
    maxRpm: providerRates.rpm,
    maxPerCorridorRpm: providerRates.perCorridorRpm,
  })

  if (shouldClose) {
    await pool.end()
  }

  return !blocked
}
