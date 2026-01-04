import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { formatError } from '../../../shared/utils/error-handling'
import { query } from '../../../shared/db'

const logger = createLogger('plane-b.collectors.checkpoint')

export type CheckpointState = {
  providerId: string
  collectorType: string
  ingestionRunId: string
  lastCorridorId: string | null
  lastAmountBucket: number | null
  completedCorridors: string[]
  startedAt: Date
  lastUpdatedAt: Date
}

/**
 * Saves checkpoint state for long-running collector sweeps.
 * Allows resuming from last processed corridor/bucket if task is interrupted.
 */
export const saveCheckpoint = async (
  pool: Pool,
  state: CheckpointState,
): Promise<void> => {
  try {
    await query(
      `INSERT INTO collector_checkpoints (
        provider_id, collector_type, ingestion_run_id,
        last_corridor_id, last_amount_bucket, completed_corridors,
        started_at, last_updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (provider_id, collector_type, ingestion_run_id)
      DO UPDATE SET
        last_corridor_id = EXCLUDED.last_corridor_id,
        last_amount_bucket = EXCLUDED.last_amount_bucket,
        completed_corridors = EXCLUDED.completed_corridors,
        last_updated_at = EXCLUDED.last_updated_at`,
      [
        state.providerId,
        state.collectorType,
        state.ingestionRunId,
        state.lastCorridorId,
        state.lastAmountBucket,
        JSON.stringify(state.completedCorridors),
        state.startedAt,
        state.lastUpdatedAt,
      ],
      pool,
    )
    logger.debug('checkpoint_saved', {
      provider_id: state.providerId,
      collector_type: state.collectorType,
      ingestion_run_id: state.ingestionRunId,
      last_corridor_id: state.lastCorridorId,
    })
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.warn('checkpoint_save_failed', {
      provider_id: state.providerId,
      collector_type: state.collectorType,
      error: message,
    })
    // Don't throw - checkpoint failures shouldn't stop collection
  }
}

/**
 * Loads checkpoint state for resuming a collector sweep.
 */
export const loadCheckpoint = async (
  pool: Pool,
  providerId: string,
  collectorType: string,
  ingestionRunId: string,
): Promise<CheckpointState | null> => {
  try {
    const result = await query<{
      provider_id: string
      collector_type: string
      ingestion_run_id: string
      last_corridor_id: string | null
      last_amount_bucket: number | null
      completed_corridors: string
      started_at: Date
      last_updated_at: Date
    }>(
      `SELECT * FROM collector_checkpoints
       WHERE provider_id = $1 AND collector_type = $2 AND ingestion_run_id = $3`,
      [providerId, collectorType, ingestionRunId],
      pool,
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      providerId: row.provider_id,
      collectorType: row.collector_type,
      ingestionRunId: row.ingestion_run_id,
      lastCorridorId: row.last_corridor_id,
      lastAmountBucket: row.last_amount_bucket,
      completedCorridors: JSON.parse(row.completed_corridors || '[]') as string[],
      startedAt: new Date(row.started_at),
      lastUpdatedAt: new Date(row.last_updated_at),
    }
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.warn('checkpoint_load_failed', {
      provider_id: providerId,
      collector_type: collectorType,
      error: message,
    })
    return null
  }
}

/**
 * Clears checkpoint state after successful completion.
 */
export const clearCheckpoint = async (
  pool: Pool,
  providerId: string,
  collectorType: string,
  ingestionRunId: string,
): Promise<void> => {
  try {
    await query(
      `DELETE FROM collector_checkpoints
       WHERE provider_id = $1 AND collector_type = $2 AND ingestion_run_id = $3`,
      [providerId, collectorType, ingestionRunId],
      pool,
    )
    logger.debug('checkpoint_cleared', {
      provider_id: providerId,
      collector_type: collectorType,
      ingestion_run_id: ingestionRunId,
    })
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.warn('checkpoint_clear_failed', {
      provider_id: providerId,
      collector_type: collectorType,
      error: message,
    })
  }
}


