import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  AttemptMetricsInput,
  AttemptMetricsRecord,
  IAttemptMetricsRepository,
} from '../interfaces/attempt-metrics-repository.interface'

export class AttemptMetricsRepository implements IAttemptMetricsRepository {
  constructor(private readonly pool: Pool) {}

  async getMetrics(
    providerId: string,
    locale: string,
  ): Promise<AttemptMetricsRecord | null> {
    const result = await query<AttemptMetricsRecord>(
      `SELECT avg_attempt_seconds, sample_count
         FROM silver.collector_attempt_metrics
        WHERE provider_id = $1
          AND locale = $2`,
      [providerId, locale],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async upsertMetrics(input: AttemptMetricsInput): Promise<void> {
    await query(
      `INSERT INTO silver.collector_attempt_metrics
       (provider_id, locale, avg_attempt_seconds, sample_count, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (provider_id, locale) DO UPDATE SET
         avg_attempt_seconds = EXCLUDED.avg_attempt_seconds,
         sample_count = EXCLUDED.sample_count,
         updated_at = NOW()`,
      [input.providerId, input.locale, input.avgAttemptSeconds, input.sampleCount],
      this.pool,
    )
  }
}
