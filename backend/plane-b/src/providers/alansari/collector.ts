import { createHash, randomUUID } from 'node:crypto'
import type { Pool } from 'pg'

import { createPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { detectBlock } from '../../collectors/block-detection'
import { persistAttemptMetrics } from '../../collectors/attempt-metrics'
import { notifyBlockAlert } from '../../collectors/alert-routing'
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
import { ALANSARI_SUPPORTED_CORRIDORS } from './supported-corridors'
import { httpLimits } from './limits'
import { fetchAlansariQuote } from './fetch'
import { extractAlansariMethodPairs, parseAlansariPayload } from './parse'

/**
 * Alansari Collector
 *
 * Orchestrates quote collection from Alansari API while handling
 * rate limits, circuit breaking, and persistence.
 */

type AlansariCollectorOptions = {
  pool?: Pool
  closePool?: boolean
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
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const logger = createLogger('plane-b.alansari.collector')

const upsertCapability = async (
  pool: Pool,
  corridorId: string,
  payload: Record<string, unknown>,
  request: CollectorRequest,
) => {
  const pairs = extractAlansariMethodPairs(payload, request)
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
    providerId: 'alansari',
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

export const runAlansariCollector = async (options: AlansariCollectorOptions = {}) => {
  const providerId = 'alansari'
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const shouldClose = options.closePool ?? !options.pool
  let corridors: string[]

  if (options.corridors?.length) {
    corridors = options.corridors
  } else {
    const allPossibleCorridors = ALANSARI_SUPPORTED_CORRIDORS
    const unsupportedCorridors = await loadUnsupportedCorridors(pool, providerId)
    corridors = allPossibleCorridors.filter(
      corridor => !unsupportedCorridors.has(corridor)
    )
  }
  const buckets = options.amountBuckets ?? defaultAmountBuckets
  const payinMethod = options.payinMethod ?? 'bank_transfer'
  const payoutMethod = options.payoutMethod ?? 'bank_deposit'
  const locale = options.locale ?? 'en-US'
  const delayMs = options.delayMs ?? config.planeB.alansari.delayMs
  const jitterMs = options.jitterMs ?? config.planeB.alansari.jitterMs
  const rateLimitBackoffMs = options.rateLimitBackoffMs ?? config.planeB.alansari.rateLimitBackoffMs
  const rateLimitJitterMs = options.rateLimitJitterMs ?? config.planeB.alansari.rateLimitJitterMs
  const rateLimitMaxRetries = options.rateLimitMaxRetries ?? config.planeB.alansari.rateLimitMaxRetries
  const corridorDelayMs = options.corridorDelayMs ?? config.planeB.alansari.corridorDelayMs
  const corridorJitterMs = options.corridorJitterMs ?? config.planeB.alansari.corridorJitterMs
  const collectorType = options.collectorType ?? 'collector'
  const freshnessSloMinutes = options.freshnessSloMinutes ?? config.planeB.alansari.freshnessSloMinutes
  const freshnessSloEnabled = options.freshnessSloEnabled ?? config.planeB.alansari.freshnessSloEnabled
  const blockCooldownMs = config.planeB.alansari.blockCooldownMs
  const startedAt = new Date()
  const capabilityUpdated = new Set<string>()
  let freshnessChecked = 0
  let freshnessSkipped = 0
  let freshnessStale = 0
  const providerRates = await resolveProviderRates(pool, providerId, {
    rpm: httpLimits.rpm,
    perCorridorRpm: httpLimits.perCorridorRpm,
  }, {
    rpm: options.rpmOverride,
    perCorridorRpm: options.perCorridorRpmOverride,
  })
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
  let attemptCount = 0
  let successCount = 0
  let blockCount = 0
  let rateLimitCount = 0
  let http2xxCount = 0
  let attemptDurationMsTotal = 0
  let lastSuccessAt: Date | null = null
  let shouldStop = false
  let blocked = false
  let blockReason: string | null = null
  let rateLimitRetries = 0
  let extraDelayMs = 0
  let extraJitterMs = 0
  const recordAttemptDuration = (startedAtMs: number) => {
    const durationMs = Date.now() - startedAtMs
    attemptDurationMsTotal += durationMs
    return durationMs
  }
  const sleepRateLimit = async () => {
    const jitter = rateLimitJitterMs > 0 ? Math.floor(Math.random() * rateLimitJitterMs) : 0
    await sleep(rateLimitBackoffMs + jitter)
  }
  const applyRateLimitPenalty = () => {
    extraDelayMs = Math.min(extraDelayMs + rateLimitBackoffMs, rateLimitBackoffMs * 3)
    extraJitterMs = Math.min(extraJitterMs + rateLimitJitterMs, rateLimitJitterMs * 3)
  }
  const decayRateLimitPenalty = () => {
    extraDelayMs = Math.max(0, Math.floor(extraDelayMs * 0.7))
    extraJitterMs = Math.max(0, Math.floor(extraJitterMs * 0.7))
  }
  const isRateLimit = (reason: string | null) =>
    reason === 'http_429' || reason === 'keyword_too_many_requests'
  const isScheduledSweep = collectorType === 'collector'
    || collectorType === 'b2b_full_sweep'
    || collectorType === 'b2b_tier_1_alpha'
    || collectorType === 'b2b_tier_2_reference'
    || collectorType === 'b2b_tier_3_discovery'
  const shouldApplyFreshnessSlo = freshnessSloEnabled && isScheduledSweep
  const defaultProxyTier = getDefaultProxyTierForCollector(collectorType)
  const proxyTierCache = new Map<string, ProxyTier>()
  const resolveProxyTier = async (corridorId: string) => {
    if (proxyTierCache.has(corridorId)) {
      return proxyTierCache.get(corridorId) as ProxyTier
    }
    const proxyTier = await getProxyTierForCorridor(pool, corridorId, defaultProxyTier)
    proxyTierCache.set(corridorId, proxyTier)
    return proxyTier
  }

  await ensureProvider(pool, providerId, 'Alansari')
  const resumeStatus = await resumeProviderIfCooldownExpired(pool, providerId)
  if (!resumeStatus.canCollect) {
    logger.warn('collector_paused', { reason: resumeStatus.reason })
    if (shouldClose) await pool.end()
    return false
  }
  if (resumeStatus.reason === 'auto_resume') {
    logger.info('collector_resumed', { reason: resumeStatus.reason })
  }

  const ingestionRunId = await createIngestionRun(pool, providerId, collectorType, startedAt)

  try {
    for (const corridorId of corridors) {
      if (shouldStop || blocked) break
      await ensureCorridor(pool, corridorId)
      await scheduler.waitForSlot(corridorId, extraDelayMs, extraJitterMs)
      await sleep(corridorDelayMs + Math.random() * corridorJitterMs)

      if (collectorType !== 'capability') {
        const unsupported = await loadUnsupportedCorridors(pool, providerId)
        if (unsupported.has(corridorId)) {
          logger.info('alansari_corridor_skipped', {
            corridor_id: corridorId,
            reason: 'unsupported',
          })
          continue
        }
      }

      for (const amount of buckets) {
        if (shouldStop) break
        const request: CollectorRequest = {
          provider_id: providerId,
          corridor_id: corridorId,
          amount_bucket: amount,
          payin_method: payinMethod,
          payout_method: payoutMethod,
          send_amount: amount,
          locale,
        }

        if (shouldApplyFreshnessSlo) {
          freshnessChecked += 1
          const ageMinutes = await getLatestQuoteAgeMinutes(
            pool,
            providerId,
            corridorId,
            amount,
            payinMethod,
            payoutMethod,
          )
          if (ageMinutes !== null && ageMinutes <= freshnessSloMinutes) {
            freshnessSkipped += 1
            continue
          }
          freshnessStale += 1
        }

        const requestFingerprint = createHash('sha256')
          .update(JSON.stringify(request))
          .digest('hex')

        const traceId = randomUUID()
        attemptCount += 1
        const attemptStartedAt = Date.now()

        const circuitState = await checkCircuitState(pool, providerId, corridorId)
        const isHalfOpen = circuitState === 'half_open'
        if (circuitState === 'open') {
          logger.warn('alansari_circuit_open', { corridor_id: corridorId })
          blocked = true
          blockReason = 'circuit_open'
          break
        }

        const proxyTier: ProxyTier = await resolveProxyTier(corridorId)

        let responseStatus: number | null = null
        let responsePayload: Record<string, unknown> | null = null
        let responseText: string | null = null
        let attemptErrorType: string | null = null
        let attemptErrorMessage: string | null = null
        let bronzeObjectKey: string | null = null

        try {
          const response = await fetchAlansariQuote(request, { proxyTier })
          responseStatus = response.status
          responseText = response.bodyText
          responsePayload = response.payload && typeof response.payload === 'object'
            ? (response.payload as Record<string, unknown>)
            : null
          if (responseStatus >= 200 && responseStatus < 300) {
            http2xxCount += 1
          }

          const bronzeId = await writeBronzePayload(pool, {
            provider_id: providerId,
            corridor_id: corridorId,
            payload: responsePayload ?? responseText ?? '',
          })
          bronzeObjectKey = bronzeId ? `bronze.provider_raw:${bronzeId}` : null

          const blockResult = detectBlock(responseStatus, responseText)
          if (blockResult.blocked) {
            const reason = blockResult.reason ?? 'blocked'
            const rateLimited = isRateLimit(blockResult.reason ?? null)
            blockCount += 1
            if (rateLimited) {
              rateLimitCount += 1
              applyRateLimitPenalty()
            }
            attemptErrorType = rateLimited ? 'rate_limit' : 'blocked'
            attemptErrorMessage = reason

            const alertId = await insertOpsAlert(pool, providerId, {
              corridorId,
              amountBucket: amount,
              payinMethod,
              payoutMethod,
              httpStatus: responseStatus,
              blockReason: reason,
              bronzeObjectKey,
              collectorType,
              traceId,
              requestFingerprint,
            })
            const shouldAlert = !rateLimited || rateLimitRetries >= Math.max(rateLimitMaxRetries, 0)
            if (shouldAlert && alertId) {
              await notifyBlockAlert(pool, alertId)
            }

            if (responseStatus === 429 || responseStatus === 403) {
              const reasonLabel = responseStatus === 429 ? 'rate_limit' : 'http_403'
              await openCircuit(pool, providerId, corridorId, reasonLabel, config.planeB.circuitOpenMs)
              const penalized = await penalizeRpmImmediately(pool, providerId, currentRates, 0.5)
              if (penalized) {
                currentRates = penalized
                providerRates.rpm = penalized.rpm
                providerRates.perCorridorRpm = penalized.perCorridorRpm
                scheduler.updateRates(penalized.rpm, penalized.perCorridorRpm)
              }
            }

            if (rateLimited) {
              rateLimitRetries += 1
              await sleepRateLimit()
            } else {
              await pauseProviderForBlock(pool, providerId, corridorId, reason, blockCooldownMs)
              blocked = true
              blockReason = reason
              shouldStop = true
            }
          }

          if (!attemptErrorType && (responseStatus !== 200 || !responsePayload)) {
            attemptErrorType = 'http_error'
            attemptErrorMessage = 'non_200_response'
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          attemptErrorType = 'exception'
          attemptErrorMessage = errorMessage
          await openCircuit(pool, providerId, corridorId, 'exception', config.planeB.circuitOpenMs)
          logger.error('alansari_fetch_failed', {
            corridor_id: corridorId,
            error: errorMessage,
          })
        }

        const parsed = !attemptErrorType && responsePayload
          ? parseAlansariPayload(responsePayload, request)
          : null
        if (!attemptErrorType && !parsed) {
          attemptErrorType = 'parse_error'
          attemptErrorMessage = 'parse_failed'
        }

        recordAttemptDuration(attemptStartedAt)

        await insertAttempt(pool, providerId, {
          corridorId,
          amountBucket: amount,
          payinMethod,
          payoutMethod,
          success: attemptErrorType === null,
          errorType: attemptErrorType,
          httpStatus: responseStatus,
          errorMessage: attemptErrorMessage,
          bronzeObjectKey,
          requestFingerprint,
        })

        if (attemptErrorType) {
          continue
        }

        if (attemptErrorType || !parsed) {
          continue
        }

        const normalizedQuote = normalizeQuote({
          provider_id: providerId,
          corridor_id: corridorId,
          amount_bucket: amount,
          send_amount: parsed.send_amount,
          fee_amount: parsed.fee_amount,
          fee_currency: parsed.fee_currency,
          total_debit_amount: parsed.total_debit_amount,
          receive_amount: parsed.receive_amount,
          payin_method: parsed.payin_method,
          payout_method: parsed.payout_method,
          promotional_fee_amount: parsed.promotional_fee_amount,
          delivery_time_min_minutes: parsed.delivery_time_min_minutes,
          delivery_time_max_minutes: parsed.delivery_time_max_minutes,
          promotional_rate: parsed.promotional_rate,
          base_rate: parsed.base_rate,
          promotional_cap_amount: parsed.promotional_cap_amount,
          collected_at: parsed.collected_at,
          ingestion_run_id: ingestionRunId,
          bronze_object_key: bronzeObjectKey ?? 'bronze.provider_raw:unknown',
          parser_version: parsed.parser_version,
          parse_flags: parsed.parse_flags,
        })
        await persistNormalizedQuote(pool, normalizedQuote)
        const anomaly = await runAnomalyDetection({
          pool,
          providerId,
          corridorId,
          currentRate: normalizedQuote.implied_fx_rate,
          collectorType,
        })
        if (anomaly?.detected) {
          await dispatchSignal(pool, corridorId, providerId, anomaly)
        }
        successCount += 1
        lastSuccessAt = new Date()

        if (isHalfOpen) {
          await closeCircuit(pool, providerId, corridorId)
          await closeCircuit(pool, providerId, null)
        }

        if (!capabilityUpdated.has(corridorId) && responsePayload) {
          await upsertCapability(pool, corridorId, responsePayload, request)
          capabilityUpdated.add(corridorId)
        }

        decayRateLimitPenalty()
      }

      if (blocked) {
        break
      }
    }
  } finally {
    await finishIngestionRun(pool, ingestionRunId, blocked ? 'blocked' : 'success', blockReason)
    if (attemptCount > 0) {
      const avgAttemptSeconds = attemptDurationMsTotal / attemptCount / 1000
      await persistAttemptMetrics(pool, providerId, locale, avgAttemptSeconds, attemptCount)
    }
    await applyRpmRamp({
      pool,
      providerId,
      collectorType,
      stats: {
        attemptCount,
        successCount,
        blockCount,
        rateLimitCount,
        http2xxCount,
      },
      rates: providerRates,
    })

    if (shouldClose) {
      await pool.end()
    }
  }

  return !blocked
}
