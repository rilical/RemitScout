import type { Pool } from 'pg'

import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.signals.detector')

export const Z_SCORE_THRESHOLD = 2.0

export type AnomalyResult = {
  detected: boolean
  zScore: number | null
  currentRate: number
  avg24h: number | null
  stdDev24h: number | null
  sampleCount: number
}

export const detectAnomaly = async (
  pool: Pool,
  corridorId: string,
  providerId: string,
  currentRate: number,
): Promise<AnomalyResult> => {
  const baseline = await query<{
    avg_rate: number | null
    stddev_rate: number | null
    sample_count: number | null
  }>(
    `SELECT
       AVG(implied_fx_rate) AS avg_rate,
       STDDEV(implied_fx_rate) AS stddev_rate,
       COUNT(*) AS sample_count
     FROM silver.quote_record
     WHERE corridor_id = $1
       AND provider_id = $2
       AND collected_at >= NOW() - INTERVAL '24 hours'
       AND status = 'ok'
       AND implied_fx_rate > 0`,
    [corridorId, providerId],
    pool,
  )

  const row = baseline.rows[0]
  const avg24h = row?.avg_rate !== null && row?.avg_rate !== undefined
    ? Number(row.avg_rate)
    : null
  const stdDev24h = row?.stddev_rate !== null && row?.stddev_rate !== undefined
    ? Number(row.stddev_rate)
    : null
  const sampleCount = row?.sample_count !== null && row?.sample_count !== undefined
    ? Number(row.sample_count)
    : 0

  if (
    !Number.isFinite(avg24h ?? NaN)
    || !Number.isFinite(stdDev24h ?? NaN)
    || sampleCount < 10
  ) {
    return {
      detected: false,
      zScore: null,
      currentRate,
      avg24h,
      stdDev24h,
      sampleCount,
    }
  }

  const zScore = stdDev24h && stdDev24h > 0
    ? (currentRate - avg24h) / stdDev24h
    : 0
  const detected = zScore > Z_SCORE_THRESHOLD

  if (detected) {
    logger.warn('anomaly_detected', {
      corridor_id: corridorId,
      provider_id: providerId,
      z_score: zScore,
      current_rate: currentRate,
      avg_24h: avg24h,
      stddev_24h: stdDev24h,
      sample_count: sampleCount,
    })
  }

  return {
    detected,
    zScore,
    currentRate,
    avg24h,
    stdDev24h,
    sampleCount,
  }
}
