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
import { getProxyTierForCorridor, type ProxyTier } from '../../lib/proxy-router'
import { dispatchSignal } from '../../notifications/dispatcher'
import { writeBronzePayload } from '../../collectors/bronze-writer'
import { createScheduler } from '../../collectors/scheduler'
import type { CollectorRequest } from '../../collectors/types'
import { LatestQuoteRepository, ProviderCapabilityRepository } from '../../repositories'
import { normalizeQuote } from '../../normalize/quote-normalizer'
import { amountBuckets as defaultAmountBuckets } from './catalog'
import { WESTERNUNION_SUPPORTED_CORRIDORS } from './supported-corridors'
import { httpLimits } from './limits'
import { fetchWesternUnionQuote } from './fetch'
import { extractWesternUnionMethodPairs, parseWesternUnionPayload } from './parse'

/**
 * Western Union Collector
 *
 * This collector orchestrates the collection of money transfer quotes from Western Union's API.
 * It handles rate limiting, circuit breaking, error recovery, and data persistence.
 *
 * Flow:
 * 1. Initialize collector with options and resolve rate limits
 * 2. For each corridor and amount bucket:
 *    - Check freshness SLO (if enabled) to skip recent quotes
 *    - Wait for rate limit slot via scheduler
 *    - Fetch quote from Western Union API
 *    - Write raw payload to bronze storage
 *    - Detect blocks/rate limits and handle accordingly
 *    - Parse provider-specific payload format
 *    - Normalize to standard quote format
 *    - Persist normalized quote to database
 *    - Run anomaly detection and dispatch signals if needed
 * 3. Apply rate limit penalties on errors, decay on success
 * 4. Update RPM rates based on performance metrics
 */

type WesternUnionCollectorOptions = {
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
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const logger = createLogger('plane-b.westernunion.collector')

/**
 * Updates provider capability information for a corridor.
 * Extracts available payin/payout methods from the API response and stores them
 * in the database. This helps track which payment methods are supported per corridor.
 * Uses a Set to cache updates and avoid duplicate database writes.
 */
const upsertCapability = async (
  pool: Pool,
  corridorId: string,
  payload: Record<string, unknown>,
) => {
  const pairs = extractWesternUnionMethodPairs(payload)
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
    providerId: 'westernunion',
    corridorId,
    payinMethods: payinValue,
    payoutMethods: payoutValue,
    isSupported: true,
    source: 'observed',
  })
}

/**
 * Checks the age of the most recent quote for a specific corridor/amount/method combination.
 * Used by freshness SLO to determine if we should skip fetching a new quote.
 * Returns null if no quote exists, otherwise returns age in minutes.
 */
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

/**
 * Main collector function that orchestrates quote collection from Western Union.
 *
 * @param options - Configuration options for the collector run
 * @returns Promise<boolean> - true if collection completed successfully, false if blocked
 */
export const runWesternUnionCollector = async (options: WesternUnionCollectorOptions = {}) => {
  const providerId = 'westernunion'
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const shouldClose = !options.pool
  let corridors: string[]

  if (options.corridors?.length) {
    corridors = options.corridors
  } else {
    const allPossibleCorridors = WESTERNUNION_SUPPORTED_CORRIDORS
    const unsupportedCorridors = await loadUnsupportedCorridors(pool, providerId)
    corridors = allPossibleCorridors.filter(
      corridor => !unsupportedCorridors.has(corridor)
    )
  }
  const buckets = options.amountBuckets ?? defaultAmountBuckets
  const payinMethod = options.payinMethod ?? 'bank_transfer'
  const payoutMethod = options.payoutMethod ?? 'bank_deposit'
  const locale = options.locale ?? 'en-US'
  const delayMs = options.delayMs ?? config.planeB.remitly.delayMs
  const jitterMs = options.jitterMs ?? config.planeB.remitly.jitterMs
  const rateLimitBackoffMs = options.rateLimitBackoffMs ?? config.planeB.remitly.rateLimitBackoffMs
  const rateLimitJitterMs = options.rateLimitJitterMs ?? config.planeB.remitly.rateLimitJitterMs
  const rateLimitMaxRetries = options.rateLimitMaxRetries ?? config.planeB.remitly.rateLimitMaxRetries
  const corridorDelayMs = options.corridorDelayMs ?? config.planeB.remitly.corridorDelayMs
  const corridorJitterMs = options.corridorJitterMs ?? config.planeB.remitly.corridorJitterMs
  const collectorType = options.collectorType ?? 'collector'
  const freshnessSloMinutes = options.freshnessSloMinutes ?? config.planeB.remitly.freshnessSloMinutes
  const freshnessSloEnabled = options.freshnessSloEnabled ?? config.planeB.remitly.freshnessSloEnabled
  const blockCooldownMs = config.planeB.remitly.blockCooldownMs
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
  })
  let attemptCount = 0
  let successCount = 0
  let blockCount = 0
  let rateLimitCount = 0
  let http2xxCount = 0
  let attemptDurationMsTotal = 0
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
  const sleepBetweenCorridors = async () => {
    if (corridorDelayMs <= 0 && corridorJitterMs <= 0) return
    const jitter = corridorJitterMs > 0 ? Math.floor(Math.random() * corridorJitterMs) : 0
    await sleep(corridorDelayMs + jitter)
  }
  const isRateLimit = (reason: string | null) =>
    reason === 'http_429' || reason === 'keyword_too_many_requests'
  const isScheduledSweep = collectorType === 'collector'
    || collectorType === 'b2b_full_sweep'
    || collectorType === 'b2b_tier_1_alpha'
    || collectorType === 'b2b_tier_2_reference'
    || collectorType === 'b2b_tier_3_discovery'
  const shouldApplyFreshnessSlo = freshnessSloEnabled && isScheduledSweep
  const proxyTierCache = new Map<string, ProxyTier>()
  const resolveProxyTier = async (corridorId: string) => {
    if (proxyTierCache.has(corridorId)) {
      return proxyTierCache.get(corridorId) as ProxyTier
    }
    const proxyTier = await getProxyTierForCorridor(pool, corridorId)
    proxyTierCache.set(corridorId, proxyTier)
    return proxyTier
  }

  await ensureProvider(pool, providerId, 'Western Union')

  const resumeStatus = await resumeProviderIfCooldownExpired(pool, providerId)
  if (!resumeStatus.canCollect) {
    logger.warn('collector_paused', { reason: resumeStatus.reason })
    return false
  }
  if (resumeStatus.reason === 'auto_resume') {
    logger.info('collector_resumed', { reason: resumeStatus.reason })
  }

  const ingestionRunId = await createIngestionRun(pool, providerId, collectorType, startedAt)
  logger.info('collector_start', {
    ingestion_run_id: ingestionRunId,
    collector_type: collectorType,
    corridor_count: corridors.length,
    bucket_count: buckets.length,
    payin_method: payinMethod,
    payout_method: payoutMethod,
    locale,
    rpm: providerRates.rpm,
    per_corridor_rpm: providerRates.perCorridorRpm,
    rpm_source: providerRates.source,
  })

  let blocked = false
  let blockReason: string | null = null
  const providerCircuitState = await checkCircuitState(pool, providerId, null)
  if (providerCircuitState === 'open') {
    logger.warn('collector_circuit_open', { scope: 'provider', provider_id: providerId })
    await finishIngestionRun(pool, ingestionRunId, 'blocked', 'circuit_open')
    if (shouldClose) {
      await pool.end()
    }
    return false
  }

  for (const corridorId of corridors) {
    let skipCorridor = false
    logger.debug('corridor_start', { corridor_id: corridorId })
    await ensureCorridor(pool, corridorId)
    const proxyTier = await resolveProxyTier(corridorId)

    for (const amountBucket of buckets) {
      if (skipCorridor) {
        break
      }
      if (shouldApplyFreshnessSlo) {
        freshnessChecked += 1
        const ageMinutes = await getLatestQuoteAgeMinutes(
          pool,
          providerId,
          corridorId,
          amountBucket,
          payinMethod,
          payoutMethod,
        )
        if (ageMinutes !== null && ageMinutes <= freshnessSloMinutes) {
          freshnessSkipped += 1
          logger.debug('freshness_skip', {
            corridor_id: corridorId,
            amount_bucket: amountBucket,
            age_minutes: ageMinutes,
            slo_minutes: freshnessSloMinutes,
          })
          continue
        }
        freshnessStale += 1
        logger.debug('freshness_stale', {
          corridor_id: corridorId,
          amount_bucket: amountBucket,
          age_minutes: ageMinutes,
          slo_minutes: freshnessSloMinutes,
        })
      }
      let rateLimitRetries = 0
      let completed = false

      while (!completed) {
        const circuitState = await checkCircuitState(pool, providerId, corridorId)
        if (circuitState === 'open') {
          logger.warn('circuit_open_skip', { provider_id: providerId, corridor_id: corridorId })
          completed = true
          continue
        }
        const isHalfOpen = circuitState === 'half_open'

        attemptCount += 1
        const traceId = randomUUID()
        const attemptStartedAt = Date.now()
        let fetchDurationMs = 0
        let bronzeDurationMs = 0
        let parseDurationMs = 0
        let normalizeDurationMs = 0
        let persistDurationMs = 0

        const request: CollectorRequest = {
          provider_id: providerId,
          corridor_id: corridorId,
          amount_bucket: amountBucket,
          payin_method: payinMethod,
          payout_method: payoutMethod,
          send_amount: amountBucket,
          locale,
        }

        const requestFingerprint = createHash('sha256')
          .update(`${corridorId}:${amountBucket}:${payinMethod}:${payoutMethod}`)
          .digest('hex')

        logger.debug('quote_attempt_start', {
          trace_id: traceId,
          corridor_id: corridorId,
          amount_bucket: amountBucket,
          payin_method: payinMethod,
          payout_method: payoutMethod,
          request_fingerprint: requestFingerprint,
        })

        await scheduler.waitForSlot(corridorId, extraDelayMs, extraJitterMs)
        let fetchResult: Awaited<ReturnType<typeof fetchWesternUnionQuote>>
        const fetchStartedAt = Date.now()
        try {
          fetchResult = await fetchWesternUnionQuote(request, {
            jitterMs,
            forceAllPayins: collectorType === 'health_probe',
            proxyTier,
          })
          fetchDurationMs = Date.now() - fetchStartedAt
          logger.debug('quote_fetch_result', {
            trace_id: traceId,
            corridor_id: corridorId,
            amount_bucket: amountBucket,
            payin_method: payinMethod,
            payout_method: payoutMethod,
            http_status: fetchResult.status,
            duration_ms: fetchDurationMs,
          })
          if (fetchResult.status >= 200 && fetchResult.status < 300) {
            http2xxCount += 1
          }
        } catch (error) {
          fetchDurationMs = Date.now() - fetchStartedAt
          logger.error('quote_fetch_error', {
            trace_id: traceId,
            corridor_id: corridorId,
            amount_bucket: amountBucket,
            payin_method: payinMethod,
            payout_method: payoutMethod,
            duration_ms: fetchDurationMs,
            error,
          })
          await insertAttempt(pool, providerId, {
            corridorId,
            amountBucket,
            payinMethod,
            payoutMethod,
            success: false,
            errorType: 'network_error',
            httpStatus: null,
            errorMessage: (error as Error).message,
            requestFingerprint,
          })
          const attemptDurationMs = recordAttemptDuration(attemptStartedAt)
          logger.info('quote_attempt_finish', {
            trace_id: traceId,
            status: 'error',
            stage: 'fetch',
            total_duration_ms: attemptDurationMs,
            fetch_duration_ms: fetchDurationMs,
          })
          completed = true
          continue
        }

        const payload = fetchResult.payload ?? fetchResult.bodyText
        const bronzeStartedAt = Date.now()
        const bronzeId = await writeBronzePayload(pool, {
          provider_id: providerId,
          corridor_id: corridorId,
          payload,
        })
        bronzeDurationMs = Date.now() - bronzeStartedAt
        const bronzeObjectKey = bronzeId ? `bronze.provider_raw:${bronzeId}` : null
        logger.debug('quote_bronze_written', {
          trace_id: traceId,
          corridor_id: corridorId,
          amount_bucket: amountBucket,
          bronze_object_key: bronzeObjectKey,
          duration_ms: bronzeDurationMs,
        })

        const blockResult = detectBlock(fetchResult.status, fetchResult.bodyText)
        if (blockResult.blocked) {
          const reason = blockResult.reason ?? 'blocked'
          const rateLimited = isRateLimit(blockResult.reason ?? null)
          blockCount += 1
          if (rateLimited) {
            rateLimitCount += 1
            applyRateLimitPenalty()
          }
          logger.warn('quote_blocked', {
            trace_id: traceId,
            corridor_id: corridorId,
            amount_bucket: amountBucket,
            payin_method: payinMethod,
            payout_method: payoutMethod,
            http_status: fetchResult.status,
            reason,
            rate_limited: rateLimited,
            rate_limit_retry: rateLimitRetries,
          })
          await insertAttempt(pool, providerId, {
            corridorId,
            amountBucket,
            payinMethod,
            payoutMethod,
            success: false,
            errorType: rateLimited ? 'rate_limit' : 'blocked',
            httpStatus: fetchResult.status,
            errorMessage: reason,
            bronzeObjectKey,
            requestFingerprint,
          })
          const alertId = await insertOpsAlert(pool, providerId, {
            corridorId,
            amountBucket,
            payinMethod,
            payoutMethod,
            httpStatus: fetchResult.status,
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
          if (fetchResult.status === 429 || fetchResult.status === 403) {
            const reasonLabel = fetchResult.status === 429 ? 'rate_limit' : 'http_403'
            await openCircuit(pool, providerId, corridorId, reasonLabel, config.planeB.circuitOpenMs)
            const penalized = await penalizeRpmImmediately(pool, providerId, currentRates, 0.5)
            if (penalized) {
              currentRates = penalized
              providerRates.rpm = penalized.rpm
              providerRates.perCorridorRpm = penalized.perCorridorRpm
              scheduler.updateRates(penalized.rpm, penalized.perCorridorRpm)
            }
            logger.error('circuit_opened_immediate', {
              provider_id: providerId,
              corridor_id: corridorId,
              http_status: fetchResult.status,
              at: new Date().toISOString(),
            })
          }
          if (rateLimited && rateLimitRetries < Math.max(rateLimitMaxRetries, 0)) {
            const attemptDurationMs = recordAttemptDuration(attemptStartedAt)
            rateLimitRetries += 1
            logger.info('rate_limit_backoff', {
              trace_id: traceId,
              corridor_id: corridorId,
              amount_bucket: amountBucket,
              retry: rateLimitRetries,
              max_retries: rateLimitMaxRetries,
              attempt_duration_ms: attemptDurationMs,
            })
            await sleepRateLimit()
            continue
          }

          if (rateLimited) {
            const attemptDurationMs = recordAttemptDuration(attemptStartedAt)
            logger.info('quote_attempt_finish', {
              trace_id: traceId,
              status: 'rate_limit',
              stage: 'block_detection',
              total_duration_ms: attemptDurationMs,
              fetch_duration_ms: fetchDurationMs,
              bronze_duration_ms: bronzeDurationMs,
            })
            completed = true
            continue
          }

          await pauseProviderForBlock(pool, providerId, corridorId, reason, blockCooldownMs)
          blocked = true
          blockReason = reason
          const attemptDurationMs = recordAttemptDuration(attemptStartedAt)
          logger.info('quote_attempt_finish', {
            trace_id: traceId,
            status: 'blocked',
            stage: 'block_detection',
            total_duration_ms: attemptDurationMs,
            fetch_duration_ms: fetchDurationMs,
            bronze_duration_ms: bronzeDurationMs,
          })
          completed = true
          continue
        }

        if (fetchResult.status !== 200 || !fetchResult.payload || typeof fetchResult.payload !== 'object') {
          logger.warn('quote_fetch_non_200', {
            trace_id: traceId,
            corridor_id: corridorId,
            amount_bucket: amountBucket,
            payin_method: payinMethod,
            payout_method: payoutMethod,
            http_status: fetchResult.status,
          })
          if (fetchResult.status === 400) {
            await markCorridorUnsupported(pool, providerId, corridorId, 'auto_http_400')
            logger.warn('corridor_marked_unsupported', {
              trace_id: traceId,
              corridor_id: corridorId,
              provider_id: providerId,
              http_status: fetchResult.status,
            })
            skipCorridor = true
          }
          await insertAttempt(pool, providerId, {
            corridorId,
            amountBucket,
            payinMethod,
            payoutMethod,
            success: false,
            errorType: 'http_error',
            httpStatus: fetchResult.status,
            errorMessage: 'non_200_response',
            bronzeObjectKey,
            requestFingerprint,
          })
          const attemptDurationMs = recordAttemptDuration(attemptStartedAt)
          logger.info('quote_attempt_finish', {
            trace_id: traceId,
            status: 'error',
            stage: 'http',
            total_duration_ms: attemptDurationMs,
            fetch_duration_ms: fetchDurationMs,
            bronze_duration_ms: bronzeDurationMs,
          })
          completed = true
          continue
        }

        if (!capabilityUpdated.has(corridorId)) {
          await upsertCapability(pool, corridorId, fetchResult.payload as Record<string, unknown>)
          capabilityUpdated.add(corridorId)
        }

        const parseStartedAt = Date.now()
        const parsed = parseWesternUnionPayload(fetchResult.payload as Record<string, unknown>, request)
        parseDurationMs = Date.now() - parseStartedAt
        if (!parsed) {
          const payload = fetchResult.payload as {
            response_status?: { status?: number | string | null; message?: string | null } | null
            services_groups?: Array<{ pay_groups?: Array<unknown> | null }> | null
            available_funds_in?: string | null
            sender?: { funds_in?: string | null } | null
          }
          const statusValue = payload.response_status?.status
          const statusNumber = statusValue === null || statusValue === undefined ? null : Number(statusValue)
          const serviceGroups = payload.services_groups ?? []
          const payGroupCount = serviceGroups.reduce((count, group) => {
            const payGroups = group.pay_groups ?? []
            return count + (Array.isArray(payGroups) ? payGroups.length : 0)
          }, 0)
          const parseFailureReason = Number.isFinite(statusNumber) && statusNumber !== 0
            ? `response_status_${statusNumber}`
            : serviceGroups.length === 0
              ? 'no_service_groups'
              : payGroupCount === 0
                ? 'no_pay_groups'
                : 'unknown'
          logger.warn('quote_parse_failed', {
            trace_id: traceId,
            corridor_id: corridorId,
            amount_bucket: amountBucket,
            payin_method: payinMethod,
            payout_method: payoutMethod,
            duration_ms: parseDurationMs,
            parse_failure_reason: parseFailureReason,
            response_status: payload.response_status?.status ?? null,
            response_message: payload.response_status?.message ?? null,
            available_funds_in: payload.available_funds_in ?? null,
            sender_funds_in: payload.sender?.funds_in ?? null,
            service_group_count: serviceGroups.length,
            pay_group_count: payGroupCount,
          })
          await insertAttempt(pool, providerId, {
            corridorId,
            amountBucket,
            payinMethod,
            payoutMethod,
            success: false,
            errorType: 'parse_error',
            httpStatus: fetchResult.status,
            errorMessage: `parse_failed:${parseFailureReason}`,
            bronzeObjectKey,
            requestFingerprint,
          })
          const attemptDurationMs = recordAttemptDuration(attemptStartedAt)
          logger.info('quote_attempt_finish', {
            trace_id: traceId,
            status: 'error',
            stage: 'parse',
            total_duration_ms: attemptDurationMs,
            fetch_duration_ms: fetchDurationMs,
            bronze_duration_ms: bronzeDurationMs,
            parse_duration_ms: parseDurationMs,
          })
          completed = true
          continue
        }

        logger.debug('quote_parse_ok', {
          trace_id: traceId,
          corridor_id: corridorId,
          amount_bucket: amountBucket,
          parse_flags: parsed.parse_flags,
          duration_ms: parseDurationMs,
        })

        const normalizeStartedAt = Date.now()
        const normalized = normalizeQuote({
          provider_id: providerId,
          corridor_id: corridorId,
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
        normalizeDurationMs = Date.now() - normalizeStartedAt
        logger.debug('quote_normalize_ok', {
          trace_id: traceId,
          corridor_id: corridorId,
          amount_bucket: normalized.amount_bucket,
          quality_flags: normalized.quality_flags,
          duration_ms: normalizeDurationMs,
        })

        const persistStartedAt = Date.now()
        await persistNormalizedQuote(pool, normalized)
        persistDurationMs = Date.now() - persistStartedAt
        const anomaly = await runAnomalyDetection({
          pool,
          providerId,
          corridorId,
          currentRate: normalized.implied_fx_rate,
          collectorType,
        })
        if (anomaly?.detected) {
          await dispatchSignal(pool, corridorId, providerId, anomaly)
        }
        logger.debug('quote_persisted', {
          trace_id: traceId,
          corridor_id: corridorId,
          amount_bucket: amountBucket,
          payin_method: payinMethod,
          payout_method: payoutMethod,
          receive_amount: normalized.receive_amount,
          implied_fx_rate: normalized.implied_fx_rate,
          duration_ms: persistDurationMs,
        })
        await insertAttempt(pool, providerId, {
          corridorId,
          amountBucket,
          payinMethod,
          payoutMethod,
          success: true,
          httpStatus: fetchResult.status,
          bronzeObjectKey,
          requestFingerprint,
        })
        successCount += 1
        if (isHalfOpen) {
          await closeCircuit(pool, providerId, corridorId)
          await closeCircuit(pool, providerId, null)
        }

        decayRateLimitPenalty()
        const attemptDurationMs = recordAttemptDuration(attemptStartedAt)
        logger.info('quote_attempt_finish', {
          trace_id: traceId,
          status: 'success',
          total_duration_ms: attemptDurationMs,
          fetch_duration_ms: fetchDurationMs,
          bronze_duration_ms: bronzeDurationMs,
          parse_duration_ms: parseDurationMs,
          normalize_duration_ms: normalizeDurationMs,
          persist_duration_ms: persistDurationMs,
        })
        completed = true
      }
    }

    if (blocked) {
      break
    }

    await sleepBetweenCorridors()
  }

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

  logger.info('collector_finish', {
    ingestion_run_id: ingestionRunId,
    status: blocked ? 'blocked' : 'success',
    block_reason: blockReason,
    freshness_checked: freshnessChecked,
    freshness_skipped: freshnessSkipped,
    freshness_stale: freshnessStale,
  })

  return !blocked
}
