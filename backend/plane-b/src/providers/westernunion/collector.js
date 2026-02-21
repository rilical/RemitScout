"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWesternUnionCollector = void 0;
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
const logger = (0, logger_1.createLogger)('plane-b.westernunion.collector');
const shouldEnableCashFallback = (collectorType, payinMethod) => payinMethod === 'bank_transfer'
    && (collectorType.startsWith('b2b_') || collectorType === 'health_probe');
const shouldRetryWithCash = (parseFailureReason, responseMessage) => {
    const message = responseMessage.toLowerCase();
    return (parseFailureReason.startsWith('response_status_')
        || parseFailureReason === 'no_service_groups'
        || parseFailureReason === 'no_pay_groups'
        || message.includes('missing pricing')
        || message.includes('missing fee')
        || message.includes('not supported')
        || message.includes('not available'));
};
/**
 * Updates provider capability information for a corridor.
 * Extracts available payin/payout methods from the API response and stores them
 * in the database. This helps track which payment methods are supported per corridor.
 * Uses a Set to cache updates and avoid duplicate database writes.
 */
const upsertCapability = async (pool, corridorId, payload) => {
    const pairs = (0, parse_1.extractWesternUnionMethodPairs)(payload);
    const payinMethods = Array.from(new Set(pairs.map(pair => pair.payin_method))).filter(method => method !== 'other');
    const payoutMethods = Array.from(new Set(pairs.map(pair => pair.payout_method))).filter(method => method !== 'other');
    if (!payinMethods.length && !payoutMethods.length) {
        await (0, base_1.markCorridorUnsupported)(pool, 'westernunion', corridorId, 'auto_empty_methods');
        return;
    }
    const payinValue = payinMethods.length ? payinMethods : null;
    const payoutValue = payoutMethods.length ? payoutMethods : null;
    const repo = new repositories_1.ProviderCapabilityRepository(pool);
    await repo.upsertCapability({
        providerId: 'westernunion',
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
 * Main collector function that orchestrates quote collection from Western Union.
 *
 * @param options - Configuration options for the collector run
 * @returns Promise<boolean> - true if collection completed successfully, false if blocked
 */
const runWesternUnionCollector = async (options = {}) => {
    const providerId = 'westernunion';
    const pool = options.pool ?? (0, db_1.createPool)(config_1.config.db.planeBUrl);
    const shouldClose = options.closePool ?? !options.pool;
    const capabilityRepo = new repositories_1.ProviderCapabilityRepository(pool);
    const capabilityCache = new Map();
    let corridors;
    if (options.corridors?.length) {
        corridors = options.corridors;
    }
    else {
        const allPossibleCorridors = supported_corridors_1.WESTERNUNION_SUPPORTED_CORRIDORS;
        const unsupportedCorridors = await (0, base_1.loadUnsupportedCorridors)(pool, providerId);
        corridors = allPossibleCorridors.filter(corridor => !unsupportedCorridors.has(corridor));
    }
    const buckets = options.amountBuckets ?? catalog_1.amountBuckets;
    const payinMethod = options.payinMethod ?? 'bank_transfer';
    const payoutMethod = options.payoutMethod ?? 'bank_deposit';
    const locale = options.locale ?? 'en-US';
    const delayMs = options.delayMs ?? config_1.config.planeB.remitly.delayMs;
    const jitterMs = options.jitterMs ?? config_1.config.planeB.remitly.jitterMs;
    const rateLimitBackoffMs = options.rateLimitBackoffMs ?? config_1.config.planeB.remitly.rateLimitBackoffMs;
    const rateLimitJitterMs = options.rateLimitJitterMs ?? config_1.config.planeB.remitly.rateLimitJitterMs;
    const rateLimitMaxRetries = options.rateLimitMaxRetries ?? config_1.config.planeB.remitly.rateLimitMaxRetries;
    const corridorDelayMs = options.corridorDelayMs ?? config_1.config.planeB.remitly.corridorDelayMs;
    const corridorJitterMs = options.corridorJitterMs ?? config_1.config.planeB.remitly.corridorJitterMs;
    const collectorType = options.collectorType ?? 'collector';
    const freshnessSloMinutes = options.freshnessSloMinutes ?? config_1.config.planeB.remitly.freshnessSloMinutes;
    const freshnessSloEnabled = options.freshnessSloEnabled ?? config_1.config.planeB.remitly.freshnessSloEnabled;
    const blockCooldownMs = config_1.config.planeB.remitly.blockCooldownMs;
    const startedAt = new Date();
    const capabilityUpdated = new Set();
    let freshnessChecked = 0;
    let freshnessSkipped = 0;
    let freshnessStale = 0;
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
    let attemptCount = 0;
    let successCount = 0;
    let blockCount = 0;
    let rateLimitCount = 0;
    let http2xxCount = 0;
    let attemptDurationMsTotal = 0;
    let extraDelayMs = 0;
    let extraJitterMs = 0;
    const recordAttemptDuration = (startedAtMs) => {
        const durationMs = Date.now() - startedAtMs;
        attemptDurationMsTotal += durationMs;
        return durationMs;
    };
    const sleepRateLimit = async () => {
        const jitter = rateLimitJitterMs > 0 ? Math.floor(Math.random() * rateLimitJitterMs) : 0;
        await sleep(rateLimitBackoffMs + jitter);
    };
    const applyRateLimitPenalty = () => {
        extraDelayMs = Math.min(extraDelayMs + rateLimitBackoffMs, rateLimitBackoffMs * 3);
        extraJitterMs = Math.min(extraJitterMs + rateLimitJitterMs, rateLimitJitterMs * 3);
    };
    const decayRateLimitPenalty = () => {
        extraDelayMs = Math.max(0, Math.floor(extraDelayMs * 0.7));
        extraJitterMs = Math.max(0, Math.floor(extraJitterMs * 0.7));
    };
    const sleepBetweenCorridors = async () => {
        if (corridorDelayMs <= 0 && corridorJitterMs <= 0)
            return;
        const jitter = corridorJitterMs > 0 ? Math.floor(Math.random() * corridorJitterMs) : 0;
        await sleep(corridorDelayMs + jitter);
    };
    const isRateLimit = (reason) => reason === 'http_429' || reason === 'keyword_too_many_requests';
    const isScheduledSweep = collectorType === 'collector'
        || collectorType === 'b2b_full_sweep'
        || collectorType === 'b2b_tier_1'
        || collectorType === 'b2b_tier_2';
    const shouldApplyFreshnessSlo = freshnessSloEnabled && isScheduledSweep;
    const defaultProxyTier = (0, proxy_router_1.getDefaultProxyTierForCollector)(collectorType);
    const proxyTierCache = new Map();
    const resolveProxyTier = async (corridorId) => {
        if (proxyTierCache.has(corridorId)) {
            return proxyTierCache.get(corridorId);
        }
        const proxyTier = await (0, proxy_router_1.getProxyTierForCorridor)(pool, corridorId, defaultProxyTier);
        proxyTierCache.set(corridorId, proxyTier);
        return proxyTier;
    };
    const resolveMethodPreference = async (corridorId) => {
        if (!isScheduledSweep) {
            return { payinMethod, payoutMethod, reason: null };
        }
        if (capabilityCache.has(corridorId)) {
            const cached = capabilityCache.get(corridorId) ?? null;
            if (!cached || cached.is_supported === false) {
                return { payinMethod, payoutMethod, reason: null };
            }
            const payinMethods = cached.payin_methods ?? [];
            const payoutMethods = cached.payout_methods ?? [];
            if (!payinMethods.length && !payoutMethods.length) {
                return { payinMethod, payoutMethod, reason: null };
            }
            const supportsRequested = payinMethods.includes(payinMethod) && payoutMethods.includes(payoutMethod);
            if (supportsRequested) {
                return { payinMethod, payoutMethod, reason: null };
            }
            if (payinMethods.includes('cash') && payoutMethods.includes('cash_pickup')) {
                return { payinMethod: 'cash', payoutMethod: 'cash_pickup', reason: 'capability_cash_only' };
            }
            if (payinMethods.includes('bank_transfer') && payoutMethods.includes('bank_deposit')) {
                return { payinMethod: 'bank_transfer', payoutMethod: 'bank_deposit', reason: 'capability_bank_only' };
            }
            return { payinMethod, payoutMethod, reason: null };
        }
        const capability = await capabilityRepo.getCapability(providerId, corridorId);
        capabilityCache.set(corridorId, capability ?? null);
        if (!capability || capability.is_supported === false) {
            return { payinMethod, payoutMethod, reason: null };
        }
        const payinMethods = capability.payin_methods ?? [];
        const payoutMethods = capability.payout_methods ?? [];
        if (!payinMethods.length && !payoutMethods.length) {
            return { payinMethod, payoutMethod, reason: null };
        }
        const supportsRequested = payinMethods.includes(payinMethod) && payoutMethods.includes(payoutMethod);
        if (supportsRequested) {
            return { payinMethod, payoutMethod, reason: null };
        }
        if (payinMethods.includes('cash') && payoutMethods.includes('cash_pickup')) {
            return { payinMethod: 'cash', payoutMethod: 'cash_pickup', reason: 'capability_cash_only' };
        }
        if (payinMethods.includes('bank_transfer') && payoutMethods.includes('bank_deposit')) {
            return { payinMethod: 'bank_transfer', payoutMethod: 'bank_deposit', reason: 'capability_bank_only' };
        }
        return { payinMethod, payoutMethod, reason: null };
    };
    await (0, base_1.ensureProvider)(pool, providerId, 'Western Union');
    const resumeStatus = await (0, base_1.resumeProviderIfCooldownExpired)(pool, providerId);
    if (!resumeStatus.canCollect) {
        logger.warn('collector_paused', { reason: resumeStatus.reason });
        return false;
    }
    if (resumeStatus.reason === 'auto_resume') {
        logger.info('collector_resumed', { reason: resumeStatus.reason });
    }
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
    let blocked = false;
    let blockReason = null;
    const providerCircuitState = await (0, redis_circuit_breaker_1.checkCircuitState)(pool, providerId, null);
    if (providerCircuitState === 'open') {
        logger.warn('collector_circuit_open', { scope: 'provider', provider_id: providerId });
        await (0, base_1.finishIngestionRun)(pool, ingestionRunId, 'blocked', 'circuit_open');
        if (shouldClose) {
            await pool.end();
        }
        return false;
    }
    for (const corridorId of corridors) {
        let skipCorridor = false;
        logger.debug('corridor_start', { corridor_id: corridorId });
        await (0, base_1.ensureCorridor)(pool, corridorId);
        const proxyTier = await resolveProxyTier(corridorId);
        const methodPreference = await resolveMethodPreference(corridorId);
        const corridorPayinMethod = methodPreference.payinMethod;
        const corridorPayoutMethod = methodPreference.payoutMethod;
        if (methodPreference.reason) {
            logger.info('wu_method_override', {
                corridor_id: corridorId,
                from_payin_method: payinMethod,
                from_payout_method: payoutMethod,
                to_payin_method: corridorPayinMethod,
                to_payout_method: corridorPayoutMethod,
                reason: methodPreference.reason,
            });
        }
        for (const amountBucket of buckets) {
            if (skipCorridor) {
                break;
            }
            if (shouldApplyFreshnessSlo) {
                freshnessChecked += 1;
                const ageMinutes = await getLatestQuoteAgeMinutes(pool, providerId, corridorId, amountBucket, corridorPayinMethod, corridorPayoutMethod);
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
            let currentPayinMethod = corridorPayinMethod;
            let currentPayoutMethod = corridorPayoutMethod;
            let cashFallbackAttempted = false;
            let rateLimitRetries = 0;
            let completed = false;
            while (!completed) {
                const circuitState = await (0, redis_circuit_breaker_1.checkCircuitState)(pool, providerId, corridorId);
                if (circuitState === 'open') {
                    logger.warn('circuit_open_skip', { provider_id: providerId, corridor_id: corridorId });
                    completed = true;
                    continue;
                }
                const isHalfOpen = circuitState === 'half_open';
                attemptCount += 1;
                const traceId = (0, node_crypto_1.randomUUID)();
                const attemptStartedAt = Date.now();
                let fetchDurationMs = 0;
                let bronzeDurationMs = 0;
                let parseDurationMs = 0;
                let normalizeDurationMs = 0;
                let persistDurationMs = 0;
                const request = {
                    provider_id: providerId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    payin_method: currentPayinMethod,
                    payout_method: currentPayoutMethod,
                    send_amount: amountBucket,
                    locale,
                };
                const requestFingerprint = (0, node_crypto_1.createHash)('sha256')
                    .update(`${corridorId}:${amountBucket}:${currentPayinMethod}:${currentPayoutMethod}`)
                    .digest('hex');
                logger.debug('quote_attempt_start', {
                    trace_id: traceId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    payin_method: currentPayinMethod,
                    payout_method: currentPayoutMethod,
                    request_fingerprint: requestFingerprint,
                });
                await scheduler.waitForSlot(corridorId, extraDelayMs, extraJitterMs);
                let fetchResult;
                const fetchStartedAt = Date.now();
                try {
                    fetchResult = await (0, fetch_1.fetchWesternUnionQuote)(request, {
                        jitterMs,
                        forceAllPayins: collectorType === 'health_probe',
                        proxyTier,
                    });
                    fetchDurationMs = Date.now() - fetchStartedAt;
                    logger.debug('quote_fetch_result', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        payin_method: currentPayinMethod,
                        payout_method: currentPayoutMethod,
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
                        payin_method: currentPayinMethod,
                        payout_method: currentPayoutMethod,
                        duration_ms: fetchDurationMs,
                        error,
                    });
                    await (0, base_1.insertAttempt)(pool, providerId, {
                        corridorId,
                        amountBucket,
                        payinMethod: currentPayinMethod,
                        payoutMethod: currentPayoutMethod,
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
                const blockResult = (0, block_detection_1.detectBlock)(fetchResult.status, fetchResult.bodyText);
                if (blockResult.blocked) {
                    const reason = blockResult.reason ?? 'blocked';
                    const rateLimited = isRateLimit(blockResult.reason ?? null);
                    blockCount += 1;
                    if (rateLimited) {
                        rateLimitCount += 1;
                        applyRateLimitPenalty();
                    }
                    logger.warn('quote_blocked', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        payin_method: currentPayinMethod,
                        payout_method: currentPayoutMethod,
                        http_status: fetchResult.status,
                        reason,
                        rate_limited: rateLimited,
                        rate_limit_retry: rateLimitRetries,
                    });
                    await (0, base_1.insertAttempt)(pool, providerId, {
                        corridorId,
                        amountBucket,
                        payinMethod: currentPayinMethod,
                        payoutMethod: currentPayoutMethod,
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
                        payinMethod: currentPayinMethod,
                        payoutMethod: currentPayoutMethod,
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
                if (fetchResult.status !== 200 || !fetchResult.payload || typeof fetchResult.payload !== 'object') {
                    logger.warn('quote_fetch_non_200', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        payin_method: currentPayinMethod,
                        payout_method: currentPayoutMethod,
                        http_status: fetchResult.status,
                    });
                    if (fetchResult.status === 400) {
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
                        payinMethod: currentPayinMethod,
                        payoutMethod: currentPayoutMethod,
                        success: false,
                        errorType: 'http_error',
                        httpStatus: fetchResult.status,
                        errorMessage: 'non_200_response',
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
                const parseStartedAt = Date.now();
                const parsed = (0, parse_1.parseWesternUnionPayload)(fetchResult.payload, request);
                parseDurationMs = Date.now() - parseStartedAt;
                if (!parsed) {
                    const payload = fetchResult.payload;
                    const statusValue = payload.response_status?.status;
                    const statusNumber = statusValue === null || statusValue === undefined ? null : Number(statusValue);
                    const serviceGroups = payload.services_groups ?? [];
                    const payGroupCount = serviceGroups.reduce((count, group) => {
                        const payGroups = group.pay_groups ?? [];
                        return count + (Array.isArray(payGroups) ? payGroups.length : 0);
                    }, 0);
                    const responseMessage = (payload.response_status?.message ?? '').toLowerCase();
                    const parseFailureReason = Number.isFinite(statusNumber) && statusNumber !== 0
                        ? `response_status_${statusNumber}`
                        : serviceGroups.length === 0
                            ? 'no_service_groups'
                            : payGroupCount === 0
                                ? 'no_pay_groups'
                                : 'unknown';
                    const shouldMarkUnsupported = (Number.isFinite(statusNumber) && statusNumber < 0)
                        || parseFailureReason === 'no_service_groups'
                        || parseFailureReason === 'no_pay_groups'
                        || responseMessage.includes('not available')
                        || responseMessage.includes('pricing')
                        || responseMessage.includes('not supported');
                    const allowCashFallback = shouldEnableCashFallback(collectorType, currentPayinMethod)
                        && !cashFallbackAttempted
                        && shouldRetryWithCash(parseFailureReason, responseMessage);
                    logger.warn('quote_parse_failed', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        payin_method: currentPayinMethod,
                        payout_method: currentPayoutMethod,
                        duration_ms: parseDurationMs,
                        parse_failure_reason: parseFailureReason,
                        response_status: payload.response_status?.status ?? null,
                        response_message: payload.response_status?.message ?? null,
                        available_funds_in: payload.available_funds_in ?? null,
                        sender_funds_in: payload.sender?.funds_in ?? null,
                        service_group_count: serviceGroups.length,
                        pay_group_count: payGroupCount,
                    });
                    await (0, base_1.insertAttempt)(pool, providerId, {
                        corridorId,
                        amountBucket,
                        payinMethod: currentPayinMethod,
                        payoutMethod: currentPayoutMethod,
                        success: false,
                        errorType: allowCashFallback ? 'parse_error' : (shouldMarkUnsupported ? 'unsupported' : 'parse_error'),
                        httpStatus: fetchResult.status,
                        errorMessage: `parse_failed:${parseFailureReason}`,
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
                    if (allowCashFallback) {
                        logger.info('wu_cash_fallback', {
                            corridor_id: corridorId,
                            amount_bucket: amountBucket,
                            from_payin_method: currentPayinMethod,
                            from_payout_method: currentPayoutMethod,
                            to_payin_method: 'cash',
                            to_payout_method: 'cash_pickup',
                            parse_failure_reason: parseFailureReason,
                            response_message: payload.response_status?.message ?? null,
                        });
                        cashFallbackAttempted = true;
                        currentPayinMethod = 'cash';
                        currentPayoutMethod = 'cash_pickup';
                        rateLimitRetries = 0;
                        continue;
                    }
                    if (shouldMarkUnsupported) {
                        await (0, base_1.markCorridorUnsupported)(pool, providerId, corridorId, 'auto_parse_unsupported');
                        skipCorridor = true;
                    }
                    completed = true;
                    continue;
                }
                if (!capabilityUpdated.has(corridorId)) {
                    await upsertCapability(pool, corridorId, fetchResult.payload);
                    capabilityUpdated.add(corridorId);
                }
                if (parsed.payin_method !== currentPayinMethod
                    || parsed.payout_method !== currentPayoutMethod) {
                    logger.debug('wu_method_mismatch', {
                        trace_id: traceId,
                        corridor_id: corridorId,
                        amount_bucket: amountBucket,
                        requested_payin_method: currentPayinMethod,
                        requested_payout_method: currentPayoutMethod,
                        resolved_payin_method: parsed.payin_method,
                        resolved_payout_method: parsed.payout_method,
                    });
                }
                logger.debug('quote_parse_ok', {
                    trace_id: traceId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    parse_flags: parsed.parse_flags,
                    duration_ms: parseDurationMs,
                });
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
                const persistStartedAt = Date.now();
                await (0, base_1.persistNormalizedQuote)(pool, normalized, collectorType);
                persistDurationMs = Date.now() - persistStartedAt;
                const anomaly = await (0, base_1.runAnomalyDetection)({
                    pool,
                    providerId,
                    corridorId,
                    currentRate: normalized.implied_fx_rate,
                    collectorType,
                });
                if (anomaly?.detected) {
                    await (0, dispatcher_1.dispatchSignal)(pool, corridorId, providerId, anomaly);
                }
                logger.debug('quote_persisted', {
                    trace_id: traceId,
                    corridor_id: corridorId,
                    amount_bucket: amountBucket,
                    payin_method: normalized.payin,
                    payout_method: normalized.payout,
                    receive_amount: normalized.receive_amount,
                    implied_fx_rate: normalized.implied_fx_rate,
                    duration_ms: persistDurationMs,
                });
                await (0, base_1.insertAttempt)(pool, providerId, {
                    corridorId,
                    amountBucket,
                    payinMethod: currentPayinMethod,
                    payoutMethod: currentPayoutMethod,
                    success: true,
                    httpStatus: fetchResult.status,
                    bronzeObjectKey,
                    requestFingerprint,
                });
                successCount += 1;
                if (isHalfOpen) {
                    await (0, redis_circuit_breaker_1.closeCircuit)(pool, providerId, corridorId);
                    await (0, redis_circuit_breaker_1.closeCircuit)(pool, providerId, null);
                }
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
        if (blocked) {
            break;
        }
        await sleepBetweenCorridors();
    }
    await (0, base_1.finishIngestionRun)(pool, ingestionRunId, blocked ? 'blocked' : 'success', blockReason);
    if (attemptCount > 0) {
        const avgAttemptSeconds = attemptDurationMsTotal / attemptCount / 1000;
        await (0, attempt_metrics_1.persistAttemptMetrics)(pool, providerId, locale, avgAttemptSeconds, attemptCount);
    }
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
exports.runWesternUnionCollector = runWesternUnionCollector;
