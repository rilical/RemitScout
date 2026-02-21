"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPlacidCollector = void 0;
const node_crypto_1 = require("node:crypto");
const db_1 = require("../../../../shared/db");
const config_1 = require("../../../../shared/config");
const logger_1 = require("../../../../shared/logger");
const redis_1 = require("../../../../shared/redis");
const block_detection_1 = require("../../collectors/block-detection");
const attempt_metrics_1 = require("../../collectors/attempt-metrics");
const alert_routing_1 = require("../../collectors/alert-routing");
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
const logger = (0, logger_1.createLogger)('plane-b.placid.collector');
const normalizeProxyTier = (value) => {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
};
const upsertCapability = async (pool, corridorId, payload) => {
    const pairs = (0, parse_1.extractPlacidMethodPairs)(payload);
    const payinMethods = Array.from(new Set(pairs.map(pair => pair.payin_method))).filter(method => method !== 'other');
    const payoutMethods = Array.from(new Set(pairs.map(pair => pair.payout_method))).filter(method => method !== 'other');
    const payinValue = payinMethods.length ? payinMethods : null;
    const payoutValue = payoutMethods.length ? payoutMethods : null;
    const repo = new repositories_1.ProviderCapabilityRepository(pool);
    await repo.upsertCapability({
        providerId: 'placid',
        corridorId,
        payinMethods: payinValue,
        payoutMethods: payoutValue,
        isSupported: true,
        source: 'observed',
    });
};
const getLatestQuoteAgeMinutes = async (pool, providerId, corridorId, amountBucket, payinMethod, payoutMethod) => {
    const repo = new repositories_1.LatestQuoteRepository(pool);
    return repo.getLatestQuoteAgeMinutes(providerId, corridorId, amountBucket, payinMethod, payoutMethod);
};
const runPlacidCollector = async (options = {}) => {
    const providerId = 'placid';
    const pool = options.pool ?? (0, db_1.createPool)(config_1.config.db.planeBUrl);
    const shouldClose = options.closePool ?? !options.pool;
    let corridors;
    if (options.corridors?.length) {
        corridors = options.corridors;
    }
    else {
        const allPossibleCorridors = supported_corridors_1.PLACID_SUPPORTED_CORRIDORS;
        const unsupportedCorridors = await (0, base_1.loadUnsupportedCorridors)(pool, providerId);
        corridors = allPossibleCorridors.filter(corridor => !unsupportedCorridors.has(corridor));
    }
    const buckets = options.amountBuckets ?? catalog_1.amountBuckets;
    const payinMethod = options.payinMethod ?? 'debit_card';
    const payoutMethod = options.payoutMethod ?? 'bank_deposit';
    const locale = options.locale ?? 'en-US';
    const delayMs = options.delayMs ?? config_1.config.planeB.placid.delayMs;
    const jitterMs = options.jitterMs ?? config_1.config.planeB.placid.jitterMs;
    const rateLimitBackoffMs = options.rateLimitBackoffMs ?? config_1.config.planeB.placid.rateLimitBackoffMs;
    const rateLimitJitterMs = options.rateLimitJitterMs ?? config_1.config.planeB.placid.rateLimitJitterMs;
    const rateLimitMaxRetries = options.rateLimitMaxRetries ?? config_1.config.planeB.placid.rateLimitMaxRetries;
    const corridorDelayMs = options.corridorDelayMs ?? config_1.config.planeB.placid.corridorDelayMs;
    const corridorJitterMs = options.corridorJitterMs ?? config_1.config.planeB.placid.corridorJitterMs;
    const collectorType = options.collectorType ?? 'collector';
    const freshnessSloMinutes = options.freshnessSloMinutes ?? config_1.config.planeB.placid.freshnessSloMinutes;
    const freshnessSloEnabled = options.freshnessSloEnabled ?? config_1.config.planeB.placid.freshnessSloEnabled;
    const blockCooldownMs = config_1.config.planeB.placid.blockCooldownMs;
    const proxyTierOverride = normalizeProxyTier(config_1.config.planeB.placid.proxyTier);
    const proxyTierFallback = normalizeProxyTier(config_1.config.planeB.placid.proxyTierFallback);
    const sessionWarmupUrl = (config_1.config.planeB.placid.sessionWarmupUrl || '').trim();
    const sessionTtlMs = Math.max(0, config_1.config.planeB.placid.sessionTtlMs ?? 0);
    const sessionCookieRequired = Boolean(sessionWarmupUrl);
    const sessionSeedCookie = (config_1.config.planeB.placid.sessionCookie || '').trim();
    const sessionTtlSeconds = sessionTtlMs > 0 ? Math.max(1, Math.floor(sessionTtlMs / 1000)) : 0;
    const sessionCookieCache = new Map();
    const sessionRefreshAttempts = new Map();
    const sessionRefreshForced = new Set();
    const redisClient = await (0, redis_1.getRedisClient)();
    const sessionRefreshCooldownMs = 5 * 60 * 1000;
    const startedAt = new Date();
    const capabilityUpdated = new Set();
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
    let shouldStop = false;
    let blocked = false;
    let blockReason = null;
    let rateLimitRetries = 0;
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
    const isRateLimit = (reason) => reason === 'http_429' || reason === 'keyword_too_many_requests';
    const isScheduledSweep = collectorType === 'collector'
        || collectorType === 'b2b_full_sweep'
        || collectorType === 'b2b_tier_1'
        || collectorType === 'b2b_tier_2';
    const shouldApplyFreshnessSlo = freshnessSloEnabled && isScheduledSweep;
    const baseProxyTier = (0, proxy_router_1.getDefaultProxyTierForCollector)(collectorType);
    const defaultProxyTier = proxyTierOverride
        ?? (baseProxyTier === 'NONE' ? 'DATACENTER_ROTATING' : baseProxyTier);
    const proxyTierCache = new Map();
    const resolveProxyTier = async (corridorId) => {
        if (proxyTierCache.has(corridorId)) {
            return proxyTierCache.get(corridorId);
        }
        const proxyTier = await (0, proxy_router_1.getProxyTierForCorridor)(pool, corridorId, defaultProxyTier);
        proxyTierCache.set(corridorId, proxyTier);
        return proxyTier;
    };
    const getSessionCacheKey = (corridorId) => `session_cookie:${providerId}:${corridorId}`;
    const resolveSessionExpiry = () => sessionTtlMs > 0 ? Date.now() + sessionTtlMs : Number.MAX_SAFE_INTEGER;
    const cacheSessionCookie = async (corridorId, cookie) => {
        if (!cookie)
            return;
        sessionCookieCache.set(corridorId, { value: cookie, expiresAt: resolveSessionExpiry() });
        if (!redisClient)
            return;
        try {
            const key = getSessionCacheKey(corridorId);
            if (sessionTtlSeconds > 0) {
                await redisClient.set(key, cookie, { EX: sessionTtlSeconds });
            }
            else {
                await redisClient.set(key, cookie);
            }
        }
        catch (error) {
            logger.warn('session_cookie_cache_write_failed', {
                corridor_id: corridorId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };
    const loadSessionCookieFromCache = async (corridorId, allowSeed) => {
        const cached = sessionCookieCache.get(corridorId);
        if (cached) {
            if (sessionTtlMs === 0 || Date.now() < cached.expiresAt) {
                return cached.value;
            }
            sessionCookieCache.delete(corridorId);
        }
        if (redisClient) {
            try {
                const stored = await redisClient.get(getSessionCacheKey(corridorId));
                if (stored) {
                    sessionCookieCache.set(corridorId, { value: stored, expiresAt: resolveSessionExpiry() });
                    return stored;
                }
            }
            catch (error) {
                logger.warn('session_cookie_cache_read_failed', {
                    corridor_id: corridorId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        if (allowSeed && sessionSeedCookie) {
            await cacheSessionCookie(corridorId, sessionSeedCookie);
            return sessionSeedCookie;
        }
        return null;
    };
    const refreshSessionCookie = async (corridorId, proxyTier) => {
        if (!sessionWarmupUrl)
            return null;
        sessionRefreshAttempts.set(corridorId, Date.now());
        try {
            const refreshed = await (0, fetch_1.fetchPlacidSessionCookie)({
                locale,
                corridorId,
                proxyTier,
                warmupUrl: sessionWarmupUrl,
            });
            if (refreshed) {
                await cacheSessionCookie(corridorId, refreshed);
            }
            return refreshed;
        }
        catch (error) {
            logger.warn('session_refresh_failed', {
                corridor_id: corridorId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    };
    const resolveSessionCookie = async (corridorId, proxyTier, forceRefresh = false) => {
        const cached = await loadSessionCookieFromCache(corridorId, !forceRefresh);
        if (cached && !forceRefresh) {
            return cached;
        }
        if (!sessionWarmupUrl) {
            return forceRefresh ? null : cached;
        }
        const lastAttempt = sessionRefreshAttempts.get(corridorId) ?? 0;
        if (!forceRefresh && Date.now() - lastAttempt < sessionRefreshCooldownMs) {
            return cached;
        }
        const refreshed = await refreshSessionCookie(corridorId, proxyTier);
        if (refreshed) {
            return refreshed;
        }
        return forceRefresh ? null : cached;
    };
    await (0, base_1.ensureProvider)(pool, providerId, 'Placid');
    const resumeStatus = await (0, base_1.resumeProviderIfCooldownExpired)(pool, providerId);
    if (!resumeStatus.canCollect) {
        logger.warn('collector_paused', { reason: resumeStatus.reason });
        if (shouldClose)
            await pool.end();
        return false;
    }
    if (resumeStatus.reason === 'auto_resume') {
        logger.info('collector_resumed', { reason: resumeStatus.reason });
    }
    const ingestionRunId = await (0, base_1.createIngestionRun)(pool, providerId, collectorType, startedAt);
    try {
        for (const corridorId of corridors) {
            if (shouldStop || blocked)
                break;
            await (0, base_1.ensureCorridor)(pool, corridorId);
            await scheduler.waitForSlot(corridorId, extraDelayMs, extraJitterMs);
            await sleep(corridorDelayMs + Math.random() * corridorJitterMs);
            if (collectorType !== 'capability') {
                const unsupported = await (0, base_1.loadUnsupportedCorridors)(pool, providerId);
                if (unsupported.has(corridorId)) {
                    logger.info('placid_corridor_skipped', {
                        corridor_id: corridorId,
                        reason: 'unsupported',
                    });
                    continue;
                }
            }
            for (const amount of buckets) {
                if (shouldStop)
                    break;
                const request = {
                    provider_id: providerId,
                    corridor_id: corridorId,
                    amount_bucket: amount,
                    payin_method: payinMethod,
                    payout_method: payoutMethod,
                    send_amount: amount,
                    locale,
                };
                if (shouldApplyFreshnessSlo) {
                    const ageMinutes = await getLatestQuoteAgeMinutes(pool, providerId, corridorId, amount, payinMethod, payoutMethod);
                    if (ageMinutes !== null && ageMinutes <= freshnessSloMinutes) {
                        continue;
                    }
                }
                const requestFingerprint = (0, node_crypto_1.createHash)('sha256')
                    .update(JSON.stringify(request))
                    .digest('hex');
                const traceId = (0, node_crypto_1.randomUUID)();
                attemptCount += 1;
                const attemptStartedAt = Date.now();
                const circuitState = await (0, redis_circuit_breaker_1.checkCircuitState)(pool, providerId, corridorId);
                const isHalfOpen = circuitState === 'half_open';
                if (circuitState === 'open') {
                    logger.warn('placid_circuit_open', { corridor_id: corridorId });
                    blocked = true;
                    blockReason = 'circuit_open';
                    break;
                }
                const proxyTier = await resolveProxyTier(corridorId);
                const forceSessionRefresh = collectorType === 'health_probe'
                    && !sessionRefreshForced.has(corridorId);
                let sessionCookieHeader = await resolveSessionCookie(corridorId, proxyTier, forceSessionRefresh);
                if (forceSessionRefresh) {
                    sessionRefreshForced.add(corridorId);
                }
                if (!sessionCookieHeader && proxyTierFallback && proxyTierFallback !== proxyTier) {
                    sessionCookieHeader = await resolveSessionCookie(corridorId, proxyTierFallback, true);
                    sessionRefreshForced.add(corridorId);
                }
                if (sessionCookieRequired && !sessionCookieHeader) {
                    logger.warn('session_cookie_missing_skip', {
                        corridor_id: corridorId,
                        amount_bucket: amount,
                        payin_method: payinMethod,
                        payout_method: payoutMethod,
                        proxy_tier: proxyTier,
                    });
                    await (0, base_1.insertAttempt)(pool, providerId, {
                        corridorId,
                        amountBucket: amount,
                        payinMethod,
                        payoutMethod,
                        success: false,
                        errorType: 'session_missing',
                        httpStatus: null,
                        errorMessage: 'session_cookie_missing',
                        requestFingerprint,
                    });
                    const attemptDurationMs = recordAttemptDuration(attemptStartedAt);
                    logger.info('quote_attempt_finish', {
                        trace_id: traceId,
                        status: 'session_missing',
                        stage: 'session',
                        total_duration_ms: attemptDurationMs,
                    });
                    continue;
                }
                let responseStatus = null;
                let responsePayload = null;
                let responseText = null;
                let attemptErrorType = null;
                let attemptErrorMessage = null;
                let bronzeObjectKey = null;
                try {
                    const runFetch = async (tier, cookie, label) => {
                        const response = await (0, fetch_1.fetchPlacidQuote)(request, {
                            proxyTier: tier,
                            jitterMs,
                            cookie: cookie || undefined,
                        });
                        logger.debug('quote_fetch_result', {
                            trace_id: traceId,
                            corridor_id: corridorId,
                            amount_bucket: amount,
                            payin_method: payinMethod,
                            payout_method: payoutMethod,
                            http_status: response.status,
                            attempt: label,
                            proxy_tier: tier,
                        });
                        return response;
                    };
                    let response = await runFetch(proxyTier, sessionCookieHeader, 'primary');
                    responseStatus = response.status;
                    responseText = response.bodyText;
                    responsePayload = response.payload ?? null;
                    if (responseStatus === 403 && sessionWarmupUrl) {
                        const refreshed = await refreshSessionCookie(corridorId, proxyTier);
                        if (refreshed) {
                            response = await runFetch(proxyTier, refreshed, 'session_refresh');
                            responseStatus = response.status;
                            responseText = response.bodyText;
                            responsePayload = response.payload ?? null;
                        }
                    }
                    if (responseStatus === 403 && proxyTierFallback && proxyTierFallback !== proxyTier) {
                        const fallbackCookie = await resolveSessionCookie(corridorId, proxyTierFallback, true);
                        response = await runFetch(proxyTierFallback, fallbackCookie, 'proxy_fallback');
                        responseStatus = response.status;
                        responseText = response.bodyText;
                        responsePayload = response.payload ?? null;
                        if (responseStatus >= 200 && responseStatus < 300) {
                            proxyTierCache.set(corridorId, proxyTierFallback);
                            logger.info('proxy_tier_fallback_used', {
                                provider_id: providerId,
                                corridor_id: corridorId,
                                proxy_tier: proxyTierFallback,
                            });
                        }
                    }
                    if (responseStatus >= 200 && responseStatus < 300) {
                        http2xxCount += 1;
                    }
                    const bronzeId = await (0, bronze_writer_1.writeBronzePayload)(pool, {
                        provider_id: providerId,
                        corridor_id: corridorId,
                        payload: responsePayload ?? responseText ?? '',
                    });
                    bronzeObjectKey = bronzeId ? `bronze.provider_raw:${bronzeId}` : null;
                    const blockResult = (0, block_detection_1.detectBlock)(responseStatus, responseText);
                    if (blockResult.blocked) {
                        const reason = blockResult.reason ?? 'blocked';
                        const rateLimited = isRateLimit(blockResult.reason ?? null);
                        blockCount += 1;
                        if (rateLimited) {
                            rateLimitCount += 1;
                            applyRateLimitPenalty();
                        }
                        attemptErrorType = rateLimited ? 'rate_limit' : 'blocked';
                        attemptErrorMessage = reason;
                        const alertId = await (0, base_1.insertOpsAlert)(pool, providerId, {
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
                        });
                        const shouldAlert = !rateLimited || rateLimitRetries >= Math.max(rateLimitMaxRetries, 0);
                        if (shouldAlert && alertId) {
                            await (0, alert_routing_1.notifyBlockAlert)(pool, alertId);
                        }
                        if (responseStatus === 429 || responseStatus === 403) {
                            const reasonLabel = responseStatus === 429 ? 'rate_limit' : 'http_403';
                            await (0, redis_circuit_breaker_1.openCircuit)(pool, providerId, corridorId, reasonLabel, config_1.config.planeB.circuitOpenMs);
                            const penalized = await (0, redis_circuit_breaker_1.penalizeRpmImmediately)(pool, providerId, currentRates, 0.5);
                            if (penalized) {
                                currentRates = penalized;
                                providerRates.rpm = penalized.rpm;
                                providerRates.perCorridorRpm = penalized.perCorridorRpm;
                                scheduler.updateRates(penalized.rpm, penalized.perCorridorRpm);
                            }
                        }
                        if (rateLimited) {
                            rateLimitRetries += 1;
                            await sleepRateLimit();
                        }
                        else {
                            await (0, base_1.pauseProviderForBlock)(pool, providerId, corridorId, reason, blockCooldownMs);
                            blocked = true;
                            blockReason = reason;
                            shouldStop = true;
                        }
                    }
                    if (!attemptErrorType && (responseStatus !== 200 || !responsePayload)) {
                        attemptErrorType = 'http_error';
                        attemptErrorMessage = 'non_200_response';
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    attemptErrorType = 'exception';
                    attemptErrorMessage = errorMessage;
                    await (0, redis_circuit_breaker_1.openCircuit)(pool, providerId, corridorId, 'exception', config_1.config.planeB.circuitOpenMs);
                    logger.error('placid_fetch_failed', {
                        corridor_id: corridorId,
                        error: errorMessage,
                    });
                }
                const parsed = !attemptErrorType && responsePayload
                    ? (0, parse_1.parsePlacidPayload)(responsePayload, request)
                    : null;
                if (!attemptErrorType && !parsed) {
                    attemptErrorType = 'parse_error';
                    attemptErrorMessage = 'parse_failed';
                }
                recordAttemptDuration(attemptStartedAt);
                await (0, base_1.insertAttempt)(pool, providerId, {
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
                });
                if (attemptErrorType || !parsed) {
                    continue;
                }
                const normalizedQuote = (0, quote_normalizer_1.normalizeQuote)({
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
                });
                await (0, base_1.persistNormalizedQuote)(pool, normalizedQuote, collectorType);
                const anomaly = await (0, base_1.runAnomalyDetection)({
                    pool,
                    providerId,
                    corridorId,
                    currentRate: normalizedQuote.implied_fx_rate,
                    collectorType,
                });
                if (anomaly?.detected) {
                    await (0, dispatcher_1.dispatchSignal)(pool, corridorId, providerId, anomaly);
                }
                successCount += 1;
                if (isHalfOpen) {
                    await (0, redis_circuit_breaker_1.closeCircuit)(pool, providerId, corridorId);
                    await (0, redis_circuit_breaker_1.closeCircuit)(pool, providerId, null);
                }
                if (!capabilityUpdated.has(corridorId) && responsePayload) {
                    await upsertCapability(pool, corridorId, responsePayload);
                    capabilityUpdated.add(corridorId);
                }
                decayRateLimitPenalty();
            }
            if (blocked) {
                break;
            }
        }
    }
    finally {
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
    }
    return !blocked && (collectorType !== 'health_probe' || successCount > 0);
};
exports.runPlacidCollector = runPlacidCollector;
