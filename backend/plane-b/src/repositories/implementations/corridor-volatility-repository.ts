import type { Pool } from 'pg'

import { config } from '../../../../shared/config'
import { query } from '../../../../shared/db'
import { buildB2bEffectiveRateSql } from '../../../../shared/quote-rate'
import { computeVolatilityScore } from '../../../../shared/volatility-service'
import type {
  ICorridorVolatilityRepository,
  CorridorVolatilityRecord,
} from '../interfaces/corridor-volatility-repository.interface'

export class CorridorVolatilityRepository implements ICorridorVolatilityRepository {
  constructor(private readonly pool: Pool) {}

  async getVolatilityScore(corridorId: string): Promise<CorridorVolatilityRecord | null> {
    const result = await query<{
      corridor_id: string
      volatility_score: number
      sample_count: number
      mean_rate: number
      stddev_rate: number
      calculated_at: Date
    }>(
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

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      corridor_id: row.corridor_id,
      volatility_score: Number(row.volatility_score),
      sample_count: Number(row.sample_count),
      mean_rate: Number(row.mean_rate),
      stddev_rate: Number(row.stddev_rate),
      calculated_at: new Date(row.calculated_at),
    }
  }

  async getVolatilityScores(
    corridorIds: string[],
  ): Promise<Map<string, CorridorVolatilityRecord>> {
    if (corridorIds.length === 0) {
      return new Map()
    }

    const result = await query<{
      corridor_id: string
      volatility_score: number
      sample_count: number
      mean_rate: number
      stddev_rate: number
      calculated_at: Date
    }>(
      `SELECT DISTINCT ON (corridor_id)
        corridor_id,
        volatility_score,
        sample_count,
        mean_rate,
        stddev_rate,
        calculated_at
       FROM silver.corridor_volatility_cache
       WHERE corridor_id = ANY($1::text[])
       ORDER BY corridor_id, calculated_at DESC`,
      [corridorIds],
      this.pool,
    )

    const map = new Map<string, CorridorVolatilityRecord>()
    for (const row of result.rows) {
      map.set(row.corridor_id, {
        corridor_id: row.corridor_id,
        volatility_score: Number(row.volatility_score),
        sample_count: Number(row.sample_count),
        mean_rate: Number(row.mean_rate),
        stddev_rate: Number(row.stddev_rate),
        calculated_at: new Date(row.calculated_at),
      })
    }

    return map
  }

  async calculateVolatilityScore(
    corridorId: string,
  ): Promise<CorridorVolatilityRecord | null> {
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

    if (volatilityScore === null || meanRate === null || stddevRate === null) {
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
      mean_rate: meanRate,
      stddev_rate: stddevRate,
      calculated_at: new Date(),
    }
  }

  async upsertVolatilityForCorridors(
    corridorIds: string[],
  ): Promise<number> {
    if (corridorIds.length === 0) {
      return 0
    }

    const effectiveRateSql = buildB2bEffectiveRateSql('qr')
    const result = await query(
      `WITH stats AS (
         SELECT
           qr.corridor_id,
           AVG(${effectiveRateSql}) AS mean_rate,
           STDDEV(${effectiveRateSql}) AS stddev_rate,
           COUNT(*) AS sample_count
         FROM silver.quote_record qr
         JOIN silver.ingestion_run ir ON ir.run_id = qr.ingestion_run_id
         WHERE qr.corridor_id = ANY($1::text[])
           AND qr.collected_at >= NOW() - INTERVAL '7 days'
           AND qr.status = 'ok'
           AND (${effectiveRateSql}) IS NOT NULL
           AND (${effectiveRateSql}) > 0
           AND ir.collector_type LIKE 'b2b_%'
         GROUP BY qr.corridor_id
       ),
       scored AS (
         SELECT
           corridor_id,
           mean_rate,
           stddev_rate,
           sample_count,
           CASE
             WHEN mean_rate IS NULL OR stddev_rate IS NULL OR mean_rate = 0 OR sample_count < 10 THEN NULL
             ELSE LEAST(1.0, GREATEST(0.0, stddev_rate / mean_rate))
           END AS volatility_score
         FROM stats
       )
       INSERT INTO silver.corridor_volatility_cache
         (corridor_id, volatility_score, sample_count, mean_rate, stddev_rate, calculated_at)
       SELECT
         corridor_id,
         volatility_score,
         sample_count,
         mean_rate,
         stddev_rate,
         NOW()
       FROM scored
       WHERE volatility_score IS NOT NULL
       ON CONFLICT (corridor_id) DO UPDATE SET
         volatility_score = EXCLUDED.volatility_score,
         sample_count = EXCLUDED.sample_count,
         mean_rate = EXCLUDED.mean_rate,
         stddev_rate = EXCLUDED.stddev_rate,
         calculated_at = EXCLUDED.calculated_at`,
      [corridorIds],
      this.pool,
    )

    return result.rowCount ?? 0
  }
}
