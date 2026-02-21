"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProxyTierForCorridor = exports.getProxyForTierSync = exports.getProxyForTier = exports.getDefaultProxyTierForCollector = void 0;
const logger_1 = require("../../../shared/logger");
const aws_params_1 = require("../../../shared/aws-params");
const repositories_1 = require("../repositories");
const logger = (0, logger_1.createLogger)('plane-b.proxy-router');
const isProxyTier = (value) => value === 'RESIDENTIAL_PREMIUM' || value === 'DATACENTER_ROTATING' || value === 'NONE';
const getDefaultProxyTierForCollector = (collectorType) => {
    if (collectorType === 'b2b_tier_1' || collectorType === 'b2b_tier_1_alpha') {
        return 'RESIDENTIAL_PREMIUM';
    }
    if (collectorType === 'b2b_tier_2'
        || collectorType === 'b2b_tier_2_reference'
        || collectorType === 'b2b_observation'
        || collectorType === 'b2b_full_sweep_monthly') {
        return 'DATACENTER_ROTATING';
    }
    return 'NONE';
};
exports.getDefaultProxyTierForCollector = getDefaultProxyTierForCollector;
const proxyUrlCache = new Map();
let proxyUrlResolved = false;
/**
 * Resolves proxy URLs from Secrets Manager/SSM on first call.
 * Subsequent calls use cached values.
 */
const ensureProxyUrlsResolved = async () => {
    if (proxyUrlResolved)
        return;
    try {
        const [residential, datacenter] = await Promise.all([
            (0, aws_params_1.resolveProxyUrl)({
                envVar: 'PROXY_RESIDENTIAL_URL',
                secretArnEnv: 'PROXY_RESIDENTIAL_SECRET_ARN',
                ssmNameEnv: 'PROXY_RESIDENTIAL_SSM_NAME',
                jsonKey: 'url',
                required: false,
            }),
            (0, aws_params_1.resolveProxyUrl)({
                envVar: 'PROXY_DATACENTER_URL',
                secretArnEnv: 'PROXY_DATACENTER_SECRET_ARN',
                ssmNameEnv: 'PROXY_DATACENTER_SSM_NAME',
                jsonKey: 'url',
                required: false,
            }),
        ]);
        proxyUrlCache.set('RESIDENTIAL_PREMIUM', residential);
        proxyUrlCache.set('DATACENTER_ROTATING', datacenter);
        proxyUrlResolved = true;
    }
    catch (error) {
        logger.warn('proxy_url_resolution_failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        // Fallback to environment variables
        proxyUrlCache.set('RESIDENTIAL_PREMIUM', process.env.PROXY_RESIDENTIAL_URL || null);
        proxyUrlCache.set('DATACENTER_ROTATING', process.env.PROXY_DATACENTER_URL || null);
        proxyUrlResolved = true;
    }
};
const getProxyForTier = async (tier) => {
    await ensureProxyUrlsResolved();
    switch (tier) {
        case 'RESIDENTIAL_PREMIUM':
            return proxyUrlCache.get('RESIDENTIAL_PREMIUM') || null;
        case 'DATACENTER_ROTATING':
            return proxyUrlCache.get('DATACENTER_ROTATING') || null;
        case 'NONE':
            return null;
        default:
            logger.warn('unknown_proxy_tier', { tier });
            return null;
    }
};
exports.getProxyForTier = getProxyForTier;
/**
 * Synchronous version for backward compatibility.
 * Falls back to environment variables if not yet resolved.
 */
const getProxyForTierSync = (tier) => {
    if (proxyUrlResolved) {
        switch (tier) {
            case 'RESIDENTIAL_PREMIUM':
                return proxyUrlCache.get('RESIDENTIAL_PREMIUM') || null;
            case 'DATACENTER_ROTATING':
                return proxyUrlCache.get('DATACENTER_ROTATING') || null;
            case 'NONE':
                return null;
            default:
                return null;
        }
    }
    // Fallback to environment variables
    switch (tier) {
        case 'RESIDENTIAL_PREMIUM':
            return process.env.PROXY_RESIDENTIAL_URL || null;
        case 'DATACENTER_ROTATING':
            return process.env.PROXY_DATACENTER_URL || null;
        case 'NONE':
            return null;
        default:
            return null;
    }
};
exports.getProxyForTierSync = getProxyForTierSync;
const getProxyTierForCorridor = async (pool, corridorId, fallbackTier = 'NONE') => {
    try {
        const repo = new repositories_1.CorridorPriorityRepository(pool);
        const row = await repo.getProxyTier(corridorId);
        const proxyTier = row?.proxy_tier;
        if (isProxyTier(proxyTier)) {
            return proxyTier;
        }
        if (proxyTier) {
            logger.warn('unknown_proxy_tier', { corridor_id: corridorId, proxy_tier: proxyTier });
        }
    }
    catch (error) {
        logger.warn('proxy_tier_lookup_failed', { corridor_id: corridorId, error });
    }
    return fallbackTier;
};
exports.getProxyTierForCorridor = getProxyTierForCorridor;
