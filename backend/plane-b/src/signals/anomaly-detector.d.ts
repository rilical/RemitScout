import type { Pool } from 'pg';
export type AnomalyResult = {
    detected: boolean;
    zScore: number | null;
    direction: 'above' | 'below' | 'neutral' | null;
    currentRate: number;
    avg24h: number | null;
    stdDev24h: number | null;
    sampleCount: number;
};
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
export declare const detectAnomaly: (pool: Pool, corridorId: string, providerId: string, currentRate: number) => Promise<AnomalyResult>;
