import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import { withRetry } from '../../../../shared/repository-retry'
import type {
  IIngestionRunRepository,
  IngestionRunDurationRecord,
  IngestionRunInsertInput,
} from '../interfaces/ingestion-run-repository.interface'

export class IngestionRunRepository implements IIngestionRunRepository {
  constructor(private readonly pool: Pool) {}

  async insertRun(input: IngestionRunInsertInput): Promise<string> {
    const result = await query<{ run_id: string }>(
      `INSERT INTO silver.ingestion_run
       (provider_id, collector_type, started_at, finished_at, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING run_id`,
      [input.providerId, input.collectorType, input.startedAt, input.finishedAt, input.status],
      this.pool,
    )
    return result.rows[0]?.run_id ?? ''
  }

  async updateRunStatus(
    runId: string,
    status: string,
    errorCode: string | null,
  ): Promise<void> {
    await query(
      `UPDATE silver.ingestion_run
       SET status = $1,
           finished_at = NOW(),
           error_code = $2
       WHERE run_id = $3`,
      [status, errorCode, runId],
      this.pool,
    )
  }

  async getLastSweepAgeSeconds(
    providerId: string,
    collectorType: string,
  ): Promise<number | null> {
    const result = await withRetry(() => query<{ age_seconds: number | null }>(
      `SELECT EXTRACT(EPOCH FROM (NOW() - COALESCE(finished_at, started_at))) AS age_seconds
         FROM silver.ingestion_run
        WHERE provider_id = $1
          AND collector_type = $2
        ORDER BY COALESCE(finished_at, started_at) DESC
        LIMIT 1`,
      [providerId, collectorType],
      this.pool,
    ))
    const age = result.rows[0]?.age_seconds
    return Number.isFinite(age) ? Number(age) : null
  }

  async loadLatestSweepDurations(): Promise<IngestionRunDurationRecord[]> {
    const result = await query<IngestionRunDurationRecord>(
      `SELECT DISTINCT ON (provider_id)
          provider_id,
          EXTRACT(EPOCH FROM (finished_at - started_at)) / 60.0 AS duration_minutes,
          finished_at,
          status
         FROM silver.ingestion_run
        WHERE collector_type IN (
          'b2b_tier_1',
          'b2b_tier_2',
          'b2b_tier_1_alpha',
          'b2b_tier_2_reference',
          'b2b_full_sweep',
          'b2b_full_sweep_monthly'
        )
          AND finished_at IS NOT NULL
        ORDER BY provider_id, finished_at DESC`,
      [],
      this.pool,
    )
    return result.rows
  }
}
