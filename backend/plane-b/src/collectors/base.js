"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCircuitStateFromDb = exports.recordCircuitClosed = exports.recordCircuitHalfOpen = exports.recordCircuitOpen = exports.finishIngestionRun = exports.createIngestionRun = exports.loadActiveCircuits = exports.resumeProviderIfCooldownExpired = exports.pauseProviderForBlock = exports.runAnomalyDetection = exports.persistNormalizedQuote = exports.markCorridorUnsupported = exports.handleBlockDetectionAutoStop = exports.insertOpsAlert = exports.insertAttempt = exports.ensureCorridor = exports.loadUnsupportedCorridors = exports.loadObservedCorridors = exports.ensureProvider = void 0;
const config_1 = require("../../../shared/config");
const logger_1 = require("../../../shared/logger");
const corridor_1 = require("../../../shared/corridor");
const tracing_1 = require("../../../shared/tracing");
const sqs_1 = require("../../../shared/sqs");
const queue_staleness_1 = require("../../../shared/queue-staleness");
const anomaly_detector_1 = require("../signals/anomaly-detector");
const repositories_1 = require("../repositories");
const services_1 = require("../services");
const collector_metrics_1 = require("./collector-metrics");
const logger = (0, logger_1.createLogger)('plane-b.collectors.base');
const tracer = (0, tracing_1.getTracer)('plane-b.collectors');
const opsAlertsQueueUrl = config_1.config.queues.opsAlerts.url;
const opsAlertsQueueMode = config_1.config.queues.opsAlerts.mode;
let notifiedOpsAlertsQueueMisconfig = false;
const goldLiveQueueUrl = config_1.config.queues.goldLive.url;
const goldLiveQueueMode = config_1.config.queues.goldLive.mode;
let notifiedGoldLiveQueueMisconfig = false;
const enqueueOpsAlert = async (payload) => {
    if (!opsAlertsQueueUrl) {
        if (!notifiedOpsAlertsQueueMisconfig && opsAlertsQueueMode !== 'off') {
            notifiedOpsAlertsQueueMisconfig = true;
            logger.warn('ops_alert_queue_disabled', { reason: 'missing_queue_url' });
        }
        return false;
    }
    try {
        await (0, sqs_1.sendJsonMessage)(opsAlertsQueueUrl, payload);
        return true;
    }
    catch (error) {
        logger.warn('ops_alert_queue_enqueue_failed', {
            alert_id: payload.alertId,
            provider_id: payload.providerId,
            corridor_id: payload.corridorId,
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
};
const enqueueGoldLiveUpdate = async (payload, collectorType) => {
    if (!collectorType || !collectorType.startsWith('b2b_')) {
        return false;
    }
    if (goldLiveQueueMode !== 'queue') {
        return false;
    }
    if (!goldLiveQueueUrl) {
        if (!notifiedGoldLiveQueueMisconfig) {
            notifiedGoldLiveQueueMisconfig = true;
            logger.warn('gold_live_queue_disabled', { reason: 'missing_queue_url' });
        }
        return false;
    }
    try {
        await (0, sqs_1.sendJsonMessage)(goldLiveQueueUrl, (0, queue_staleness_1.wrapEnvelope)('gold-live', payload, {
            correlationId: `${payload.providerId}:${payload.corridorId}`,
        }));
        return true;
    }
    catch (error) {
        logger.warn('gold_live_queue_enqueue_failed', {
            corridor_id: payload.corridorId,
            provider_id: payload.providerId,
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
};
const isTier1Collector = (collectorType) => collectorType === 'b2b_tier_1' || collectorType === 'b2b_tier_1_alpha';
const ensureProvider = async (pool, providerId, displayName) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('ensure_provider_invalid_id', { provider_id: providerId });
        throw new Error('Invalid provider ID');
    }
    try {
        const repo = new repositories_1.ProviderRepository(pool);
        await repo.upsertProvider({ providerId, displayName });
        logger.debug('provider_ensured', { provider_id: providerId, display_name: displayName });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('ensure_provider_failed', {
            provider_id: providerId,
            display_name: displayName,
            error: errorMessage,
            stack: errorStack,
        });
        throw error;
    }
};
exports.ensureProvider = ensureProvider;
const loadObservedCorridors = async (pool, providerId) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('load_observed_corridors_invalid_provider_id', { provider_id: providerId });
        return [];
    }
    try {
        const repo = new repositories_1.ProviderCapabilityRepository(pool);
        const rows = await repo.loadObservedCorridors(providerId);
        const corridors = rows.map(row => row.corridor_id).filter(Boolean);
        logger.debug('observed_corridors_loaded', {
            provider_id: providerId,
            count: corridors.length,
        });
        return corridors;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('load_observed_corridors_failed', {
            provider_id: providerId,
            error: errorMessage,
            stack: errorStack,
        });
        return [];
    }
};
exports.loadObservedCorridors = loadObservedCorridors;
const loadUnsupportedCorridors = async (pool, providerId) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('load_unsupported_corridors_invalid_provider_id', { provider_id: providerId });
        return new Set();
    }
    try {
        const repo = new repositories_1.ProviderCapabilityRepository(pool);
        const rows = await repo.loadUnsupportedCorridors(providerId);
        const corridors = new Set(rows.map(row => row.corridor_id).filter((id) => Boolean(id)));
        logger.debug('unsupported_corridors_loaded', {
            provider_id: providerId,
            count: corridors.size,
        });
        return corridors;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('load_unsupported_corridors_failed', {
            provider_id: providerId,
            error: errorMessage,
            stack: errorStack,
        });
        return new Set();
    }
};
exports.loadUnsupportedCorridors = loadUnsupportedCorridors;
const ensureCorridor = async (pool, corridorId) => {
    if (!corridorId || typeof corridorId !== 'string' || corridorId.trim().length === 0) {
        logger.warn('ensure_corridor_invalid_id', { corridor_id: corridorId });
        throw new Error('Invalid corridor ID');
    }
    try {
        const { sourceCountry, destCountry, sourceCurrency, destCurrency } = (0, corridor_1.requireCorridorId)(corridorId);
        const repo = new repositories_1.CorridorRepository(pool);
        await repo.insertIfMissing({
            corridorId,
            sourceCountry,
            destCountry,
            sourceCurrency,
            destCurrency,
        });
        logger.debug('corridor_ensured', { corridor_id: corridorId });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('ensure_corridor_failed', {
            corridor_id: corridorId,
            error: errorMessage,
            stack: errorStack,
        });
        throw error;
    }
};
exports.ensureCorridor = ensureCorridor;
const insertAttempt = async (pool, providerId, input, durationSeconds) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('insert_attempt_invalid_provider_id', { provider_id: providerId });
        return;
    }
    if (!input.corridorId || typeof input.corridorId !== 'string' || input.corridorId.trim().length === 0) {
        logger.warn('insert_attempt_invalid_corridor_id', { corridor_id: input.corridorId });
        return;
    }
    try {
        if (durationSeconds !== undefined) {
            (0, collector_metrics_1.recordCollection)(providerId, input.corridorId, input.success, durationSeconds, input.success ? undefined : (input.errorType ?? input.errorMessage ?? undefined));
        }
    }
    catch (error) {
        logger.debug('record_collection_metric_failed', {
            provider_id: providerId,
            corridor_id: input.corridorId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
    try {
        const repo = new repositories_1.QuoteAttemptRepository(pool);
        await repo.insertAttempt({
            providerId,
            corridorId: input.corridorId,
            amountBucket: input.amountBucket,
            payinMethod: input.payinMethod,
            payoutMethod: input.payoutMethod,
            success: input.success,
            errorType: input.errorType ?? null,
            httpStatus: input.httpStatus ?? null,
            errorMessage: input.errorMessage ?? null,
            bronzeObjectKey: input.bronzeObjectKey ?? null,
            requestFingerprint: input.requestFingerprint,
        });
        logger.debug('attempt_inserted', {
            provider_id: providerId,
            corridor_id: input.corridorId,
            success: input.success,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('insert_attempt_failed', {
            provider_id: providerId,
            corridor_id: input.corridorId,
            error: errorMessage,
            stack: errorStack,
        });
        // Don't throw - allow collector to continue
    }
};
exports.insertAttempt = insertAttempt;
const insertOpsAlert = async (pool, providerId, input) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('insert_ops_alert_invalid_provider_id', { provider_id: providerId });
        return null;
    }
    if (!input.corridorId || typeof input.corridorId !== 'string' || input.corridorId.trim().length === 0) {
        logger.warn('insert_ops_alert_invalid_corridor_id', { corridor_id: input.corridorId });
        return null;
    }
    try {
        const payload = {
            payin_method: input.payinMethod,
            payout_method: input.payoutMethod,
            collector_type: input.collectorType,
            trace_id: input.traceId,
            request_fingerprint: input.requestFingerprint,
        };
        const repo = new repositories_1.OpsAlertRepository(pool);
        const alertId = await repo.insertAlert({
            providerId,
            corridorId: input.corridorId,
            amountBucket: input.amountBucket,
            httpStatus: input.httpStatus,
            blockReason: input.blockReason,
            bronzeObjectKey: input.bronzeObjectKey,
            requestId: input.traceId,
            payload,
        });
        logger.debug('ops_alert_inserted', {
            provider_id: providerId,
            corridor_id: input.corridorId,
            alert_id: alertId,
            http_status: input.httpStatus,
        });
        if (alertId && opsAlertsQueueMode !== 'off') {
            const enqueued = await enqueueOpsAlert({
                alertId,
                providerId,
                corridorId: input.corridorId,
                amountBucket: input.amountBucket,
                httpStatus: input.httpStatus,
                blockReason: input.blockReason,
                bronzeObjectKey: input.bronzeObjectKey,
                requestId: input.traceId,
                payload,
                createdAt: new Date().toISOString(),
            });
            logger.debug('ops_alert_enqueued', {
                alert_id: alertId,
                provider_id: providerId,
                corridor_id: input.corridorId,
                enqueued,
                mode: opsAlertsQueueMode,
            });
        }
        if (input.blockReason) {
            await (0, exports.handleBlockDetectionAutoStop)(pool, providerId, input.corridorId, input.blockReason, input.httpStatus);
        }
        return alertId;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('insert_ops_alert_failed', {
            provider_id: providerId,
            corridor_id: input.corridorId,
            error: errorMessage,
            stack: errorStack,
        });
        // Don't throw - allow collector to continue
        return null;
    }
};
exports.insertOpsAlert = insertOpsAlert;
const handleBlockDetectionAutoStop = async (pool, providerId, corridorId, blockReason, httpStatus) => {
    if (!blockReason) {
        return;
    }
    try {
        const blockType = (0, services_1.getBlockTypeFromReason)(blockReason, httpStatus);
        const stoplistService = new services_1.StoplistService(pool);
        await stoplistService.handleBlockDetection(providerId, corridorId, blockType);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('auto_stop_on_block_failed', {
            provider_id: providerId,
            corridor_id: corridorId,
            block_reason: blockReason,
            http_status: httpStatus,
            error: errorMessage,
            stack: errorStack,
        });
        // Don't throw - allow collector to continue
    }
};
exports.handleBlockDetectionAutoStop = handleBlockDetectionAutoStop;
const markCorridorUnsupported = async (pool, providerId, corridorId, source) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('mark_corridor_unsupported_invalid_provider_id', { provider_id: providerId });
        return;
    }
    if (!corridorId || typeof corridorId !== 'string' || corridorId.trim().length === 0) {
        logger.warn('mark_corridor_unsupported_invalid_corridor_id', { corridor_id: corridorId });
        return;
    }
    try {
        const repo = new repositories_1.ProviderCapabilityRepository(pool);
        await repo.markCorridorUnsupported(providerId, corridorId, source);
        logger.debug('corridor_marked_unsupported', {
            provider_id: providerId,
            corridor_id: corridorId,
            source,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('mark_corridor_unsupported_failed', {
            provider_id: providerId,
            corridor_id: corridorId,
            source,
            error: errorMessage,
            stack: errorStack,
        });
        // Don't throw - allow collector to continue
    }
};
exports.markCorridorUnsupported = markCorridorUnsupported;
const persistNormalizedQuote = async (pool, normalized, collectorType) => {
    if (!normalized.provider_id || typeof normalized.provider_id !== 'string' || normalized.provider_id.trim().length === 0) {
        logger.warn('persist_quote_invalid_provider_id', { provider_id: normalized.provider_id });
        return;
    }
    if (!normalized.corridor_id || typeof normalized.corridor_id !== 'string' || normalized.corridor_id.trim().length === 0) {
        logger.warn('persist_quote_invalid_corridor_id', { corridor_id: normalized.corridor_id });
        return;
    }
    const span = tracer.startSpan('collector.persist_quote');
    span.setAttributes({
        'provider.id': normalized.provider_id,
        'corridor.id': normalized.corridor_id,
        'amount.bucket': normalized.amount_bucket,
    });
    let qualityFlags;
    try {
        qualityFlags = JSON.stringify(normalized.quality_flags);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn('quality_flags_serialization_failed', {
            provider_id: normalized.provider_id,
            corridor_id: normalized.corridor_id,
            error: errorMessage,
        });
        qualityFlags = '[]'; // Fallback to empty array
    }
    try {
        const quoteRepo = new repositories_1.QuoteRecordRepository(pool);
        await quoteRepo.insertQuoteAndUpsertLatest({
            quote: {
                providerId: normalized.provider_id,
                corridorId: normalized.corridor_id,
                amountBucket: normalized.amount_bucket,
                payin: normalized.payin,
                payout: normalized.payout,
                sendAmount: normalized.send_amount,
                feeAmount: normalized.fee_amount,
                promotionalFeeAmount: normalized.promotional_fee_amount,
                feeCurrency: normalized.fee_currency ?? null,
                totalDebitAmount: normalized.total_debit_amount,
                receiveAmount: normalized.receive_amount,
                impliedFxRate: normalized.implied_fx_rate,
                promotionalRate: normalized.promotional_rate,
                baseRate: normalized.base_rate,
                promotionalCapAmount: normalized.promotional_cap_amount,
                deliveryTimeMinMinutes: normalized.delivery_time_min_minutes ?? null,
                deliveryTimeMaxMinutes: normalized.delivery_time_max_minutes ?? null,
                status: 'ok',
                errorCode: null,
                errorMessage: null,
                collectedAt: normalized.collected_at,
                ingestedAt: normalized.ingested_at,
                ingestionRunId: normalized.ingestion_run_id,
                bronzeObjectKey: normalized.bronze_object_key,
                parserVersion: normalized.parser_version ?? null,
                qualityFlags,
            },
            latest: {
                corridorId: normalized.corridor_id,
                amountBucket: normalized.amount_bucket,
                payin: normalized.payin,
                payout: normalized.payout,
                providerId: normalized.provider_id,
                collectedAt: normalized.collected_at,
                sendAmount: normalized.send_amount,
                feeAmount: normalized.fee_amount,
                promotionalFeeAmount: normalized.promotional_fee_amount,
                totalDebitAmount: normalized.total_debit_amount,
                receiveAmount: normalized.receive_amount,
                impliedFxRate: normalized.implied_fx_rate,
                promotionalRate: normalized.promotional_rate,
                baseRate: normalized.base_rate,
                promotionalCapAmount: normalized.promotional_cap_amount,
                deliveryTimeMinMinutes: normalized.delivery_time_min_minutes ?? null,
                deliveryTimeMaxMinutes: normalized.delivery_time_max_minutes ?? null,
                status: 'ok',
                qualityFlags,
            },
        });
        logger.debug('quote_persisted', {
            provider_id: normalized.provider_id,
            corridor_id: normalized.corridor_id,
            amount_bucket: normalized.amount_bucket,
        });
        if (normalized.amount_bucket === 500) {
            await enqueueGoldLiveUpdate({
                corridorId: normalized.corridor_id,
                collectedAt: normalized.collected_at,
                amountBucket: normalized.amount_bucket,
                payin: normalized.payin,
                payout: normalized.payout,
                providerId: normalized.provider_id,
            }, collectorType);
        }
        span.end();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('persist_quote_failed', {
            provider_id: normalized.provider_id,
            corridor_id: normalized.corridor_id,
            error: errorMessage,
            stack: errorStack,
        });
        if (error instanceof Error) {
            span.recordException(error);
        }
        span.end();
        // Don't throw - allow collector to continue
    }
};
exports.persistNormalizedQuote = persistNormalizedQuote;
const runAnomalyDetection = async (input) => {
    if (!isTier1Collector(input.collectorType)) {
        return null;
    }
    if (!Number.isFinite(input.currentRate) || input.currentRate <= 0) {
        return null;
    }
    try {
        return await (0, anomaly_detector_1.detectAnomaly)(input.pool, input.corridorId, input.providerId, input.currentRate);
    }
    catch (error) {
        logger.warn('anomaly_detection_error', {
            provider_id: input.providerId,
            corridor_id: input.corridorId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return null;
    }
};
exports.runAnomalyDetection = runAnomalyDetection;
const pauseProviderForBlock = async (pool, providerId, corridorId, reason, cooldownMs) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('pause_provider_invalid_id', { provider_id: providerId });
        return;
    }
    try {
        const cooldownUntil = cooldownMs > 0 ? new Date(Date.now() + cooldownMs).toISOString() : null;
        const rightsRepo = new repositories_1.RightsMatrixRepository(pool);
        const circuitRepo = new repositories_1.CircuitBreakerRepository(pool);
        await rightsRepo.pauseProvider(providerId, `auto_paused:${reason}`);
        await circuitRepo.openCircuit(providerId, corridorId, reason, cooldownUntil);
        logger.debug('provider_paused', {
            provider_id: providerId,
            corridor_id: corridorId,
            reason,
            cooldown_ms: cooldownMs,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('pause_provider_failed', {
            provider_id: providerId,
            corridor_id: corridorId,
            reason,
            error: errorMessage,
            stack: errorStack,
        });
        // Don't throw - allow collector to continue
    }
};
exports.pauseProviderForBlock = pauseProviderForBlock;
const resumeProviderIfCooldownExpired = async (pool, providerId) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('resume_provider_invalid_id', { provider_id: providerId });
        return { canCollect: false, reason: 'invalid_provider_id' };
    }
    try {
        const rightsRepo = new repositories_1.RightsMatrixRepository(pool);
        const circuitRepo = new repositories_1.CircuitBreakerRepository(pool);
        const statusRow = await rightsRepo.getProviderStatus(providerId);
        if (!statusRow || statusRow.stoplist_status !== 'paused') {
            return { canCollect: true, reason: 'active' };
        }
        const notes = statusRow.notes ?? '';
        if (!notes.startsWith('auto_paused:')) {
            return { canCollect: false, reason: 'manual_stoplist' };
        }
        const openRows = await circuitRepo.loadOpenCircuits(providerId);
        const now = Date.now();
        const hasActiveCooldown = openRows.some((row) => {
            if (!row.cooldown_until)
                return true;
            return new Date(row.cooldown_until).getTime() > now;
        });
        if (hasActiveCooldown) {
            return { canCollect: false, reason: 'cooldown_active' };
        }
        await rightsRepo.setProviderActive(providerId);
        await circuitRepo.closeExpiredOpenCircuits(providerId);
        logger.debug('provider_resumed', { provider_id: providerId });
        return { canCollect: true, reason: 'auto_resume' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('resume_provider_failed', {
            provider_id: providerId,
            error: errorMessage,
            stack: errorStack,
        });
        // Return safe default - don't allow collection if we can't verify status
        return { canCollect: false, reason: 'resume_check_failed' };
    }
};
exports.resumeProviderIfCooldownExpired = resumeProviderIfCooldownExpired;
const loadActiveCircuits = async (pool, providerId) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('load_active_circuits_invalid_provider_id', { provider_id: providerId });
        return new Set();
    }
    try {
        const circuitRepo = new repositories_1.CircuitBreakerRepository(pool);
        const rows = await circuitRepo.loadOpenCircuits(providerId);
        const now = Date.now();
        const active = new Set();
        for (const row of rows) {
            if (!row.cooldown_until || new Date(row.cooldown_until).getTime() > now) {
                active.add(row.corridor_id);
            }
        }
        logger.debug('active_circuits_loaded', {
            provider_id: providerId,
            count: active.size,
        });
        return active;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('load_active_circuits_failed', {
            provider_id: providerId,
            error: errorMessage,
            stack: errorStack,
        });
        return new Set();
    }
};
exports.loadActiveCircuits = loadActiveCircuits;
const createIngestionRun = async (pool, providerId, collectorType, startedAt) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('create_ingestion_run_invalid_provider_id', { provider_id: providerId });
        throw new Error('Invalid provider ID');
    }
    const span = tracer.startSpan('collector.create_ingestion_run');
    span.setAttributes({
        'provider.id': providerId,
        'collector.type': collectorType,
    });
    try {
        const repo = new repositories_1.IngestionRunRepository(pool);
        const runId = await repo.insertRun({
            providerId,
            collectorType,
            startedAt,
            finishedAt: startedAt,
            status: 'success',
        });
        span.setAttribute('ingestion.run_id', runId);
        logger.debug('ingestion_run_created', {
            provider_id: providerId,
            collector_type: collectorType,
            run_id: runId,
        });
        span.end();
        return runId;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('create_ingestion_run_failed', {
            provider_id: providerId,
            collector_type: collectorType,
            error: errorMessage,
            stack: errorStack,
        });
        if (error instanceof Error) {
            span.recordException(error);
        }
        span.end();
        throw error;
    }
};
exports.createIngestionRun = createIngestionRun;
const finishIngestionRun = async (pool, runId, status, errorCode) => {
    if (!runId || typeof runId !== 'string' || runId.trim().length === 0) {
        logger.warn('finish_ingestion_run_invalid_id', { run_id: runId });
        return;
    }
    try {
        const repo = new repositories_1.IngestionRunRepository(pool);
        await repo.updateRunStatus(runId, status, errorCode);
        logger.debug('ingestion_run_finished', {
            run_id: runId,
            status,
            error_code: errorCode,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('finish_ingestion_run_failed', {
            run_id: runId,
            status,
            error_code: errorCode,
            error: errorMessage,
            stack: errorStack,
        });
        // Don't throw - allow collector to continue
    }
};
exports.finishIngestionRun = finishIngestionRun;
const fetchCircuitRow = async (pool, providerId, corridorId) => {
    const circuitRepo = new repositories_1.CircuitBreakerRepository(pool);
    return circuitRepo.getCircuitState(providerId, corridorId);
};
const computeCooldownMs = (cooldownUntil, now) => {
    if (!cooldownUntil)
        return null;
    const ts = new Date(cooldownUntil).getTime();
    if (!Number.isFinite(ts))
        return null;
    return Math.max(0, ts - now);
};
const recordCircuitOpen = async (pool, providerId, corridorId, reason, ttlMs) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('record_circuit_open_invalid_provider_id', { provider_id: providerId });
        return;
    }
    const span = tracer.startSpan('collector.circuit_open');
    span.setAttributes({
        'provider.id': providerId,
        'corridor.id': corridorId ?? 'global',
        'circuit.reason': reason,
        'circuit.ttl_ms': ttlMs,
    });
    try {
        const cooldownUntil = ttlMs > 0 ? new Date(Date.now() + ttlMs).toISOString() : null;
        const circuitRepo = new repositories_1.CircuitBreakerRepository(pool);
        await circuitRepo.openCircuit(providerId, corridorId, reason, cooldownUntil);
        try {
            (0, collector_metrics_1.updateCircuitBreakerState)(providerId, corridorId ?? 'global', 'open');
        }
        catch (error) {
            logger.warn('circuit_breaker_update_failed', {
                provider_id: providerId,
                corridor_id: corridorId ?? 'global',
                error: error instanceof Error ? error.message : String(error),
            });
        }
        logger.debug('circuit_opened', {
            provider_id: providerId,
            corridor_id: corridorId,
            reason,
            ttl_ms: ttlMs,
        });
        span.end();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('record_circuit_open_failed', {
            provider_id: providerId,
            corridor_id: corridorId,
            reason,
            error: errorMessage,
            stack: errorStack,
        });
        if (error instanceof Error) {
            span.recordException(error);
        }
        span.end();
        // Don't throw - allow collector to continue
    }
};
exports.recordCircuitOpen = recordCircuitOpen;
const recordCircuitHalfOpen = async (pool, providerId, corridorId, ttlMs) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('record_circuit_half_open_invalid_provider_id', { provider_id: providerId });
        return;
    }
    try {
        const cooldownUntil = ttlMs > 0 ? new Date(Date.now() + ttlMs).toISOString() : null;
        const circuitRepo = new repositories_1.CircuitBreakerRepository(pool);
        await circuitRepo.halfOpenCircuit(providerId, corridorId, cooldownUntil);
        try {
            (0, collector_metrics_1.updateCircuitBreakerState)(providerId, corridorId ?? 'global', 'half_open');
        }
        catch (error) {
            logger.warn('circuit_breaker_update_failed', {
                provider_id: providerId,
                corridor_id: corridorId ?? 'global',
                error: error instanceof Error ? error.message : String(error),
            });
        }
        logger.debug('circuit_half_opened', {
            provider_id: providerId,
            corridor_id: corridorId,
            ttl_ms: ttlMs,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('record_circuit_half_open_failed', {
            provider_id: providerId,
            corridor_id: corridorId,
            error: errorMessage,
            stack: errorStack,
        });
        // Don't throw - allow collector to continue
    }
};
exports.recordCircuitHalfOpen = recordCircuitHalfOpen;
const recordCircuitClosed = async (pool, providerId, corridorId) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('record_circuit_closed_invalid_provider_id', { provider_id: providerId });
        return;
    }
    try {
        const circuitRepo = new repositories_1.CircuitBreakerRepository(pool);
        await circuitRepo.closeCircuit(providerId, corridorId);
        try {
            (0, collector_metrics_1.updateCircuitBreakerState)(providerId, corridorId ?? 'global', 'closed');
        }
        catch (error) {
            logger.warn('circuit_breaker_update_failed', {
                provider_id: providerId,
                corridor_id: corridorId ?? 'global',
                error: error instanceof Error ? error.message : String(error),
            });
        }
        logger.debug('circuit_closed', {
            provider_id: providerId,
            corridor_id: corridorId,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('record_circuit_closed_failed', {
            provider_id: providerId,
            corridor_id: corridorId,
            error: errorMessage,
            stack: errorStack,
        });
        // Don't throw - allow collector to continue
    }
};
exports.recordCircuitClosed = recordCircuitClosed;
const loadCircuitStateFromDb = async (pool, providerId, corridorId, halfOpenMs) => {
    if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
        logger.warn('load_circuit_state_invalid_provider_id', { provider_id: providerId });
        return { state: 'closed', cooldownMs: null };
    }
    try {
        const row = await fetchCircuitRow(pool, providerId, corridorId);
        if (!row) {
            return { state: 'closed', cooldownMs: null };
        }
        const now = Date.now();
        const cooldownMs = computeCooldownMs(row.cooldown_until, now);
        if (row.state === 'open') {
            if (cooldownMs && cooldownMs > 0) {
                return { state: 'open', cooldownMs };
            }
            if (halfOpenMs > 0) {
                await (0, exports.recordCircuitHalfOpen)(pool, providerId, corridorId, halfOpenMs);
                return { state: 'half_open', cooldownMs: halfOpenMs };
            }
            await (0, exports.recordCircuitClosed)(pool, providerId, corridorId);
            return { state: 'closed', cooldownMs: null };
        }
        if (row.state === 'half_open') {
            if (cooldownMs && cooldownMs > 0) {
                return { state: 'half_open', cooldownMs };
            }
            await (0, exports.recordCircuitClosed)(pool, providerId, corridorId);
            return { state: 'closed', cooldownMs: null };
        }
        return { state: 'closed', cooldownMs: null };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('load_circuit_state_failed', {
            provider_id: providerId,
            corridor_id: corridorId,
            error: errorMessage,
            stack: errorStack,
        });
        return { state: 'closed', cooldownMs: null };
    }
};
exports.loadCircuitStateFromDb = loadCircuitStateFromDb;
