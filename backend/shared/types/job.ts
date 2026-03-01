/**
 * Job lifecycle states.
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out'

/**
 * Job run record — persisted to `silver.job_run`.
 *
 * Tracks execution of collection jobs, agent actions, and maintenance tasks.
 */
export type JobRun = {
  /** Unique job run ID (UUID v4) */
  jobRunId: string
  /** Module that this job belongs to */
  moduleId: string
  /** Type of job (e.g., 'collection', 'repair', 'probe', 'evaluation') */
  jobType: string
  /** Current status */
  status: JobStatus
  /** ISO 8601 timestamp when the job was queued */
  queuedAt: string
  /** ISO 8601 timestamp when the job started executing */
  startedAt: string | null
  /** ISO 8601 timestamp when the job completed */
  completedAt: string | null
  /** Number of items processed */
  itemsProcessed: number
  /** Number of items that failed */
  itemsFailed: number
  /** Duration in milliseconds */
  durationMs: number | null
  /** Error message if failed */
  errorMessage: string | null
  /** Error type classification */
  errorType: string | null
  /** Attempt number (for retries) */
  attempt: number
  /** Maximum attempts allowed */
  maxAttempts: number
  /** Metadata specific to the job type */
  metadata: Record<string, unknown>
}

/**
 * JobHandler interface — the contract for all job execution handlers.
 *
 * Implementations process specific job types (collection, repair, probe, etc.)
 * and produce observations + job run records.
 */
export interface JobHandler {
  /** Unique handler type identifier */
  readonly handlerType: string
  /** Execute the job */
  execute(context: JobContext): Promise<JobResult>
}

/**
 * Context passed to job handlers.
 */
export type JobContext = {
  /** Database pool (pg.Pool) */
  pool: unknown
  /** Job run ID for tracking */
  jobRunId: string
  /** Module being processed */
  moduleId: string
  /** Corridors to process (empty = all) */
  corridors: string[]
  /** Amount buckets to process (empty = all) */
  amountBuckets: number[]
  /** Abort signal for graceful shutdown */
  signal?: AbortSignal
  /** Additional handler-specific parameters */
  params: Record<string, unknown>
}

/**
 * Result returned by job handlers.
 */
export type JobResult = {
  /** Whether the job succeeded */
  success: boolean
  /** Number of items processed */
  itemsProcessed: number
  /** Number of items that failed */
  itemsFailed: number
  /** Duration in milliseconds */
  durationMs: number
  /** Error if the job failed */
  error?: Error
  /** Handler-specific result metadata */
  metadata?: Record<string, unknown>
}
