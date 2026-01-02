import type { Pool } from 'pg'

import { createLogger } from '../../../shared/logger'
import { QuoteRecordRepository } from '../repositories'
import { ANOMALY_CONFIG } from './anomaly-config'

const logger = createLogger('plane-b.signals.detector')

export type AnomalyResult = {
  detected: boolean
  zScore: number | null
  direction: 'above' | 'below' | 'neutral' | null
  currentRate: number
  avg24h: number | null
  stdDev24h: number | null
  sampleCount: number
}

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
export const detectAnomaly = async (
  pool: Pool,
  corridorId: string,
  providerId: string,
  currentRate: number,
): Promise<AnomalyResult> => {
  const repo = new QuoteRecordRepository(pool)
  const row = await repo.getBaselineStats(corridorId, providerId)
  
  const avg24h = row?.avg_rate != null ? Number(row.avg_rate) : null
  const stdDev24h = row?.stddev_rate != null ? Number(row.stddev_rate) : null
  const sampleCount = row?.sample_count != null ? Number(row.sample_count) : 0

  if (
    !Number.isFinite(avg24h ?? NaN)
    || !Number.isFinite(stdDev24h ?? NaN)
    || sampleCount < ANOMALY_CONFIG.MIN_SAMPLE_COUNT
  ) {
    return {
      detected: false,
      zScore: null,
      direction: null,
      currentRate,
      avg24h,
      stdDev24h,
      sampleCount,
    }
  }

  const zScore = stdDev24h && stdDev24h > 0 && avg24h !== null
    ? (currentRate - avg24h) / stdDev24h
    : 0
  
  const detected = Math.abs(zScore) > ANOMALY_CONFIG.Z_SCORE_THRESHOLD
  const direction: 'above' | 'below' | 'neutral' = zScore > 0 
    ? 'above' 
    : zScore < 0 
      ? 'below' 
      : 'neutral'

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
    })
  }

  return {
    detected,
    zScore,
    direction,
    currentRate,
    avg24h,
    stdDev24h,
    sampleCount,
  }
}
