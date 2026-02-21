"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAnomaly = void 0;
const logger_1 = require("../../../shared/logger");
const repositories_1 = require("../repositories");
const anomaly_config_1 = require("./anomaly-config");
const logger = (0, logger_1.createLogger)('plane-b.signals.detector');
/**
 * Detects statistical anomalies in FX rates using Z-score analysis.
 *
 * This function identifies when a provider's exchange rate deviates significantly
 * from its historical baseline, which may indicate:
 * - Arbitrage opportunities (rate unusually good)
 * - Data quality issues (rate unusually bad)
 * - Market volatility events
 *
 * **Statistical Method:**
 * - Calculates Z-score: (current_rate - mean) / std_dev
 * - Z-score measures standard deviations from historical mean
 * - Threshold of 2.0σ = 95.4% confidence interval
 * - Detects both positive (above) and negative (below) deviations
 *
 * **Requirements:**
 * - Minimum 10 samples in 24h window (configurable)
 * - Valid statistical baseline (finite mean & std dev)
 * - Current rate must be finite and positive
 *
 * @param pool - PostgreSQL connection pool
 * @param corridorId - Remittance corridor (e.g., "USA-US-MEX-MX")
 * @param providerId - Provider identifier (e.g., "remitly")
 * @param currentRate - Current implied FX rate to check
 * @returns AnomalyResult with detection status, Z-score, and direction
 *
 * @example
 * const result = await detectAnomaly(pool, "USA-US-MEX-MX", "remitly", 18.45)
 * if (result.detected) {
 *   console.log(`Anomaly: rate ${result.direction} baseline by ${result.zScore}σ`)
 * }
 */
const detectAnomaly = async (pool, corridorId, providerId, currentRate) => {
    const repo = new repositories_1.QuoteRecordRepository(pool);
    const row = await repo.getBaselineStats(corridorId, providerId);
    const avg24h = row?.avg_rate != null ? Number(row.avg_rate) : null;
    const stdDev24h = row?.stddev_rate != null ? Number(row.stddev_rate) : null;
    const sampleCount = row?.sample_count != null ? Number(row.sample_count) : 0;
    if (!Number.isFinite(avg24h ?? NaN)
        || !Number.isFinite(stdDev24h ?? NaN)
        || sampleCount < anomaly_config_1.ANOMALY_CONFIG.MIN_SAMPLE_COUNT) {
        return {
            detected: false,
            zScore: null,
            direction: null,
            currentRate,
            avg24h,
            stdDev24h,
            sampleCount,
        };
    }
    const zScore = stdDev24h && stdDev24h > 0 && avg24h !== null
        ? (currentRate - avg24h) / stdDev24h
        : 0;
    const detected = Math.abs(zScore) > anomaly_config_1.ANOMALY_CONFIG.Z_SCORE_THRESHOLD;
    const direction = zScore > 0
        ? 'above'
        : zScore < 0
            ? 'below'
            : 'neutral';
    if (detected) {
        logger.warn('anomaly_detected', {
            corridor_id: corridorId,
            provider_id: providerId,
            z_score: zScore,
            direction,
            current_rate: currentRate,
            avg_24h: avg24h,
            stddev_24h: stdDev24h,
            sample_count: sampleCount,
        });
    }
    return {
        detected,
        zScore,
        direction,
        currentRate,
        avg24h,
        stdDev24h,
        sampleCount,
    };
};
exports.detectAnomaly = detectAnomaly;
