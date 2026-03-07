import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  CorridorStressRow,
  ITriangulatedIndexRepository,
  TriangulatedIndexRow,
} from '../interfaces/triangulated-index-repository.interface'

const stressLevelFromScore = (score: number | null): string => {
  if (score == null) return 'normal'
  if (score < 0.3) return 'normal'
  if (score < 0.6) return 'elevated'
  if (score < 0.8) return 'high'
  return 'critical'
}

export class TriangulatedIndexRepository implements ITriangulatedIndexRepository {
  constructor(private readonly pool: Pool) {}

  async getSeries(input: {
    corridorId: string
    amountBucket: number
    methodProfile: string
    startDate: Date
    endDate: Date
    methodology?: string
  }): Promise<TriangulatedIndexRow[]> {
    const conditions = [
      'corridor_id = $1',
      'amount_bucket = $2',
      'method_profile = $3',
      'date >= $4',
      'date <= $5',
    ]
    const params: unknown[] = [
      input.corridorId,
      input.amountBucket,
      input.methodProfile,
      input.startDate,
      input.endDate,
    ]

    if (input.methodology) {
      conditions.push('methodology_version = $6')
      params.push(input.methodology)
    }

    const result = await query<TriangulatedIndexRow>(
      `SELECT corridor_id, stress_score::double precision, date,
              amount_bucket, method_profile, methodology_version,
              triangulated_teer::double precision AS teer,
              triangulated_rci::double precision AS rci,
              composite_rvi_bps::double precision AS rvi_bps,
              confidence, COALESCE(contributing_signals, '[]'::jsonb) AS contributing_signals
         FROM gold_export.triangulated_index
        WHERE ${conditions.join(' AND ')}
        ORDER BY date ASC
        LIMIT 1000`,
      params,
      this.pool,
    )
    return result.rows.map((row) => ({
      ...row,
      stress_level: stressLevelFromScore(row.stress_score),
    }))
  }

  async getStressOverview(): Promise<CorridorStressRow[]> {
    const result = await query<CorridorStressRow>(
      `SELECT DISTINCT ON (corridor_id)
              corridor_id, stress_score::double precision, date,
              created_at AS computed_at,
              confidence
         FROM gold_export.triangulated_index
        ORDER BY corridor_id, date DESC`,
      [],
      this.pool,
    )
    return result.rows.map((row) => ({
      ...row,
      stress_level: stressLevelFromScore(row.stress_score),
    }))
  }
}
