"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDahabshiilCollector = void 0;
const node_crypto_1 = require("node:crypto");
const db_1 = require("../../../../shared/db");
const config_1 = require("../../../../shared/config");
const logger_1 = require("../../../../shared/logger");
const block_detection_1 = require("../../collectors/block-detection");
const alert_routing_1 = require("../../collectors/alert-routing");
const attempt_metrics_1 = require("../../collectors/attempt-metrics");
const rate_config_1 = require("../../collectors/rate-config");
const rpm_ramp_1 = require("../../collectors/rpm-ramp");
const base_1 = require("../../collectors/base");
const redis_circuit_breaker_1 = require("../../lib/redis-circuit-breaker");
const proxy_router_1 = require("../../lib/proxy-router");
const dispatcher_1 = require("../../notifications/dispatcher");
const bronze_writer_1 = require("../../collectors/bronze-writer");
const scheduler_1 = require("../../collectors/scheduler");
const rate_limit_scope_1 = require("../../collectors/rate-limit-scope");
const repositories_1 = require("../../repositories");
const quote_normalizer_1 = require("../../normalize/quote-normalizer");
const catalog_1 = require("./catalog");
const supported_corridors_1 = require("./supported-corridors");
const limits_1 = require("./limits");
const fetch_1 = require("./fetch");
const parse_1 = require("./parse");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const logger = (0, logger_1.createLogger)('plane-b.dahabshiil.collector');
/**
 * Updates provider capability information for a corridor.
 * Extracts available payin/payout methods from the API response and stores them
 * in the database. This helps track which payment methods are supported per corridor.
 * Uses a Set to cache updates and avoid duplicate database writes.
 */
const upsertCapability = async (pool, corridorId, _payload) => {
    const pairs = (0, parse_1.extractDahabshiilMethodPairs)();
    const payinMethods = Array.from(new Set(pairs.map(pair => pair.payin_method))).filter(method => method !== 'other');
    const payoutMethods = Array.from(new Set(pairs.map(pair => pair.payout_method))).filter(method => method !== 'other');
    const payinValue = payinMethods.length ? payinMethods : null;
    const payoutValue = payoutMethods.length ? payoutMethods : null;
    const repo = new repositories_1.ProviderCapabilityRepository(pool);
    await repo.upsertCapability({
        providerId: 'dahabshiil',
        corridorId,
        payinMethods: payinValue,
        payoutMethods: payoutValue,
        isSupported: true,
        source: 'observed',
    });
};
/**
 * Checks the age of the most recent quote for a specific corridor/amount/method combination.
 * Used by freshness SLO to determine if we should skip fetching a new quote.
 * Returns null if no quote exists, otherwise returns age in minutes.
 */
const getLatestQuoteAgeMinutes = async (pool, providerId, corridorId, amountBucket, payinMethod, payoutMethod) => {
    const repo = new repositories_1.LatestQuoteRepository(pool);
    return repo.getLatestQuoteAgeMinutes(providerId, corridorId, amountBucket, payinMethod, payoutMethod);
};
/**
 * Main collector function that orchestrates quote collection from Dahabshiil.
 *
 * @param options - Configuration options for the collector run
 * @returns Promise<boolean> - true if collection completed successfully, false if blocked
 */
const runDahabshiilCollector = async (options = {}) => {
    const providerId = 'dahabshiil';
    const pool = options.pool ?? (0, db_1.createPool)(config_1.config.db.planeBUrl);
    const shouldClose = options.closePool ?? !options.pool;
    let corridors;
    // Resolve corridors to collect: use provided list or filter supported corridors
    // by removing those marked as unsupported in the database
    if (options.corridors?.length) {
        corridors = options.corridors;
    }
    else {
        const allPossibleCorridors = supported_corridors_1.DAHABSHIIL_SUPPORTED_CORRIDORS;
        const unsupportedCorridors = await (0, base_1.loadUnsupportedCorridors)(pool, providerId);
        corridors = allPossibleCorridors.filter(corridor => !unsupportedCorridors.has(corridor));
    }
    const buckets = options.amountBuckets ?? catalog_1.amountBuckets;
    const payinMethod = options.payinMethod ?? 'bank_transfer';
    const payoutMethod = options.payoutMethod ?? 'cash_pickup';
    const locale = options.locale ?? 'en-US';
    const delayMs = options.delayMs ?? config_1.config.planeB.dahabshiil.delayMs;
    const jitterMs = options.jitterMs ?? config_1.config.planeB.dahabshiil.jitterMs;
    const rateLimitBackoffMs = options.rateLimitBackoffMs ?? config_1.config.planeB.dahabshiil.rateLimitBackoffMs;
    const rateLimitJitterMs = options.rateLimitJitterMs ?? config_1.config.planeB.dahabshiil.rateLimitJitterMs;
    const rateLimitMaxRetries = options.rateLimitMaxRetries ?? config_1.config.planeB.dahabshiil.rateLimitMaxRetries;
    const corridorDelayMs = options.corridorDelayMs ?? config_1.config.planeB.dahabshiil.corridorDelayMs;
    const corridorJitterMs = options.corridorJitterMs ?? config_1.config.planeB.dahabshiil.corridorJitterMs;
    const collectorType = options.collectorType ?? 'collector';
    const freshnessSloMinutes = options.freshnessSloMinutes ?? config_1.config.planeB.dahabshiil.freshnessSloMinutes;
    const freshnessSloEnabled = options.freshnessSloEnabled ?? config_1.config.planeB.dahabshiil.freshnessSloEnabled;
    const blockCooldownMs = config_1.config.planeB.dahabshiil.blockCooldownMs;
    const startedAt = new Date();
    const capabilityUpdated = new Set(); // Cache to prevent duplicate capability updates per corridor
    let freshnessChecked = 0;
    let freshnessSkipped = 0;
    let freshnessStale = 0;
    // Rate limit penalty state: increases on rate limit errors, decays on success
    let extraDelayMs = 0;
    let extraJitterMs = 0;
    // Resolve rate limits: check database for overrides, fall back to httpLimits from limits.ts
    const providerRates = await (0, rate_config_1.resolveProviderRates)(pool, providerId, {
        rpm: limits_1.httpLimits.rpm,
        perCorridorRpm: limits_1.httpLimits.perCorridorRpm,
    }, {
        rpm: options.rpmOverride,
        perCorridorRpm: options.perCorridorRpmOverride,
    });
    let currentRates = {
        rpm: providerRates.rpm,
        perCorridorRpm: providerRates.perCorridorRpm,
    };
    const scheduler = (0, scheduler_1.createScheduler)({
        providerId,
        rpm: currentRates.rpm,
        perCorridorRpm: currentRates.perCorridorRpm,
        baseDelayMs: delayMs,
        jitterMs,
        globalEnabled: Boolean(config_1.config.redis.url),
        locale,
        perLocale: limits_1.httpLimits.perLocale,
        scope: (0, rate_limit_scope_1.resolveRateLimitScope)(collectorType),
    });
    // Performance tracking counters
    let attemptCount = 0;
    let successCount = 0;
    let blockCount = 0;
    let rateLimitCount = 0;
    let http2xxCount = 0;
    let attemptDurationMsTotal = 0;
    /**
     * Records the duration of an attempt for performance metrics.
     */
    const recordAttemptDuration = (startedAtMs) => {
        const durationMs = Date.now() - startedAtMs;
        attemptDurationMsTotal += durationMs;
        return durationMs;
    };
    /**
     * Sleeps for rate limit backoff period with jitter to avoid thundering herd.
     * Called when a rate limit error is detected and we're retrying.
     */
    const sleepRateLimit = async () => {
        const jitter = rateLimitJitterMs > 0 ? Math.floor(Math.random() * rateLimitJitterMs) : 0;
        await sleep(rateLimitBackoffMs + jitter);
    };
    /**
     * Increases rate limit penalty when a rate limit error is detected.
     * Penalty is capped at 3x the base backoff to prevent excessive delays.
     * This penalty is applied to the scheduler's wait time for subsequent requests.
     */
    const applyRateLimitPenalty = () => {
        extraDelayMs = Math.min(extraDelayMs + rateLimitBackoffMs, rateLimitBackoffMs * 3);
        extraJitterMs = Math.min(extraJitterMs + rateLimitJitterMs, rateLimitJitterMs * 3);
    };
    /**
     * Decays rate limit penalty on successful quote collection.
     * Reduces penalty by 30% each time, allowing gradual recovery from rate limit issues.
     */
    const decayRateLimitPenalty = () => {
        extraDelayMs = Math.max(0, Math.floor(extraDelayMs * 0.7));
        extraJitterMs = Math.max(0, Math.floor(extraJitterMs * 0.7));
    };
    /**
     * Adds delay between processing different corridors to avoid overwhelming the provider.
     * Includes jitter to randomize timing and prevent synchronized requests.
     */
    const sleepBetweenCorridors = async () => {
        if (corridorDelayMs <= 0 && corridorJitterMs <= 0)
            return;
        const jitter = corridorJitterMs > 0 ? Math.floor(Math.random() * corridorJitterMs) : 0;
        await sleep(corridorDelayMs + jitter);
    };
    /**
     * Determines if a block reason indicates a rate limit error.
     */
    const isRateLimit = (reason) => reason === 'http_429' || reason === 'keyword_too_many_requests';
    /**
     * Checks if this is a scheduled sweep (not a manual health probe or B2C request).
     * Freshness SLO is only applied to scheduled sweeps to avoid skipping B2C requests.
     */
    const isScheduledSweep = collectorType === 'collector'
        || collectorType === 'b2b_full_sweep'
        || collectorType === 'b2b_tier_1'
        || collectorType === 'b2b_tier_2';
    const shouldApplyFreshnessSlo = freshnessSloEnabled && isScheduledSweep;
    const defaultProxyTier = (0, proxy_router_1.getDefaultProxyTierForCollector)(collectorType);
    // Cache proxy tier lookups to avoid repeated database queries
    const proxyTierCache = new Map();
    /**
     * Resolves the proxy tier for a corridor, using cache to avoid duplicate lookups.
     * Proxy tiers determine which proxy infrastructure to use for API requests.
     */
    const resolveProxyTier = async (corridorId) => {
        if (proxyTierCache.has(corridorId)) {
            return proxyTierCache.get(corridorId);
        }
        const proxyTier = await (0, proxy_router_1.getProxyTierForCorridor)(pool, corridorId, defaultProxyTier);
        proxyTierCache.set(corridorId, proxyTier);
        return proxyTier;
    };
    // Ensure provider exists in database, create if missing
    await (0, base_1.ensureProvider)(pool, providerId, 'Dahabshiil');
    // Check if provider is paused due to previous blocks, resume if cooldown expired
    const resumeStatus = await (0, base_1.resumeProviderIfCooldownExpired)(pool, providerId);
    if (!resumeStatus.canCollect) {
        logger.warn('collector_paused', { reason: resumeStatus.reason });
        return false;
    }
    if (resumeStatus.reason === 'auto_resume') {
        logger.info('collector_resumed', { reason: resumeStatus.reason });
    }
    // Create ingestion run record to track this collection session
    const ingestionRunId = await (0, base_1.createIngestionRun)(pool, providerId, collectorType, startedAt);
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
    });
    // Track blocking state to stop collection if provider is blocked
    let blocked = false;
    let blockReason = null;
    // Check circuit breaker state: if open, provider is temporarily disabled
    const providerCircuitState = await (0, redis_circuit_breaker_1.checkCircuitState)(pool, providerId, null);
    if (providerCircuitState === 'open') {
        logger.warn('collector_circuit_open', { scope: 'provider', provider_id: providerId });
        await (0, base_1.finishIngestionRun)(pool, ingestionRunId, 'blocked', 'circuit_open');
        if (shouldClose) {
            await pool.end();
        }
        return false;
    }
    // Main collection loop: iterate through all corridors
    for (const corridorId of corridors) {
        let skipCorridor = false; // Flag to skip remaining buckets if corridor is unsupported
        logger.debug('corridor_start', { corridor_id: corridorId });
        // Ensure corridor exists in database, create if missing
        await (0, base_1.ensureCorridor)(pool, corridorId);
        const proxyTier = await resolveProxyTier(corridorId);
        // Inner loop: iterate through amount buckets for this corridor
        for (const amountBucket of buckets) {
            if (skipCorridor) {
                break; // Skip remaining buckets if corridor was marked unsupported
            }
            // Freshness SLO: skip if quote is already fresh enough
            if (shouldApplyFreshnessSlo) {
                freshnessChecked += 1;
                const ageMinutes = await getLatestQuoteAgeMinutes(pool, providerId, corridorId, amountBucket, payinMethod, payoutMethod);
                if (ageMinutes !== null && ageMinutes <= freshnessSloMinutes) {
                    freshnessSkipped += 1;
                    logger.debug('freshness_skip', {
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        age_minutes: ageMinutes,
                        slo_minutes: freshnessSloMinutes,
                    });
                    continue;
                }
                freshnessStale += 1;
                logger.debug('freshness_stale', {
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    age_minutes: ageMinutes,
                    slo_minutes: freshnessSloMinutes,
                });
            }
            // Retry loop: handles rate limit retries and error recovery
            let rateLimitRetries = 0;
            let completed = false;
            while (!completed) {
                // Check circuit breaker: skip if circuit is open (provider/corridor disabled)
                const circuitState = await (0, redis_circuit_breaker_1.checkCircuitState)(pool, providerId, corridorId);
                if (circuitState === 'open') {
                    logger.warn('circuit_open_skip', { provider_id: providerId, corridor_id: corridorId });
                    completed = true;
                    continue;
                }
                const isHalfOpen = circuitState === 'half_open';
                attemptCount += 1;
                const traceId = (0, node_crypto_1.randomUUID)(); // Unique ID for tracing this attempt through logs
                const attemptStartedAt = Date.now();
                // Performance tracking: measure duration of each stage
                let fetchDurationMs = 0;
                let bronzeDurationMs = 0;
                let parseDurationMs = 0;
                let normalizeDurationMs = 0;
                let persistDurationMs = 0;
                // Build request object for this quote attempt
                const request = {
                    provider_id: providerId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    payin_method: payinMethod,
                    payout_method: payoutMethod,
                    send_amount: amountBucket,
                    locale,
                };
                // Create fingerprint for deduplication and tracking
                const requestFingerprint = (0, node_crypto_1.createHash)('sha256')
                    .update(`${corridorId}:${amountBucket}:${payinMethod}:${payoutMethod}`)
                    .digest('hex');
                logger.debug('quote_attempt_start', {
                    trace_id: traceId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    payin_method: payinMethod,
                    payout_method: payoutMethod,
                    request_fingerprint: requestFingerprint,
                });
                // Wait for rate limit slot: scheduler ensures we don't exceed RPM limits
                // extraDelayMs/extraJitterMs apply penalty from previous rate limit errors
                await scheduler.waitForSlot(corridorId, extraDelayMs, extraJitterMs);
                let fetchResult;
                const fetchStartedAt = Date.now();
                // Fetch quote from Dahabshiil API
                try {
                    fetchResult = await (0, fetch_1.fetchDahabshiilQuote)(request, { jitterMs, proxyTier });
                    fetchDurationMs = Date.now() - fetchStartedAt;
                    logger.debug('quote_fetch_result', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        payin_method: payinMethod,
                        payout_method: payoutMethod,
                        http_status: fetchResult.status,
                        duration_ms: fetchDurationMs,
                    });
                    if (fetchResult.status >= 200 && fetchResult.status < 300) {
                        http2xxCount += 1;
                    }
                }
                catch (error) {
                    fetchDurationMs = Date.now() - fetchStartedAt;
                    logger.error('quote_fetch_error', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        payin_method: payinMethod,
                        payout_method: payoutMethod,
                        duration_ms: fetchDurationMs,
                        error,
                    });
                    await (0, base_1.insertAttempt)(pool, providerId, {
                        corridorId,
                        amountBucket,
                        payinMethod,
                        payoutMethod,
                        success: false,
                        errorType: 'network_error',
                        httpStatus: null,
                        errorMessage: error.message,
                        requestFingerprint,
                    });
                    const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                    logger.info('quote_attempt_finish', {
                        trace_id: traceId,
                        status: 'error',
                        stage: 'fetch',
                        total_duration_ms: attemptDurationMs,
                        fetch_duration_ms: fetchDurationMs,
                    });
                    completed = true;
                    continue;
                }
                // Write raw API response to bronze storage for audit trail and debugging
                const payload = fetchResult.payload ?? fetchResult.bodyText;
                const bronzeStartedAt = Date.now();
                const bronzeId = await (0, bronze_writer_1.writeBronzePayload)(pool, {
                    provider_id: providerId,
                    corridor_id: corridorId,
                    payload,
                });
                bronzeDurationMs = Date.now() - bronzeStartedAt;
                const bronzeObjectKey = bronzeId ? `bronze.provider_raw:${bronzeId}` : null;
                logger.debug('quote_bronze_written', {
                    trace_id: traceId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    bronze_object_key: bronzeObjectKey,
                    duration_ms: bronzeDurationMs,
                });
                // Detect if we were blocked (rate limit, IP ban, etc.)
                const blockResult = (0, block_detection_1.detectBlock)(fetchResult.status, fetchResult.bodyText);
                if (blockResult.blocked) {
                    const reason = blockResult.reason ?? 'blocked';
                    const rateLimited = isRateLimit(blockResult.reason ?? null);
                    blockCount += 1;
                    if (rateLimited) {
                        rateLimitCount += 1;
                    }
                    // Apply penalty to slow down future requests if rate limited
                    if (rateLimited) {
                        applyRateLimitPenalty();
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
                    });
                    await (0, base_1.insertAttempt)(pool, providerId, {
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
                    });
                    const alertId = await (0, base_1.insertOpsAlert)(pool, providerId, {
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
                    });
                    const shouldAlert = !rateLimited || rateLimitRetries >= Math.max(rateLimitMaxRetries, 0);
                    if (shouldAlert && alertId) {
                        await (0, alert_routing_1.notifyBlockAlert)(pool, alertId);
                    }
                    // Open circuit breaker for severe errors (429, 403) to prevent further requests
                    if (fetchResult.status === 429 || fetchResult.status === 403) {
                        const reasonLabel = fetchResult.status === 429 ? 'rate_limit' : 'http_403';
                        await (0, redis_circuit_breaker_1.openCircuit)(pool, providerId, corridorId, reasonLabel, config_1.config.planeB.circuitOpenMs);
                        const penalized = await (0, redis_circuit_breaker_1.penalizeRpmImmediately)(pool, providerId, currentRates, 0.5);
                        if (penalized) {
                            currentRates = penalized;
                            providerRates.rpm = penalized.rpm;
                            providerRates.perCorridorRpm = penalized.perCorridorRpm;
                            scheduler.updateRates(penalized.rpm, penalized.perCorridorRpm);
                        }
                        logger.error('circuit_opened_immediate', {
                            provider_id: providerId,
                            corridor_id: corridorId,
                            http_status: fetchResult.status,
                            at: new Date().toISOString(),
                        });
                    }
                    // Retry rate limit errors up to max retries
                    if (rateLimited && rateLimitRetries < Math.max(rateLimitMaxRetries, 0)) {
                        const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                        rateLimitRetries += 1;
                        logger.info('rate_limit_backoff', {
                            trace_id: traceId,
                            corridor_id: corridorId,
                            amount_bucket: amountBucket,
                            retry: rateLimitRetries,
                            max_retries: rateLimitMaxRetries,
                            attempt_duration_ms: attemptDurationMs,
                        });
                        await sleepRateLimit();
                        continue;
                    }
                    if (rateLimited) {
                        const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                        logger.info('quote_attempt_finish', {
                            trace_id: traceId,
                            status: 'rate_limit',
                            stage: 'block_detection',
                            total_duration_ms: attemptDurationMs,
                            fetch_duration_ms: fetchDurationMs,
                            bronze_duration_ms: bronzeDurationMs,
                        });
                        completed = true;
                        continue;
                    }
                    // Pause provider/corridor and stop collection if non-rate-limit block
                    await (0, base_1.pauseProviderForBlock)(pool, providerId, corridorId, reason, blockCooldownMs);
                    blocked = true;
                    blockReason = reason;
                    const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                    logger.info('quote_attempt_finish', {
                        trace_id: traceId,
                        status: 'blocked',
                        stage: 'block_detection',
                        total_duration_ms: attemptDurationMs,
                        fetch_duration_ms: fetchDurationMs,
                        bronze_duration_ms: bronzeDurationMs,
                    });
                    completed = true;
                    continue;
                }
                // Validate response: must be 200 with valid JSON payload
                if (fetchResult.status !== 200 || !fetchResult.payload || typeof fetchResult.payload !== 'object') {
                    logger.warn('quote_fetch_non_200', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        payin_method: payinMethod,
                        payout_method: payoutMethod,
                        http_status: fetchResult.status,
                    });
                    // Mark corridor as unsupported if 400 error (invalid corridor)
                    const unsupportedCorridor = fetchResult.status === 400;
                    if (unsupportedCorridor) {
                        await (0, base_1.markCorridorUnsupported)(pool, providerId, corridorId, 'auto_http_400');
                        logger.warn('corridor_marked_unsupported', {
                            trace_id: traceId,
                            corridor_id: corridorId,
                            provider_id: providerId,
                            http_status: fetchResult.status,
                        });
                        skipCorridor = true;
                    }
                    await (0, base_1.insertAttempt)(pool, providerId, {
                        corridorId,
                        amountBucket,
                        payinMethod,
                        payoutMethod,
                        success: false,
                        errorType: unsupportedCorridor ? 'unsupported' : 'http_error',
                        httpStatus: fetchResult.status,
                        errorMessage: unsupportedCorridor ? 'corridor_unsupported' : 'non_200_response',
                        bronzeObjectKey,
                        requestFingerprint,
                    });
                    const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                    logger.info('quote_attempt_finish', {
                        trace_id: traceId,
                        status: 'error',
                        stage: 'http',
                        total_duration_ms: attemptDurationMs,
                        fetch_duration_ms: fetchDurationMs,
                        bronze_duration_ms: bronzeDurationMs,
                    });
                    completed = true;
                    continue;
                }
                const errorMessages = (0, parse_1.getDahabshiilErrorMessages)(fetchResult.payload);
                const hasUnsupportedFx = errorMessages.some(message => message.toLowerCase().includes('no valid fx rate'));
                if (hasUnsupportedFx) {
                    await (0, base_1.markCorridorUnsupported)(pool, providerId, corridorId, 'auto_fx_missing');
                    logger.warn('corridor_marked_unsupported', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        provider_id: providerId,
                        error_messages: errorMessages,
                    });
                    skipCorridor = true;
                    await (0, base_1.insertAttempt)(pool, providerId, {
                        corridorId,
                        amountBucket,
                        payinMethod,
                        payoutMethod,
                        success: false,
                        errorType: 'unsupported',
                        httpStatus: fetchResult.status,
                        errorMessage: 'corridor_unsupported',
                        bronzeObjectKey,
                        requestFingerprint,
                    });
                    const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                    logger.info('quote_attempt_finish', {
                        trace_id: traceId,
                        status: 'error',
                        stage: 'unsupported',
                        total_duration_ms: attemptDurationMs,
                        fetch_duration_ms: fetchDurationMs,
                        bronze_duration_ms: bronzeDurationMs,
                    });
                    completed = true;
                    continue;
                }
                // Update capability info once per corridor (cached to avoid duplicates)
                if (!capabilityUpdated.has(corridorId)) {
                    await upsertCapability(pool, corridorId, fetchResult.payload);
                    capabilityUpdated.add(corridorId);
                }
                // Parse provider-specific payload format to standard parsed quote
                const parseStartedAt = Date.now();
                const parsed = (0, parse_1.parseDahabshiilPayload)(fetchResult.payload, request);
                parseDurationMs = Date.now() - parseStartedAt;
                if (!parsed) {
                    logger.warn('quote_parse_failed', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        payin_method: payinMethod,
                        payout_method: payoutMethod,
                        duration_ms: parseDurationMs,
                    });
                    await (0, base_1.insertAttempt)(pool, providerId, {
                        corridorId,
                        amountBucket,
                        payinMethod,
                        payoutMethod,
                        success: false,
                        errorType: 'parse_error',
                        httpStatus: fetchResult.status,
                        errorMessage: 'parse_failed',
                        bronzeObjectKey,
                        requestFingerprint,
                    });
                    const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                    logger.info('quote_attempt_finish', {
                        trace_id: traceId,
                        status: 'error',
                        stage: 'parse',
                        total_duration_ms: attemptDurationMs,
                        fetch_duration_ms: fetchDurationMs,
                        bronze_duration_ms: bronzeDurationMs,
                        parse_duration_ms: parseDurationMs,
                    });
                    completed = true;
                    continue;
                }
                logger.debug('quote_parse_ok', {
                    trace_id: traceId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    parse_flags: parsed.parse_flags,
                    duration_ms: parseDurationMs,
                });
                // Normalize parsed quote to standard format with validation and quality flags
                const normalizeStartedAt = Date.now();
                const normalized = (0, quote_normalizer_1.normalizeQuote)({
                    provider_id: providerId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
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
                });
                normalizeDurationMs = Date.now() - normalizeStartedAt;
                logger.debug('quote_normalize_ok', {
                    trace_id: traceId,
                    corridor_id: corridorId,
                    amount_bucket: normalized.amount_bucket,
                    quality_flags: normalized.quality_flags,
                    duration_ms: normalizeDurationMs,
                });
                // Persist normalized quote to database
                const persistStartedAt = Date.now();
                await (0, base_1.persistNormalizedQuote)(pool, normalized, collectorType);
                persistDurationMs = Date.now() - persistStartedAt;
                // Run anomaly detection: check if exchange rate is suspicious
                const anomaly = await (0, base_1.runAnomalyDetection)({
                    pool,
                    providerId,
                    corridorId,
                    currentRate: normalized.implied_fx_rate,
                    collectorType,
                });
                // Dispatch webhook signal if anomaly detected
                if (anomaly?.detected) {
                    await (0, dispatcher_1.dispatchSignal)(pool, corridorId, providerId, anomaly);
                }
                logger.debug('quote_persisted', {
                    trace_id: traceId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    payin_method: payinMethod,
                    payout_method: payoutMethod,
                    receive_amount: normalized.receive_amount,
                    implied_fx_rate: normalized.implied_fx_rate,
                    promotional_rate: normalized.promotional_rate,
                    base_rate: normalized.base_rate,
                    duration_ms: persistDurationMs,
                });
                await (0, base_1.insertAttempt)(pool, providerId, {
                    corridorId,
                    amountBucket,
                    payinMethod,
                    payoutMethod,
                    success: true,
                    httpStatus: fetchResult.status,
                    bronzeObjectKey,
                    requestFingerprint,
                });
                successCount += 1;
                // Close circuit breaker if it was half-open (testing recovery)
                if (isHalfOpen) {
                    await (0, redis_circuit_breaker_1.closeCircuit)(pool, providerId, corridorId);
                    await (0, redis_circuit_breaker_1.closeCircuit)(pool, providerId, null);
                }
                // Decay rate limit penalty on success to gradually recover
                decayRateLimitPenalty();
                const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                logger.info('quote_attempt_finish', {
                    trace_id: traceId,
                    status: 'success',
                    total_duration_ms: attemptDurationMs,
                    fetch_duration_ms: fetchDurationMs,
                    bronze_duration_ms: bronzeDurationMs,
                    parse_duration_ms: parseDurationMs,
                    normalize_duration_ms: normalizeDurationMs,
                    persist_duration_ms: persistDurationMs,
                });
                completed = true;
            }
        }
        // Stop collection if provider was blocked
        if (blocked) {
            break;
        }
        // Add delay between corridors to avoid overwhelming provider
        await sleepBetweenCorridors();
    }
    // Finalize ingestion run and update metrics
    await (0, base_1.finishIngestionRun)(pool, ingestionRunId, blocked ? 'blocked' : 'success', blockReason);
    // Persist performance metrics for monitoring
    if (attemptCount > 0) {
        const avgAttemptSeconds = attemptDurationMsTotal / attemptCount / 1000;
        await (0, attempt_metrics_1.persistAttemptMetrics)(pool, providerId, locale, avgAttemptSeconds, attemptCount);
    }
    // Apply RPM ramp: adjust rate limits based on performance (increase if doing well, decrease if blocked)
    await (0, rpm_ramp_1.applyRpmRamp)({
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
    });
    if (shouldClose) {
        await pool.end();
    }
    logger.info('collector_finish', {
        ingestion_run_id: ingestionRunId,
        status: blocked ? 'blocked' : 'success',
        block_reason: blockReason,
        freshness_checked: freshnessChecked,
        freshness_skipped: freshnessSkipped,
        freshness_stale: freshnessStale,
    });
    return !blocked && (collectorType !== 'health_probe' || successCount > 0);
};
exports.runDahabshiilCollector = runDahabshiilCollector;
