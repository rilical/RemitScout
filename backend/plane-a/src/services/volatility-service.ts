import type { Pool } from 'pg'

import { config } from '../../../shared/config'
import { query } from '../../../shared/db'
import { buildB2bEffectiveRateSql } from '../../../shared/quote-rate'
import {
  VolatilityService as SharedVolatilityService,
  type CacheTtlResult,
  type VolatilityRecord,
  type VolatilityRepository,
  computeVolatilityScore,
} from '../../../shared/volatility-service'

class PlaneAVolatilityRepository implements VolatilityRepository {
  constructor(private readonly pool: Pool) {}

  async getVolatilityScore(corridorId: string): Promise<VolatilityRecord | null> {
    const result = await query<VolatilityRecord>(
      `SELECT
        corridor_id,
        volatility_score,
        sample_count,
        mean_rate,
        stddev_rate,
        calculated_at
       FROM silver.corridor_volatility_cache
       WHERE corridor_id = $1
       ORDER BY calculated_at DESC
       LIMIT 1`,
      [corridorId],
      this.pool,
    )

    const row = result.rows[0]
    if (!row) return null

    // `numeric` columns from Postgres can arrive as strings in Node `pg`.
    // Normalize to numbers so tier thresholds work correctly.
    return {
      corridor_id: row.corridor_id,
      volatility_score: Number((row as any).volatility_score),
      sample_count: Number((row as any).sample_count),
      mean_rate: Number((row as any).mean_rate),
      stddev_rate: Number((row as any).stddev_rate),
      calculated_at: new Date((row as any).calculated_at),
    }
  }

  async calculateVolatilityScore(corridorId: string): Promise<VolatilityRecord | null> {
    const allowOnDemand = config.volatility.cacheOnDemand
    if (!allowOnDemand) {
      return null
    }

    const effectiveRateSql = buildB2bEffectiveRateSql('qr')
    const result = await query<{
      mean_rate: number | null
      stddev_rate: number | null
      sample_count: number
    }>(
      `SELECT
        AVG(${effectiveRateSql}) AS mean_rate,
        STDDEV(${effectiveRateSql}) AS stddev_rate,
        COUNT(*) AS sample_count
       FROM silver.quote_record qr
       JOIN silver.ingestion_run ir ON ir.run_id = qr.ingestion_run_id
       WHERE qr.corridor_id = $1
         AND qr.collected_at >= NOW() - INTERVAL '7 days'
         AND qr.status = 'ok'
         AND (${effectiveRateSql}) IS NOT NULL
         AND (${effectiveRateSql}) > 0
         AND ir.collector_type LIKE 'b2b_%'`,
      [corridorId],
      this.pool,
    )

    const row = result.rows[0]
    if (!row) {
      return null
    }

    const meanRate = row.mean_rate !== null ? Number(row.mean_rate) : null
    const stddevRate = row.stddev_rate !== null ? Number(row.stddev_rate) : null
    const sampleCount = Number(row.sample_count)
    const volatilityScore = computeVolatilityScore({
      meanRate,
      stddevRate,
      sampleCount,
    })

    if (volatilityScore === null) {
      return null
    }

    await query(
      `INSERT INTO silver.corridor_volatility_cache
       (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (corridor_id) DO UPDATE SET
         volatility_score = EXCLUDED.volatility_score,
         sample_count = EXCLUDED.sample_count,
         mean_rate = EXCLUDED.mean_rate,
         stddev_rate = EXCLUDED.stddev_rate,
         calculated_at = EXCLUDED.calculated_at`,
      [corridorId, volatilityScore, sampleCount, meanRate, stddevRate],
      this.pool,
    )

    return {
      corridor_id: corridorId,
      volatility_score: volatilityScore,
      sample_count: sampleCount,
      mean_rate: meanRate ?? 0,
      stddev_rate: stddevRate ?? 0,
      calculated_at: new Date(),
    }
  }
}

export class VolatilityService {
  private readonly service: SharedVolatilityService

  constructor(pool: Pool) {
    this.service = new SharedVolatilityService(new PlaneAVolatilityRepository(pool))
  }

  getCacheTtlForCorridor(corridorId: string): Promise<CacheTtlResult> {
    return this.service.getCacheTtlForCorridor(corridorId)
  }
}
