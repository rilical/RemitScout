"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeBronzePayload = void 0;
const bronze_storage_1 = require("../../../shared/bronze-storage");
const logger_1 = require("../../../shared/logger");
const error_handling_1 = require("../../../shared/utils/error-handling");
const repositories_1 = require("../repositories");
const logger = (0, logger_1.createLogger)('plane-b.bronze-writer');
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const tryParseJson = (value) => {
    try {
        return JSON.parse(value);
    }
    catch (error) {
        logger.debug('bronze_payload_parse_failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
};
const normalizePayload = (payload) => {
    if (payload === undefined)
        return null;
    if (typeof payload === 'string') {
        const trimmed = payload.trim();
        if (!trimmed)
            return { raw: payload };
        const parsed = tryParseJson(trimmed);
        if (parsed === undefined)
            return { raw: payload };
        if (typeof parsed === 'string') {
            const reparsed = tryParseJson(parsed);
            if (reparsed !== undefined && typeof reparsed !== 'string') {
                return reparsed;
            }
            return { raw: parsed };
        }
        return parsed;
    }
    return payload;
};
const writeBronzePayload = async (pool, input) => {
    if (!input.provider_id || typeof input.provider_id !== 'string' || input.provider_id.trim().length === 0) {
        logger.warn('bronze_write_invalid_provider_id', { provider_id: input.provider_id });
        return null;
    }
    if (!input.corridor_id || typeof input.corridor_id !== 'string' || input.corridor_id.trim().length === 0) {
        logger.warn('bronze_write_invalid_corridor_id', { corridor_id: input.corridor_id });
        return null;
    }
    try {
        let payloadToStore = input.payload;
        // Check size if payload is a string
        if (typeof input.payload === 'string' && input.payload.length > MAX_PAYLOAD_SIZE) {
            logger.warn('bronze_payload_truncated', {
                provider_id: input.provider_id,
                corridor_id: input.corridor_id,
                original_size: input.payload.length,
                max_size: MAX_PAYLOAD_SIZE,
            });
            payloadToStore = input.payload.substring(0, MAX_PAYLOAD_SIZE) + '... [truncated]';
        }
        const normalized = normalizePayload(payloadToStore);
        // Convert to a clean JSON-serializable object for JSONB storage
        let payloadObject = null;
        try {
            if (normalized !== null && normalized !== undefined) {
                // Test serialization to ensure it's valid JSON
                const testSerialized = JSON.stringify(normalized);
                payloadObject = JSON.parse(testSerialized);
            }
            else {
                payloadObject = null;
            }
        }
        catch (error) {
            const { message } = (0, error_handling_1.formatError)(error);
            logger.warn('bronze_payload_serialization_failed', {
                provider_id: input.provider_id,
                corridor_id: input.corridor_id,
                error: message,
                payload_type: typeof normalized,
            });
            // Fallback: create a safe wrapper object that preserves data
            if (typeof normalized === 'string') {
                payloadObject = { raw: normalized, serialization_error: true };
            }
            else if (normalized && typeof normalized === 'object') {
                // Try to extract what we can using Object.getOwnPropertyNames
                try {
                    payloadObject = {
                        raw: JSON.stringify(normalized, Object.getOwnPropertyNames(normalized)),
                        serialization_error: true,
                    };
                }
                catch (nestedError) {
                    logger.warn('bronze_payload_serialization_fallback_failed', {
                        provider_id: input.provider_id,
                        corridor_id: input.corridor_id,
                        error: nestedError instanceof Error ? nestedError.message : String(nestedError),
                    });
                    payloadObject = { raw: String(normalized), serialization_error: true };
                }
            }
            else {
                payloadObject = { raw: String(normalized ?? 'null'), serialization_error: true };
            }
        }
        const s3Result = await (0, bronze_storage_1.writeBronzePayloadToS3)({
            providerId: input.provider_id,
            corridorId: input.corridor_id,
            payload: payloadObject,
        });
        const repo = new repositories_1.BronzeRepository(pool);
        const bronzeId = await repo.insertPayload({
            providerId: input.provider_id,
            corridorId: input.corridor_id,
            payload: payloadObject, // Pass object, let PostgreSQL handle JSONB conversion
            s3ObjectKey: s3Result?.uri ?? null,
        });
        logger.debug('bronze_payload_written', {
            provider_id: input.provider_id,
            corridor_id: input.corridor_id,
            bronze_id: bronzeId,
            s3_object_key: s3Result?.uri ?? null,
        });
        return bronzeId;
    }
    catch (error) {
        const { message, stack } = (0, error_handling_1.formatError)(error);
        logger.error('bronze_payload_write_failed', {
            provider_id: input.provider_id,
            corridor_id: input.corridor_id,
            error: message,
            stack,
        });
        const repo = new repositories_1.BronzeRepository(pool);
        await repo.recordFailedAttempt({
            providerId: input.provider_id,
            corridorId: input.corridor_id,
            amountBucket: input.amount_bucket ?? 0,
            payinMethod: input.payin_method ?? 'unknown',
            payoutMethod: input.payout_method ?? 'unknown',
            reason: message,
            attemptedAt: new Date(),
        });
        return null;
    }
};
exports.writeBronzePayload = writeBronzePayload;
