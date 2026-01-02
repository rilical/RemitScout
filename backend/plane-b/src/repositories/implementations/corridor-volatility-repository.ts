import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
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
    const result = await query<{
      mean_rate: number | null
      stddev_rate: number | null
      sample_count: number
    }>(
      `SELECT 
        AVG(implied_fx_rate) AS mean_rate,
        STDDEV(implied_fx_rate) AS stddev_rate,
        COUNT(*) AS sample_count
       FROM silver.quote_record
       WHERE corridor_id = $1
         AND collected_at >= NOW() - INTERVAL '7 days'
         AND status = 'ok'
         AND implied_fx_rate > 0`,
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

    if (
      meanRate === null ||
      stddevRate === null ||
      !Number.isFinite(meanRate) ||
      !Number.isFinite(stddevRate) ||
      meanRate === 0 ||
      sampleCount < 10
    ) {
      return null
    }

    const coefficientOfVariation = stddevRate / meanRate
    const volatilityScore = Math.min(1.0, Math.max(0.0, coefficientOfVariation))

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
}

