import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { createLogger } from '../../../shared/logger'
import type { JobHandler, JobContext, JobResult, JobStatus } from '../../../shared/types/job'
import {
  getObservationSignalLayer,
  type ObservationEnvelope,
  type ObservationType,
  type ObservationConfidence,
  type ObservationOwnerKind,
} from '../../../shared/types/observation'
import { getCurrentTraceCorrelation } from '../../../shared/types/correlation'

/**
 * Abstract base class for job handlers in the agent-native platform.
 *
 * Provides common lifecycle management:
 * - Job run record creation/finalization in `silver.job_run`
 * - Observation emission to `silver.observation`
 * - Structured logging
 * - Duration tracking
 */
export abstract class BaseJobHandler implements JobHandler {
  abstract readonly handlerType: string

  protected readonly logger: ReturnType<typeof createLogger>

  constructor(loggerName?: string) {
    this.logger = createLogger(loggerName ?? 'plane-b.handlers.base')
  }

  /**
   * Subclass-specific execution logic.
   * Implement this instead of `execute` directly.
   */
  protected abstract run(context: JobContext): Promise<JobResult>

  /**
   * Executes the job with lifecycle tracking.
   */
  async execute(context: JobContext): Promise<JobResult> {
    const startedAt = Date.now()
    const pool = context.pool as Pool

    await this.markJobRunStatus(pool, context.jobRunId, 'running', { startedAt: new Date().toISOString() })

    try {
      const result = await this.run(context)

      await this.markJobRunStatus(pool, context.jobRunId, result.success ? 'completed' : 'failed', {
        completedAt: new Date().toISOString(),
        itemsProcessed: result.itemsProcessed,
        itemsFailed: result.itemsFailed,
        durationMs: result.durationMs,
        errorMessage: result.error?.message ?? null,
        errorType: result.error?.name ?? null,
      })

      return result
    } catch (err) {
      const durationMs = Date.now() - startedAt
      const error = err instanceof Error ? err : new Error(String(err))

      await this.markJobRunStatus(pool, context.jobRunId, 'failed', {
        completedAt: new Date().toISOString(),
        durationMs,
        errorMessage: error.message,
        errorType: error.name,
      })

      return {
        success: false,
        itemsProcessed: 0,
        itemsFailed: 0,
        durationMs,
        error,
      }
    }
  }

  /**
   * Creates a new job run record in `silver.job_run`.
   */
  async createJobRun(
    pool: Pool,
    moduleId: string,
    jobType: string,
    metadata: Record<string, unknown> = {},
  ): Promise<string> {
    const jobRunId = randomUUID()
    await pool.query(
      `INSERT INTO silver.job_run (job_run_id, module_id, job_type, status, metadata)
       VALUES ($1, $2, $3, 'pending', $4)`,
      [jobRunId, moduleId, jobType, JSON.stringify(metadata)],
    )
    return jobRunId
  }

  /**
   * Updates a job run's status and metadata fields.
   */
  protected async markJobRunStatus(
    pool: Pool,
    jobRunId: string,
    status: JobStatus,
    fields: Record<string, unknown> = {},
  ): Promise<void> {
    const setClauses: string[] = ['status = $2', 'updated_at = NOW()']
    const values: unknown[] = [jobRunId, status]
    let paramIndex = 3

    if (fields.startedAt !== undefined) {
      setClauses.push(`started_at = $${paramIndex}`)
      values.push(fields.startedAt)
      paramIndex++
    }
    if (fields.completedAt !== undefined) {
      setClauses.push(`completed_at = $${paramIndex}`)
      values.push(fields.completedAt)
      paramIndex++
    }
    if (fields.itemsProcessed !== undefined) {
      setClauses.push(`items_processed = $${paramIndex}`)
      values.push(fields.itemsProcessed)
      paramIndex++
    }
    if (fields.itemsFailed !== undefined) {
      setClauses.push(`items_failed = $${paramIndex}`)
      values.push(fields.itemsFailed)
      paramIndex++
    }
    if (fields.durationMs !== undefined) {
      setClauses.push(`duration_ms = $${paramIndex}`)
      values.push(fields.durationMs)
      paramIndex++
    }
    if (fields.errorMessage !== undefined) {
      setClauses.push(`error_message = $${paramIndex}`)
      values.push(fields.errorMessage)
      paramIndex++
    }
    if (fields.errorType !== undefined) {
      setClauses.push(`error_type = $${paramIndex}`)
      values.push(fields.errorType)
      paramIndex++
    }

    await pool.query(
      `UPDATE silver.job_run SET ${setClauses.join(', ')} WHERE job_run_id = $1`,
      values,
    )
  }

  /**
   * Emits an observation to `silver.observation`.
   *
   * Behind the `EMIT_OBSERVATIONS` feature flag — when disabled, observations
   * are logged but not persisted.
   */
  protected async emitObservation<T>(
    pool: Pool,
    envelope: Omit<ObservationEnvelope<T>, 'observationId' | 'ingestedAt' | 'schemaVersion'>,
  ): Promise<string> {
    const observationId = randomUUID()
    const emitEnabled = process.env.EMIT_OBSERVATIONS === 'true'

    if (!emitEnabled) {
      this.logger.debug('observation_skipped', { type: envelope.type, moduleId: envelope.moduleId })
      return observationId
    }

    await pool.query(
      `INSERT INTO silver.observation
       (observation_id, module_id, provider_id, owner_kind, owner_id, type, signal_layer,
        capture_method, parser_version, source_ref, corridor_id, amount_bucket,
        confidence, observed_at, ingested_at, ingestion_run_id, payload, lineage,
        trace_id, parent_span_id, schema_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7,
               $8, $9, $10, $11, $12,
               $13, $14, NOW(), $15, $16, $17,
               $18, $19, $20)`,
      [
        observationId,
        envelope.moduleId,
        envelope.providerId,
        envelope.ownerKind,
        envelope.ownerId,
        envelope.type,
        envelope.signalLayer,
        envelope.captureMethod,
        envelope.parserVersion,
        envelope.sourceRef,
        envelope.corridorId,
        envelope.amountBucket,
        envelope.confidence,
        envelope.observedAt,
        envelope.ingestionRunId,
        JSON.stringify(envelope.payload),
        JSON.stringify(envelope.lineage ?? {}),
        envelope.trace?.traceId ?? null,
        envelope.trace?.parentSpanId ?? null,
        1,
      ],
    )

    this.logger.debug('observation_emitted', { observationId, type: envelope.type })
    return observationId
  }

  /**
   * Helper to build a standard ObservationEnvelope.
   */
  protected buildObservation<T>(
    moduleId: string,
    providerId: string,
    type: ObservationType,
    payload: T,
    options: {
      corridorId?: string
      amountBucket?: number
      confidence?: ObservationConfidence
      ingestionRunId: string
      ownerKind?: ObservationOwnerKind
      ownerId?: string
      captureMethod?: string | null
      parserVersion?: string | null
      sourceRef?: string | null
      lineage?: Record<string, unknown>
    },
  ): Omit<ObservationEnvelope<T>, 'observationId' | 'ingestedAt' | 'schemaVersion'> {
    return {
      moduleId,
      providerId,
      ownerKind: options.ownerKind ?? 'provider',
      ownerId: options.ownerId ?? providerId,
      type,
      signalLayer: getObservationSignalLayer(type),
      captureMethod: options.captureMethod ?? null,
      parserVersion: options.parserVersion ?? null,
      sourceRef: options.sourceRef ?? null,
      corridorId: options.corridorId ?? null,
      amountBucket: options.amountBucket ?? null,
      confidence: options.confidence ?? 'medium',
      observedAt: new Date().toISOString(),
      ingestionRunId: options.ingestionRunId,
      payload,
      lineage: options.lineage ?? {},
      trace: getCurrentTraceCorrelation(),
    }
  }
}
