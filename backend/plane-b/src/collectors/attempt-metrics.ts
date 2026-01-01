import type { Pool } from 'pg'

import { query } from '../../../shared/db'

type AttemptMetricsRow = {
  avg_attempt_seconds: number | null
  sample_count: number | null
}

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

export const loadAttemptMetrics = async (
  pool: Pool,
  providerId: string,
  locale: string,
) => {
  const result = await query<AttemptMetricsRow>(
    `SELECT avg_attempt_seconds, sample_count
       FROM silver.collector_attempt_metrics
      WHERE provider_id = $1
        AND locale = $2`,
    [providerId, locale],
    pool,
  )
  const row = result.rows[0]
  const avgAttemptSeconds = isPositiveNumber(row?.avg_attempt_seconds)
    ? Number(row?.avg_attempt_seconds)
    : null
  const sampleCount = isPositiveNumber(row?.sample_count)
    ? Math.floor(Number(row?.sample_count))
    : 0
  return {
    avgAttemptSeconds,
    sampleCount,
  }
}

export const persistAttemptMetrics = async (
  pool: Pool,
  providerId: string,
  locale: string,
  avgAttemptSeconds: number,
  sampleCount: number,
) => {
  if (!isPositiveNumber(avgAttemptSeconds) || !isPositiveNumber(sampleCount)) {
    return
  }
  await query(
    `INSERT INTO silver.collector_attempt_metrics
     (provider_id, locale, avg_attempt_seconds, sample_count, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (provider_id, locale) DO UPDATE SET
       avg_attempt_seconds = EXCLUDED.avg_attempt_seconds,
       sample_count = EXCLUDED.sample_count,
       updated_at = NOW()`,
    [providerId, locale, avgAttemptSeconds, Math.floor(sampleCount)],
    pool,
  )
}
