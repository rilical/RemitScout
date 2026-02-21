/**
 * Configuration for anomaly detection system.
 *
 * Z_SCORE_THRESHOLD: Statistical significance threshold (default 2.0 = 95.4% confidence)
 *   - Z-score measures standard deviations from mean
 *   - 2.0σ captures ~95.4% of normal distribution
 *   - Higher values = fewer, more significant anomalies
 *
 * MIN_SAMPLE_COUNT: Minimum historical samples required (default 10)
 *   - Ensures statistical validity of baseline calculations
 *   - Too few samples = unreliable mean/stddev
 *
 * BASELINE_WINDOW_HOURS: Historical window for baseline stats (default 24h)
 *   - How far back to look for average/stddev calculation
 *   - Longer windows = more stable but less reactive
 */
export declare const ANOMALY_CONFIG: {
    readonly Z_SCORE_THRESHOLD: number;
    readonly MIN_SAMPLE_COUNT: number;
    readonly BASELINE_WINDOW_HOURS: number;
};
export type AnomalyConfig = typeof ANOMALY_CONFIG;
