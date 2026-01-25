import { createHash, randomUUID } from 'node:crypto'
import type { Pool } from 'pg'

import { createPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { getRedisClient } from '../../../../shared/redis'
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
import { PLACID_SUPPORTED_CORRIDORS } from './supported-corridors'
import { httpLimits } from './limits'
import { fetchPlacidQuote, fetchPlacidSessionCookie } from './fetch'
import { extractPlacidMethodPairs, parsePlacidPayload, type PlacidPayload } from './parse'

type PlacidCollectorOptions = {
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
const logger = createLogger('plane-b.placid.collector')

const normalizeProxyTier = (value: unknown): ProxyTier | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? (trimmed as ProxyTier) : null
}

const upsertCapability = async (
  pool: Pool,
  corridorId: string,
  payload: PlacidPayload,
) => {
  const pairs = extractPlacidMethodPairs(payload)
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
    providerId: 'placid',
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

export const runPlacidCollector = async (options: PlacidCollectorOptions = {}) => {
  const providerId = 'placid'
  const pool = options.pool ?? createPool(config.db.planeBUrl)
  const shouldClose = options.closePool ?? !options.pool
  let corridors: string[]

  if (options.corridors?.length) {
    corridors = options.corridors
  } else {
    const allPossibleCorridors = PLACID_SUPPORTED_CORRIDORS
    const unsupportedCorridors = await loadUnsupportedCorridors(pool, providerId)
    corridors = allPossibleCorridors.filter(
      corridor => !unsupportedCorridors.has(corridor),
    )
  }
  const buckets = options.amountBuckets ?? defaultAmountBuckets
  const payinMethod = options.payinMethod ?? 'debit_card'
  const payoutMethod = options.payoutMethod ?? 'bank_deposit'
  const locale = options.locale ?? 'en-US'
  const delayMs = options.delayMs ?? config.planeB.placid.delayMs
  const jitterMs = options.jitterMs ?? config.planeB.placid.jitterMs
  const rateLimitBackoffMs = options.rateLimitBackoffMs ?? config.planeB.placid.rateLimitBackoffMs
  const rateLimitJitterMs = options.rateLimitJitterMs ?? config.planeB.placid.rateLimitJitterMs
  const rateLimitMaxRetries = options.rateLimitMaxRetries ?? config.planeB.placid.rateLimitMaxRetries
  const corridorDelayMs = options.corridorDelayMs ?? config.planeB.placid.corridorDelayMs
  const corridorJitterMs = options.corridorJitterMs ?? config.planeB.placid.corridorJitterMs
  const collectorType = options.collectorType ?? 'collector'
  const freshnessSloMinutes = options.freshnessSloMinutes ?? config.planeB.placid.freshnessSloMinutes
  const freshnessSloEnabled = options.freshnessSloEnabled ?? config.planeB.placid.freshnessSloEnabled
  const blockCooldownMs = config.planeB.placid.blockCooldownMs
  const proxyTierOverride = normalizeProxyTier(config.planeB.placid.proxyTier)
  const proxyTierFallback = normalizeProxyTier(config.planeB.placid.proxyTierFallback)
  const sessionWarmupUrl = (config.planeB.placid.sessionWarmupUrl || '').trim()
  const sessionTtlMs = Math.max(0, config.planeB.placid.sessionTtlMs ?? 0)
  const sessionCookieRequired = Boolean(sessionWarmupUrl)
  const sessionSeedCookie = (config.planeB.placid.sessionCookie || '').trim()
  const sessionTtlSeconds = sessionTtlMs > 0 ? Math.max(1, Math.floor(sessionTtlMs / 1000)) : 0
  const sessionCookieCache = new Map<string, { value: string; expiresAt: number }>()
  const sessionRefreshAttempts = new Map<string, number>()
  const sessionRefreshForced = new Set<string>()
  const redisClient = await getRedisClient()
  const sessionRefreshCooldownMs = 5 * 60 * 1000
  const startedAt = new Date()
  const capabilityUpdated = new Set<string>()
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
    || collectorType === 'b2b_tier_1'
    || collectorType === 'b2b_tier_2'
    
  const shouldApplyFreshnessSlo = freshnessSloEnabled && isScheduledSweep
  const baseProxyTier = getDefaultProxyTierForCollector(collectorType)
  const defaultProxyTier = proxyTierOverride
    ?? (baseProxyTier === 'NONE' ? 'DATACENTER_ROTATING' : baseProxyTier)
  const proxyTierCache = new Map<string, ProxyTier>()
  const resolveProxyTier = async (corridorId: string) => {
    if (proxyTierCache.has(corridorId)) {
      return proxyTierCache.get(corridorId) as ProxyTier
    }
    const proxyTier = await getProxyTierForCorridor(pool, corridorId, defaultProxyTier)
    proxyTierCache.set(corridorId, proxyTier)
    return proxyTier
  }

  const getSessionCacheKey = (corridorId: string) => `session_cookie:${providerId}:${corridorId}`
  const resolveSessionExpiry = () =>
    sessionTtlMs > 0 ? Date.now() + sessionTtlMs : Number.MAX_SAFE_INTEGER

  const cacheSessionCookie = async (corridorId: string, cookie: string) => {
    if (!cookie) return
    sessionCookieCache.set(corridorId, { value: cookie, expiresAt: resolveSessionExpiry() })
    if (!redisClient) return
    try {
      const key = getSessionCacheKey(corridorId)
      if (sessionTtlSeconds > 0) {
        await redisClient.set(key, cookie, { EX: sessionTtlSeconds })
      } else {
        await redisClient.set(key, cookie)
      }
    } catch (error) {
      logger.warn('session_cookie_cache_write_failed', {
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const loadSessionCookieFromCache = async (corridorId: string, allowSeed: boolean) => {
    const cached = sessionCookieCache.get(corridorId)
    if (cached) {
      if (sessionTtlMs === 0 || Date.now() < cached.expiresAt) {
        return cached.value
      }
      sessionCookieCache.delete(corridorId)
    }

    if (redisClient) {
      try {
        const stored = await redisClient.get(getSessionCacheKey(corridorId))
        if (stored) {
          sessionCookieCache.set(corridorId, { value: stored, expiresAt: resolveSessionExpiry() })
          return stored
        }
      } catch (error) {
        logger.warn('session_cookie_cache_read_failed', {
          corridor_id: corridorId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    if (allowSeed && sessionSeedCookie) {
      await cacheSessionCookie(corridorId, sessionSeedCookie)
      return sessionSeedCookie
    }

    return null
  }

  const refreshSessionCookie = async (corridorId: string, proxyTier: ProxyTier) => {
    if (!sessionWarmupUrl) return null
    sessionRefreshAttempts.set(corridorId, Date.now())
    try {
      const refreshed = await fetchPlacidSessionCookie({
        locale,
        corridorId,
        proxyTier,
        warmupUrl: sessionWarmupUrl,
      })
      if (refreshed) {
        await cacheSessionCookie(corridorId, refreshed)
      }
      return refreshed
    } catch (error) {
      logger.warn('session_refresh_failed', {
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  const resolveSessionCookie = async (
    corridorId: string,
    proxyTier: ProxyTier,
    forceRefresh = false,
  ) => {
    const cached = await loadSessionCookieFromCache(corridorId, !forceRefresh)
    if (cached && !forceRefresh) {
      return cached
    }
    if (!sessionWarmupUrl) {
      return forceRefresh ? null : cached
    }
    const lastAttempt = sessionRefreshAttempts.get(corridorId) ?? 0
    if (!forceRefresh && Date.now() - lastAttempt < sessionRefreshCooldownMs) {
      return cached
    }
    const refreshed = await refreshSessionCookie(corridorId, proxyTier)
    if (refreshed) {
      return refreshed
    }
    return forceRefresh ? null : cached
  }

  await ensureProvider(pool, providerId, 'Placid')
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
          logger.info('placid_corridor_skipped', {
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
          const ageMinutes = await getLatestQuoteAgeMinutes(
            pool,
            providerId,
            corridorId,
            amount,
            payinMethod,
            payoutMethod,
          )
          if (ageMinutes !== null && ageMinutes <= freshnessSloMinutes) {
            continue
          }
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
          logger.warn('placid_circuit_open', { corridor_id: corridorId })
          blocked = true
          blockReason = 'circuit_open'
          break
        }

        const proxyTier: ProxyTier = await resolveProxyTier(corridorId)
        const forceSessionRefresh = collectorType === 'health_probe'
          && !sessionRefreshForced.has(corridorId)
        let sessionCookieHeader = await resolveSessionCookie(
          corridorId,
          proxyTier,
          forceSessionRefresh,
        )
        if (forceSessionRefresh) {
          sessionRefreshForced.add(corridorId)
        }
        if (!sessionCookieHeader && proxyTierFallback && proxyTierFallback !== proxyTier) {
          sessionCookieHeader = await resolveSessionCookie(corridorId, proxyTierFallback, true)
          sessionRefreshForced.add(corridorId)
        }
        if (sessionCookieRequired && !sessionCookieHeader) {
          logger.warn('session_cookie_missing_skip', {
            corridor_id: corridorId,
            amount_bucket: amount,
            payin_method: payinMethod,
            payout_method: payoutMethod,
            proxy_tier: proxyTier,
          })
          await insertAttempt(pool, providerId, {
            corridorId,
            amountBucket: amount,
            payinMethod,
            payoutMethod,
            success: false,
            errorType: 'session_missing',
            httpStatus: null,
            errorMessage: 'session_cookie_missing',
            requestFingerprint,
          })
          const attemptDurationMs = recordAttemptDuration(attemptStartedAt)
          logger.info('quote_attempt_finish', {
            trace_id: traceId,
            status: 'session_missing',
            stage: 'session',
            total_duration_ms: attemptDurationMs,
          })
          continue
        }

        let responseStatus: number | null = null
        let responsePayload: PlacidPayload | null = null
        let responseText: string | null = null
        let attemptErrorType: string | null = null
        let attemptErrorMessage: string | null = null
        let bronzeObjectKey: string | null = null

        try {
          const runFetch = async (tier: ProxyTier, cookie: string | null, label: string) => {
            const response = await fetchPlacidQuote(request, {
              proxyTier: tier,
              jitterMs,
              cookie: cookie || undefined,
            })
            logger.debug('quote_fetch_result', {
              trace_id: traceId,
              corridor_id: corridorId,
              amount_bucket: amount,
              payin_method: payinMethod,
              payout_method: payoutMethod,
              http_status: response.status,
              attempt: label,
              proxy_tier: tier,
            })
            return response
          }

          let response = await runFetch(proxyTier, sessionCookieHeader, 'primary')
          responseStatus = response.status
          responseText = response.bodyText
          responsePayload = response.payload ?? null

          if (responseStatus === 403 && sessionWarmupUrl) {
            const refreshed = await refreshSessionCookie(corridorId, proxyTier)
            if (refreshed) {
              response = await runFetch(proxyTier, refreshed, 'session_refresh')
              responseStatus = response.status
              responseText = response.bodyText
              responsePayload = response.payload ?? null
            }
          }

          if (responseStatus === 403 && proxyTierFallback && proxyTierFallback !== proxyTier) {
            const fallbackCookie = await resolveSessionCookie(corridorId, proxyTierFallback, true)
            response = await runFetch(proxyTierFallback, fallbackCookie, 'proxy_fallback')
            responseStatus = response.status
            responseText = response.bodyText
            responsePayload = response.payload ?? null
            if (responseStatus >= 200 && responseStatus < 300) {
              proxyTierCache.set(corridorId, proxyTierFallback)
              logger.info('proxy_tier_fallback_used', {
                provider_id: providerId,
                corridor_id: corridorId,
                proxy_tier: proxyTierFallback,
              })
            }
          }
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
          logger.error('placid_fetch_failed', {
            corridor_id: corridorId,
            error: errorMessage,
          })
        }

        const parsed = !attemptErrorType && responsePayload
          ? parsePlacidPayload(responsePayload, request)
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
        await persistNormalizedQuote(pool, normalizedQuote, collectorType)
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

        if (isHalfOpen) {
          await closeCircuit(pool, providerId, corridorId)
          await closeCircuit(pool, providerId, null)
        }

        if (!capabilityUpdated.has(corridorId) && responsePayload) {
          await upsertCapability(pool, corridorId, responsePayload)
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

  return !blocked && (collectorType !== 'health_probe' || successCount > 0)
}
