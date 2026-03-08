import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { createHash } from 'node:crypto'
import { createPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { syncModuleRegistry } from '../../../shared/module-registry-sync'
import { getObservationSignalLayer } from '../../../shared/types/observation'
import { formatError } from '../../../shared/utils/error-handling'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import type { FetchResult, CollectorRequest } from './types'
import type { NormalizedQuote } from '../normalize/quote-normalizer'
import type { QualityFlag } from '../normalize/quality-flags'
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
import { sendJsonMessage } from '../../../shared/sqs'

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

  // ---------------------------------------------------------------------------
  // Adaptive cadence override state
  // ---------------------------------------------------------------------------

  /**
   * Active cadence overrides keyed by corridorId.
   * The stress responder (or other agents) push overrides here;
   * the collector checks before each corridor sweep.
   */
  private readonly cadenceOverrides = new Map<string, CadenceOverrideEntry>()

  /** Base (normal) collection interval in ms. Subclasses can adjust. */
  protected baseCollectionIntervalMs: number = 60_000

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

      // Load cadence overrides from the stress responder
      await this.loadCadenceOverrides()

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

        // Determine which buckets to collect for this corridor
        let corridorBuckets = this.buckets
        if (checkpoint && checkpoint.lastCorridorId === corridorId) {
          // Resume from last bucket in this corridor (use local copy to avoid mutating this.buckets)
          const resumeFromBucket = checkpoint.lastAmountBucket ?? this.buckets[0]
          const bucketIndex = this.buckets.indexOf(resumeFromBucket)
          if (bucketIndex >= 0) {
            corridorBuckets = this.buckets.slice(bucketIndex)
          }
        }

        await ensureCorridor(this.pool, corridorId)
        const proxyTier = await this.resolveProxyTier(corridorId)

        if (unsupportedCorridors.has(corridorId)) {
          this.logger.debug('corridor_unsupported_skip', { corridor_id: corridorId })
          continue
        }

        for (const amountBucket of corridorBuckets) {
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

          // Corridor delay (cadence-aware)
          await this.sleepBetweenCorridors(corridorId)
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

    await syncModuleRegistry(this.pool)

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
        await this.emitObservation({
          type: 'failure',
          corridorId,
          payload: {
            errorType: 'block_detected',
            errorMessage: `Block reason: ${blockResult.reason}`,
            httpStatus: fetchResult.status,
            blockReason: blockResult.reason,
            amountBucket,
            collectorType: this.collectorType,
          },
        })
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
        await this.emitObservation({
          type: 'failure',
          corridorId,
          payload: {
            errorType: 'parse_error',
            errorMessage: 'parsePayload returned null',
            httpStatus: fetchResult.status,
            amountBucket,
            collectorType: this.collectorType,
          },
        })
        return true // Continue even if parse fails
      }

      // Gate: never persist quotes flagged with parse_error
      if (normalized.quality_flags.includes('parse_error' as QualityFlag)) {
        this.logger.warn('quote_parse_error_skipped', {
          corridor_id: corridorId,
          amount_bucket: amountBucket,
          quality_flags: normalized.quality_flags,
        })
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
        return true
      }

      // Persist quote
      await persistNormalizedQuote(this.pool, normalized, this.collectorType)

      // Send to normalization queue for factor extraction
      if (config.queues.normalization.mode !== 'off' && config.queues.normalization.url) {
        sendJsonMessage(config.queues.normalization.url, {
          providerId: this.providerId,
          corridorId,
          amountBucket,
          rawPayload: typeof payload === 'object' ? payload : { raw: payload },
          collectorType: this.collectorType,
          collectedAt: new Date().toISOString(),
        }).catch((err) => {
          this.logger.debug('normalization_queue_send_failed', {
            error: err instanceof Error ? err.message : String(err),
          })
        })
      }

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
      await this.emitObservation({
        type: 'failure',
        corridorId,
        payload: {
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
          errorMessage: message,
          httpStatus: null,
          amountBucket,
          collectorType: this.collectorType,
        },
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
   *
   * When an active cadence override exists for the corridor, the delay
   * is adjusted proportionally: a faster override reduces the delay,
   * a slower override increases it.
   */
  protected async sleepBetweenCorridors(corridorId?: string): Promise<void> {
    let delay = this.corridorDelayMs
    let jitterBound = this.corridorJitterMs

    // Apply cadence override scaling if a corridorId is provided
    if (corridorId) {
      const effectiveInterval = this.getEffectiveIntervalMs(corridorId)
      if (effectiveInterval !== this.baseCollectionIntervalMs && this.baseCollectionIntervalMs > 0) {
        const ratio = effectiveInterval / this.baseCollectionIntervalMs
        delay = Math.round(delay * ratio)
        jitterBound = Math.round(jitterBound * ratio)
      }
    }

    if (delay <= 0 && jitterBound <= 0) return
    const jitter = jitterBound > 0 ? Math.floor(Math.random() * jitterBound) : 0
    await sleep(delay + jitter)
  }

  // ---------------------------------------------------------------------------
  // Adaptive cadence hooks — used by the stress responder to adjust frequency
  // ---------------------------------------------------------------------------

  /**
   * Apply a cadence override for a specific corridor.
   *
   * The override temporarily changes the collection interval for the corridor.
   * It automatically expires after the TTL specified by `ttlMs`.
   *
   * @param corridorId - Corridor to override
   * @param overrideIntervalMs - New collection interval (ms). Must be >= 5000.
   * @param ttlMs - How long the override stays active (ms). Must be > 0.
   * @param reason - Human-readable reason for observability
   */
  applyCadenceOverride(
    corridorId: string,
    overrideIntervalMs: number,
    ttlMs: number,
    reason: string,
  ): void {
    const clampedInterval = Math.max(5_000, overrideIntervalMs) // floor at 5s
    const clampedTtl = Math.max(1_000, ttlMs) // floor at 1s

    const entry: CadenceOverrideEntry = {
      corridorId,
      overrideIntervalMs: clampedInterval,
      originalIntervalMs: this.baseCollectionIntervalMs,
      expiresAt: new Date(Date.now() + clampedTtl).toISOString(),
      reason,
    }

    this.cadenceOverrides.set(corridorId, entry)

    this.logger.info('cadence_override_applied', {
      corridorId,
      overrideIntervalMs: clampedInterval,
      ttlMs: clampedTtl,
      reason,
    })
  }

  /**
   * Increase collection frequency for a corridor by a multiplier.
   *
   * Example: `increaseFrequency('USD-NGN', 2, 300_000, 'stress')` doubles
   * the collection speed (halves the interval) for 5 minutes.
   *
   * @param corridorId - Corridor to speed up
   * @param multiplier - How much faster (2 = twice as fast). Clamped to [1.1, 10].
   * @param ttlMs - Duration of the override in ms
   * @param reason - Why the frequency is being increased
   */
  increaseFrequency(
    corridorId: string,
    multiplier: number,
    ttlMs: number,
    reason: string,
  ): void {
    const clampedMultiplier = Math.max(1.1, Math.min(10, multiplier))
    const overrideIntervalMs = Math.round(this.baseCollectionIntervalMs / clampedMultiplier)
    this.applyCadenceOverride(corridorId, overrideIntervalMs, ttlMs, reason)
  }

  /**
   * Decrease collection frequency for a corridor by a multiplier.
   *
   * Example: `decreaseFrequency('USD-NGN', 2, 300_000, 'low_priority')` halves
   * the collection speed (doubles the interval) for 5 minutes.
   *
   * @param corridorId - Corridor to slow down
   * @param multiplier - How much slower (2 = half as fast). Clamped to [1.1, 10].
   * @param ttlMs - Duration of the override in ms
   * @param reason - Why the frequency is being decreased
   */
  decreaseFrequency(
    corridorId: string,
    multiplier: number,
    ttlMs: number,
    reason: string,
  ): void {
    const clampedMultiplier = Math.max(1.1, Math.min(10, multiplier))
    const overrideIntervalMs = Math.round(this.baseCollectionIntervalMs * clampedMultiplier)
    this.applyCadenceOverride(corridorId, overrideIntervalMs, ttlMs, reason)
  }

  /**
   * Remove the cadence override for a corridor, reverting to normal cadence.
   */
  clearCadenceOverride(corridorId: string): void {
    if (this.cadenceOverrides.delete(corridorId)) {
      this.logger.info('cadence_override_cleared', { corridorId })
    }
  }

  /**
   * Get the effective collection interval for a corridor.
   *
   * If an active (non-expired) override exists, returns the override interval.
   * Otherwise returns the base interval.
   *
   * Automatically cleans up expired overrides.
   */
  getEffectiveIntervalMs(corridorId: string): number {
    const override = this.cadenceOverrides.get(corridorId)
    if (!override) return this.baseCollectionIntervalMs

    // Check TTL expiry
    const now = Date.now()
    const expiresAt = new Date(override.expiresAt).getTime()
    if (now >= expiresAt) {
      // Override has expired — revert to normal
      this.cadenceOverrides.delete(corridorId)
      this.logger.debug('cadence_override_expired', {
        corridorId,
        reason: override.reason,
      })
      return this.baseCollectionIntervalMs
    }

    return override.overrideIntervalMs
  }

  /**
   * Purge all expired cadence overrides. Returns the number of overrides removed.
   *
   * This is called lazily via `getEffectiveIntervalMs` but can also be called
   * explicitly for batch cleanup.
   */
  purgeExpiredOverrides(): number {
    const now = Date.now()
    let purged = 0

    for (const [corridorId, override] of this.cadenceOverrides) {
      const expiresAt = new Date(override.expiresAt).getTime()
      if (now >= expiresAt) {
        this.cadenceOverrides.delete(corridorId)
        purged++
      }
    }

    if (purged > 0) {
      this.logger.debug('cadence_overrides_purged', { count: purged, remaining: this.cadenceOverrides.size })
    }

    return purged
  }

  /**
   * Get all active (non-expired) cadence overrides.
   */
  getActiveCadenceOverrides(): CadenceOverrideEntry[] {
    this.purgeExpiredOverrides()
    return [...this.cadenceOverrides.values()]
  }

  /**
   * Check whether a corridor has an active cadence override.
   */
  hasCadenceOverride(corridorId: string): boolean {
    return this.getEffectiveIntervalMs(corridorId) !== this.baseCollectionIntervalMs
  }

  /**
   * Load cadence overrides from the dispatch queue (set by the stress responder).
   *
   * Called at the start of each collection cycle to pick up any pending
   * cadence overrides that were applied by the stress-responder agent.
   */
  protected async loadCadenceOverrides(): Promise<void> {
    try {
      const { rows } = await this.pool.query<{
        payload: Record<string, unknown>
        expires_at: string
      }>(
        `SELECT payload, expires_at FROM silver.dispatch_queue
         WHERE queue_name = 'cadence-override'
           AND status = 'pending'
           AND module_id LIKE $1
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at DESC`,
        [`${this.providerId}%`],
      )

      for (const row of rows) {
        const corridorId = row.payload?.corridorId as string
        const overrideIntervalMs = row.payload?.overrideIntervalMs as number
        const reason = (row.payload?.reason as string) ?? 'stress-responder override'

        if (corridorId && overrideIntervalMs) {
          const ttlMs = new Date(row.expires_at).getTime() - Date.now()
          if (ttlMs > 0) {
            this.applyCadenceOverride(corridorId, overrideIntervalMs, ttlMs, reason)
          }
        }
      }
    } catch (err) {
      this.logger.debug('load_cadence_overrides_failed', {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  /**
   * Emit an observation to silver.observation for the agent pipeline.
   *
   * Called after parse failures, block detections, and fetch exceptions
   * so the failure detector has input to create FailureBundles.
   */
  protected async emitObservation(params: {
    type: 'failure' | 'quote'
    corridorId: string
    payload: Record<string, unknown>
    confidence?: 'high' | 'medium' | 'low'
  }): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO silver.observation
         (module_id, provider_id, owner_kind, owner_id, type, signal_layer, capture_method,
          parser_version, source_ref, corridor_id, confidence, observed_at,
          ingestion_run_id, payload, lineage, schema_version)
         VALUES ($1, $2, 'provider', $2, $3, $4, $5,
                 NULL, NULL, $6, $7, NOW(),
                 $8, $9, $10, 1)`,
        [
          `${this.providerId}:${this.collectorType}`,
          this.providerId,
          params.type,
          getObservationSignalLayer(params.type),
          this.collectorType,
          params.corridorId,
          params.confidence ?? 'high',
          this.ingestionRunId || `obs-${Date.now()}`,
          JSON.stringify(params.payload),
          JSON.stringify({
            collector_type: this.collectorType,
            provider_id: this.providerId,
          }),
        ],
      )
    } catch (err) {
      this.logger.debug('emit_observation_failed', {
        error: err instanceof Error ? err.message : String(err),
        type: params.type,
        corridorId: params.corridorId,
      })
    }
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

    const environment =
      config.envName ||
      process.env.ENVIRONMENT ||
      process.env.NODE_ENV ||
      'development'

    // Low-cardinality CloudWatch metrics to catch latency regressions and block storms.
    // Dimensions are intentionally bounded (no corridor IDs) to avoid cardinality blowups.
    const dimensions = {
      ProviderId: this.providerId,
      CollectorType: this.collectorType,
      environment,
    }

    recordCloudWatchMetric({
      namespace: 'RemitScout/Collectors',
      name: 'collector_duration_seconds',
      value: durationSeconds,
      unit: 'Seconds',
      dimensions,
    })
    recordCloudWatchMetric({
      namespace: 'RemitScout/Collectors',
      name: 'collector_attempt_count',
      value: this.attemptCount,
      unit: 'Count',
      dimensions,
    })
    recordCloudWatchMetric({
      namespace: 'RemitScout/Collectors',
      name: 'collector_success_count',
      value: this.successCount,
      unit: 'Count',
      dimensions,
    })
    recordCloudWatchMetric({
      namespace: 'RemitScout/Collectors',
      name: 'collector_block_count',
      value: this.blockCount,
      unit: 'Count',
      dimensions,
    })
    recordCloudWatchMetric({
      namespace: 'RemitScout/Collectors',
      name: 'collector_rate_limit_count',
      value: this.rateLimitCount,
      unit: 'Count',
      dimensions,
    })
    recordCloudWatchMetric({
      namespace: 'RemitScout/Collectors',
      name: 'collector_avg_attempt_ms',
      value: avgAttemptMs,
      unit: 'Milliseconds',
      dimensions,
    })
  }
}

/**
 * Entry representing a temporary cadence override for a specific corridor.
 */
export type CadenceOverrideEntry = {
  /** Corridor the override applies to */
  corridorId: string
  /** Overridden interval in ms (lower = faster collection) */
  overrideIntervalMs: number
  /** The original (normal) interval in ms, so we can revert */
  originalIntervalMs: number
  /** ISO 8601 timestamp when this override expires */
  expiresAt: string
  /** Human-readable reason for the override */
  reason: string
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
