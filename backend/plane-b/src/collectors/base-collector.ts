import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { createHash } from 'node:crypto'
import { createPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { formatError } from '../../../shared/utils/error-handling'
import type { FetchResult, CollectorRequest } from './types'
import type { NormalizedQuote } from '../normalize/quote-normalizer'
import {
  ensureProvider,
  ensureCorridor,
  insertAttempt,
  insertOpsAlert,
  persistNormalizedQuote,
  runAnomalyDetection,
  resumeProviderIfCooldownExpired,
  loadUnsupportedCorridors,
  pauseProviderForBlock,
  createIngestionRun,
  finishIngestionRun,
} from './base'
import { detectBlock } from './block-detection'
import { notifyBlockAlert } from './alert-routing'
import { resolveProviderRates } from './rate-config'
import { writeBronzePayload } from './bronze-writer'
import { createScheduler, type Scheduler } from './scheduler'
import { resolveRateLimitScope } from './rate-limit-scope'
import { checkCircuitState, penalizeRpmImmediately } from '../lib/redis-circuit-breaker'
import { getDefaultProxyTierForCollector, getProxyTierForCorridor, type ProxyTier } from '../lib/proxy-router'
import { LatestQuoteRepository } from '../repositories'
import { saveCheckpoint, loadCheckpoint, clearCheckpoint } from './checkpoint'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Abstract base class for provider collectors.
 * 
 * Extracts all common collector logic (rate limiting, circuit breaking, persistence, etc.)
 * so provider-specific collectors only need to implement fetch/parse methods.
 * 
 * @example
 * ```typescript
 * class RemitlyCollector extends BaseCollector {
 *   protected async fetchQuote(request: CollectorRequest, options: FetchOptions): Promise<FetchResult> {
 *     // Provider-specific fetch logic
 *   }
 *   
 *   protected parsePayload(payload: unknown, request: CollectorRequest): NormalizedQuote | null {
 *     // Provider-specific parse logic
 *   }
 * }
 * ```
 */
export abstract class BaseCollector {
  protected readonly providerId: string
  protected readonly displayName: string
  protected readonly pool: Pool
  protected readonly shouldClose: boolean
  protected readonly logger: ReturnType<typeof createLogger>

  protected corridors: string[] = []
  protected buckets: number[] = []
  protected payinMethod: string = 'bank_transfer'
  protected payoutMethod: string = 'bank_deposit'
  protected locale: string = 'en-US'
  protected collectorType: string = 'collector'
  protected freshnessSloMinutes: number = 30
  protected freshnessSloEnabled: boolean = false
  protected blockCooldownMs: number = 3600000

  protected scheduler: Scheduler | null = null
  protected currentRates = { rpm: 0, perCorridorRpm: 0 }
  protected extraDelayMs = 0
  protected extraJitterMs = 0
  protected proxyTierCache = new Map<string, ProxyTier>()
  protected defaultProxyTier: ProxyTier = 'NONE'

  protected startedAt: Date = new Date()
  protected ingestionRunId: string = ''
  protected attemptCount = 0
  protected successCount = 0
  protected blockCount = 0
  protected rateLimitCount = 0
  protected http2xxCount = 0
  protected attemptDurationMsTotal = 0
  protected freshnessChecked = 0
  protected freshnessSkipped = 0
  protected freshnessStale = 0

  protected delayMs: number = 0
  protected jitterMs: number = 0
  protected rateLimitBackoffMs: number = 5000
  protected rateLimitJitterMs: number = 2000
  protected rateLimitMaxRetries: number = 3
  protected corridorDelayMs: number = 0
  protected corridorJitterMs: number = 0

  constructor(
    providerId: string,
    displayName: string,
    options: BaseCollectorOptions = {},
  ) {
    this.providerId = providerId
    this.displayName = displayName
    this.logger = createLogger(`plane-b.collectors.${this.providerId}`)
    this.pool = options.pool ?? createPool(config.db.planeBUrl)
    this.shouldClose = !options.pool
  }

  /**
   * Provider-specific fetch implementation.
   * Must be implemented by each provider collector.
   */
  protected abstract fetchQuote(
    request: CollectorRequest,
    options: { jitterMs: number; proxyTier: ProxyTier },
  ): Promise<FetchResult>

  /**
   * Provider-specific parse implementation.
   * Must be implemented by each provider collector.
   */
  protected abstract parsePayload(
    payload: unknown,
    request: CollectorRequest,
  ): NormalizedQuote | null

  /**
   * Provider-specific method pair extraction.
   * Optional - defaults to using request payin/payout methods.
   */
  protected extractMethodPairs?(
    payload: unknown,
    request: CollectorRequest,
  ): Array<{ payin: string; payout: string }>

  /**
   * Main collection orchestration method.
   * Handles all common logic: rate limiting, circuit breaking, persistence, etc.
   */
  async collect(options: CollectorRunOptions = {}): Promise<boolean> {
    try {
      // Initialize configuration
      await this.initialize(options)

      // Ensure provider exists
      await ensureProvider(this.pool, this.providerId, this.displayName)

      // Check if provider can collect
      const resumeStatus = await resumeProviderIfCooldownExpired(this.pool, this.providerId)
      if (!resumeStatus.canCollect) {
        this.logger.warn('collector_paused', { reason: resumeStatus.reason })
        return false
      }

      // Check circuit breaker
      const providerCircuitState = await checkCircuitState(this.pool, this.providerId, null)
      if (providerCircuitState === 'open') {
        this.logger.warn('collector_circuit_open', { scope: 'provider' })
        await finishIngestionRun(this.pool, this.ingestionRunId, 'blocked', 'circuit_open')
        return false
      }

      // Load checkpoint if resuming
      const checkpoint = await loadCheckpoint(
        this.pool,
        this.providerId,
        this.collectorType,
        this.ingestionRunId,
      )

      // Main collection loop
      let blocked = false
      let blockReason: string | null = null
      const unsupportedCorridors = await loadUnsupportedCorridors(this.pool, this.providerId)
      for (const corridorId of this.corridors) {
        if (checkpoint && checkpoint.completedCorridors.includes(corridorId)) {
          this.logger.debug('checkpoint_skip_corridor', { corridor_id: corridorId })
          continue
        }

        if (checkpoint && checkpoint.lastCorridorId === corridorId) {
          // Resume from last bucket in this corridor
          const resumeFromBucket = checkpoint.lastAmountBucket ?? this.buckets[0]
          const bucketIndex = this.buckets.indexOf(resumeFromBucket)
          if (bucketIndex >= 0) {
            this.buckets = this.buckets.slice(bucketIndex)
          }
        }

        await ensureCorridor(this.pool, corridorId)
        const proxyTier = await this.resolveProxyTier(corridorId)

        if (unsupportedCorridors.has(corridorId)) {
          this.logger.debug('corridor_unsupported_skip', { corridor_id: corridorId })
          continue
        }

        for (const amountBucket of this.buckets) {
          if (blocked) break

          // Freshness SLO check
          if (this.shouldApplyFreshnessSlo()) {
            const ageMinutes = await this.getLatestQuoteAgeMinutes(
              corridorId,
              amountBucket,
              this.payinMethod,
              this.payoutMethod,
            )
            if (ageMinutes !== null && ageMinutes <= this.freshnessSloMinutes) {
              this.freshnessSkipped += 1
              continue
            }
            this.freshnessStale += 1
          }

          // Circuit breaker check
          const circuitState = await checkCircuitState(this.pool, this.providerId, corridorId)
          if (circuitState === 'open') {
            continue
          }

          // Rate limiting
          await this.scheduler?.waitForSlot(corridorId, this.extraDelayMs, this.extraJitterMs)

          // Attempt collection
          const success = await this.attemptCollection(
            corridorId,
            amountBucket,
            proxyTier,
          )

          if (!success) {
            blocked = true
            blockReason = 'collection_failed'
            break
          }

          // Save checkpoint periodically (every 10 corridors)
          if (this.attemptCount % 10 === 0) {
            await saveCheckpoint(this.pool, {
              providerId: this.providerId,
              collectorType: this.collectorType,
              ingestionRunId: this.ingestionRunId,
              lastCorridorId: corridorId,
              lastAmountBucket: amountBucket,
              completedCorridors: this.corridors.slice(0, this.corridors.indexOf(corridorId) + 1),
              startedAt: this.startedAt,
              lastUpdatedAt: new Date(),
            })
          }

          // Corridor delay
          await this.sleepBetweenCorridors()
        }
      }

      // Finish ingestion run
      const finalStatus = blocked ? 'blocked' : 'success'
      await finishIngestionRun(this.pool, this.ingestionRunId, finalStatus, blockReason)

      // Clear checkpoint on success
      if (!blocked) {
        await clearCheckpoint(this.pool, this.providerId, this.collectorType, this.ingestionRunId)
      }

      // Log summary
      this.logSummary()

      return !blocked
    } catch (error: unknown) {
      const { message, stack } = formatError(error)
      this.logger.error('collector_failed', {
        provider_id: this.providerId,
        error: message,
        stack,
      })
      await finishIngestionRun(this.pool, this.ingestionRunId, 'error', 'exception')
      throw error
    } finally {
      if (this.shouldClose) {
        await this.pool.end()
      }
      this.scheduler?.cleanup()
    }
  }

  /**
   * Initializes collector configuration and creates ingestion run.
   */
  protected async initialize(options: CollectorRunOptions): Promise<void> {
    // Set options
    this.corridors = options.corridors ?? []
    this.buckets = options.amountBuckets ?? []
    this.payinMethod = options.payinMethod ?? 'bank_transfer'
    this.payoutMethod = options.payoutMethod ?? 'bank_deposit'
    this.locale = options.locale ?? 'en-US'
    this.collectorType = options.collectorType ?? 'collector'
    this.freshnessSloMinutes = options.freshnessSloMinutes ?? 30
    this.freshnessSloEnabled = options.freshnessSloEnabled ?? false

    // Resolve rate limits
    const providerRates = await resolveProviderRates(
      this.pool,
      this.providerId,
      { rpm: options.defaultRpm ?? 100, perCorridorRpm: options.defaultPerCorridorRpm ?? 10 },
      { rpm: options.rpmOverride, perCorridorRpm: options.perCorridorRpmOverride },
    )
    this.currentRates = {
      rpm: providerRates.rpm,
      perCorridorRpm: providerRates.perCorridorRpm,
    }

    // Create scheduler
    this.scheduler = createScheduler({
      providerId: this.providerId,
      rpm: this.currentRates.rpm,
      perCorridorRpm: this.currentRates.perCorridorRpm,
      baseDelayMs: this.delayMs,
      jitterMs: this.jitterMs,
      globalEnabled: Boolean(config.redis.url),
      locale: this.locale,
      perLocale: options.perLocale ?? false,
      scope: resolveRateLimitScope(this.collectorType),
    })

    // Create ingestion run
    this.ingestionRunId = await createIngestionRun(
      this.pool,
      this.providerId,
      this.collectorType,
      this.startedAt,
    )

    this.defaultProxyTier = getDefaultProxyTierForCollector(this.collectorType)

    this.logger.info('collector_start', {
      ingestion_run_id: this.ingestionRunId,
      collector_type: this.collectorType,
      corridor_count: this.corridors.length,
      bucket_count: this.buckets.length,
      rpm: this.currentRates.rpm,
      per_corridor_rpm: this.currentRates.perCorridorRpm,
    })
  }

  /**
   * Attempts to collect a single quote.
   */
  protected async attemptCollection(
    corridorId: string,
    amountBucket: number,
    proxyTier: ProxyTier,
  ): Promise<boolean> {
    const traceId = randomUUID()
    const attemptStartedAt = Date.now()
    const requestFingerprint = createHash('sha256')
      .update(`${corridorId}:${amountBucket}:${this.payinMethod}:${this.payoutMethod}`)
      .digest('hex')

    const request: CollectorRequest = {
      provider_id: this.providerId,
      corridor_id: corridorId,
      amount_bucket: amountBucket,
      payin_method: this.payinMethod,
      payout_method: this.payoutMethod,
      send_amount: amountBucket,
      locale: this.locale,
    }

    this.attemptCount += 1

    try {
      // Fetch quote
      const fetchResult = await this.fetchQuote(request, {
        jitterMs: this.jitterMs,
        proxyTier,
      })

      if (fetchResult.status >= 200 && fetchResult.status < 300) {
        this.http2xxCount += 1
      }

      // Write bronze payload
      const payload = fetchResult.payload ?? fetchResult.bodyText
      const bronzeId = await writeBronzePayload(this.pool, {
        provider_id: this.providerId,
        corridor_id: corridorId,
        amount_bucket: request.amount_bucket,
        payin_method: request.payin_method,
        payout_method: request.payout_method,
        payload,
      })

      // Detect blocks
      const blockResult = detectBlock(fetchResult.status, fetchResult.bodyText)
      if (blockResult.blocked) {
        this.blockCount += 1
        await this.handleBlock(
          corridorId,
          amountBucket,
          blockResult.reason,
          fetchResult.status,
          bronzeId,
          traceId,
          requestFingerprint,
        )
        return false
      }

      // Parse payload
      const normalized = this.parsePayload(payload, request)
      if (!normalized) {
        await insertAttempt(this.pool, this.providerId, {
          corridorId,
          amountBucket,
          payinMethod: this.payinMethod,
          payoutMethod: this.payoutMethod,
          success: false,
          errorType: 'parse_error',
          httpStatus: fetchResult.status,
          requestFingerprint,
        })
        return true // Continue even if parse fails
      }

      // Persist quote
      await persistNormalizedQuote(this.pool, normalized, this.collectorType)

      // Anomaly detection
      if (this.isTier1Collector()) {
        await runAnomalyDetection({
          pool: this.pool,
          providerId: this.providerId,
          corridorId,
          currentRate: normalized.implied_fx_rate,
          collectorType: this.collectorType,
        })
      }

      this.successCount += 1
      this.decayRateLimitPenalty()

      const attemptDurationMs = Date.now() - attemptStartedAt
      this.attemptDurationMsTotal += attemptDurationMs

      return true
    } catch (error: unknown) {
      const { message } = formatError(error)
      await insertAttempt(this.pool, this.providerId, {
        corridorId,
        amountBucket,
        payinMethod: this.payinMethod,
        payoutMethod: this.payoutMethod,
        success: false,
        errorType: 'network_error',
        httpStatus: null,
        errorMessage: message,
        requestFingerprint,
      })
      return true // Continue on error
    }
  }

  /**
   * Handles block detection.
   */
  protected async handleBlock(
    corridorId: string,
    amountBucket: number,
    reason: string | null,
    httpStatus: number | null,
    bronzeId: number | null,
    traceId: string,
    requestFingerprint: string,
  ): Promise<void> {
    const isRateLimit = reason === 'http_429' || reason === 'keyword_too_many_requests'

    if (isRateLimit) {
      this.rateLimitCount += 1
      this.applyRateLimitPenalty()
      const penalized = await penalizeRpmImmediately(
        this.pool,
        this.providerId,
        this.currentRates,
        0.5,
      )
      if (penalized) {
        this.currentRates = penalized
        this.scheduler?.updateRates(penalized.rpm, penalized.perCorridorRpm)
      }
    }

    await insertOpsAlert(this.pool, this.providerId, {
      corridorId,
      amountBucket,
      payinMethod: this.payinMethod,
      payoutMethod: this.payoutMethod,
      httpStatus,
      blockReason: reason,
      bronzeObjectKey: bronzeId ? String(bronzeId) : null,
      collectorType: this.collectorType,
      traceId,
      requestFingerprint,
    })

    if (reason) {
      await pauseProviderForBlock(
        this.pool,
        this.providerId,
        corridorId,
        reason,
        this.blockCooldownMs,
      )
    }

    await notifyBlockAlert(this.pool, String(bronzeId), { force: false })
  }

  /**
   * Resolves proxy tier for a corridor.
   */
  protected async resolveProxyTier(corridorId: string): Promise<ProxyTier> {
    if (this.proxyTierCache.has(corridorId)) {
      return this.proxyTierCache.get(corridorId)!
    }
    const proxyTier = await getProxyTierForCorridor(this.pool, corridorId, this.defaultProxyTier)
    this.proxyTierCache.set(corridorId, proxyTier)
    return proxyTier
  }

  /**
   * Gets latest quote age in minutes.
   */
  protected async getLatestQuoteAgeMinutes(
    corridorId: string,
    amountBucket: number,
    payinMethod: string,
    payoutMethod: string,
  ): Promise<number | null> {
    try {
      const repo = new LatestQuoteRepository(this.pool)
      return await repo.getLatestQuoteAgeMinutes(
        this.providerId,
        corridorId,
        amountBucket,
        payinMethod,
        payoutMethod,
      )
    } catch (error) {
      this.logger.debug('latest_quote_age_lookup_failed', {
        provider_id: this.providerId,
        corridor_id: corridorId,
        amount_bucket: amountBucket,
        payin_method: payinMethod,
        payout_method: payoutMethod,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  /**
   * Checks if freshness SLO should be applied.
   */
  protected shouldApplyFreshnessSlo(): boolean {
    return (
      this.freshnessSloEnabled &&
      (this.collectorType === 'collector' ||
        this.collectorType.startsWith('b2b_'))
    )
  }

  /**
   * Checks if this is a tier 1 collector.
   */
  protected isTier1Collector(): boolean {
    return this.collectorType === 'b2b_tier_1' || this.collectorType === 'b2b_tier_1_alpha'
  }

  /**
   * Applies rate limit penalty.
   */
  protected applyRateLimitPenalty(): void {
    this.extraDelayMs = Math.min(
      this.extraDelayMs + this.rateLimitBackoffMs,
      this.rateLimitBackoffMs * 3,
    )
    this.extraJitterMs = Math.min(
      this.extraJitterMs + this.rateLimitJitterMs,
      this.rateLimitJitterMs * 3,
    )
  }

  /**
   * Decays rate limit penalty.
   */
  protected decayRateLimitPenalty(): void {
    this.extraDelayMs = Math.max(0, Math.floor(this.extraDelayMs * 0.7))
    this.extraJitterMs = Math.max(0, Math.floor(this.extraJitterMs * 0.7))
  }

  /**
   * Sleeps between corridors.
   */
  protected async sleepBetweenCorridors(): Promise<void> {
    if (this.corridorDelayMs <= 0 && this.corridorJitterMs <= 0) return
    const jitter = this.corridorJitterMs > 0 ? Math.floor(Math.random() * this.corridorJitterMs) : 0
    await sleep(this.corridorDelayMs + jitter)
  }

  /**
   * Logs collection summary.
   */
  protected logSummary(): void {
    const durationSeconds = (Date.now() - this.startedAt.getTime()) / 1000
    const avgAttemptMs = this.attemptCount > 0 ? this.attemptDurationMsTotal / this.attemptCount : 0

    this.logger.info('collector_finish', {
      ingestion_run_id: this.ingestionRunId,
      duration_seconds: Math.round(durationSeconds),
      attempt_count: this.attemptCount,
      success_count: this.successCount,
      block_count: this.blockCount,
      rate_limit_count: this.rateLimitCount,
      http_2xx_count: this.http2xxCount,
      avg_attempt_ms: Math.round(avgAttemptMs),
      freshness_checked: this.freshnessChecked,
      freshness_skipped: this.freshnessSkipped,
      freshness_stale: this.freshnessStale,
    })
  }
}

export type BaseCollectorOptions = {
  pool?: Pool
}

export type CollectorRunOptions = {
  corridors?: string[]
  amountBuckets?: number[]
  payinMethod?: string
  payoutMethod?: string
  locale?: string
  collectorType?: string
  freshnessSloMinutes?: number
  freshnessSloEnabled?: boolean
  rpmOverride?: number
  perCorridorRpmOverride?: number
  defaultRpm?: number
  defaultPerCorridorRpm?: number
  perLocale?: boolean
}

export type FetchOptions = {
  jitterMs: number
  proxyTier: ProxyTier
}
