/**
 * Scheduled Report Job — Weekly/Monthly corridor summary reports for institutional clients.
 *
 * Generates CSV reports with TEER/RCI/RVI trends, best provider, and volatility score
 * per corridor for each institutional client. White-labeled with `client_prefix`.
 *
 * Output: s3://remit-scout-exports-{env}/{client_prefix}/reports/weekly/YYYY-MM-DD/corridor-summary.csv
 *
 * Designed to run weekly via GitHub Actions or as a Plane C Lambda.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend scheduled-report
 * ```
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Pool } from 'pg'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing } from '../shared/tracing'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { formatError } from '../shared/utils/error-handling'
import { normalizeCorridorIds } from '../shared/corridor'
import { DEFAULT_AMOUNT_BUCKET } from '../shared/constants'
import { buildCsv } from './export-generators'

const logger = createLogger('script.scheduled-report-job')
const s3Client = new S3Client({})

initTracing('scheduled-report-job')

const JOB_NAME = 'scheduled-report-job'

type ReportSchedule = 'weekly' | 'monthly'

type InstitutionalClientRow = {
  client_id: string
  client_prefix: string
  corridors_allowed: unknown | null
  report_schedule: string
}

type CorridorSummaryRow = {
  corridor_id: string
  date: string
  teer_rate: number | null
  rci_ratio: number | null
  rvi_bps: number | null
  best_provider: string | null
  provider_count: number | null
  suppression_flag: boolean
  method_profile: string
}

const SUMMARY_CSV_HEADERS = [
  'date',
  'corridor_id',
  'method_profile',
  'teer_rate',
  'rci_ratio',
  'rvi_bps',
  'best_provider',
  'provider_count',
  'suppression_flag',
] as const

const toIsoDateOnly = (value: Date): string => value.toISOString().slice(0, 10)

const normalizeCorridorsAllowed = (raw: unknown): string[] | null => {
  if (raw === null || raw === undefined) return null
  if (Array.isArray(raw)) {
    const corridors = raw.map((value) => String(value ?? '').trim()).filter(Boolean)
    return normalizeCorridorIds(corridors)
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        const corridors = parsed.map((value) => String(value ?? '').trim()).filter(Boolean)
        return normalizeCorridorIds(corridors)
      }
      return []
    } catch {
      return []
    }
  }
  return []
}

const requireExportsBucket = (): string => {
  const bucket = config.storage.exports.bucket
  if (!bucket) {
    throw new Error('EXPORTS_S3_BUCKET not configured')
  }
  return bucket
}

const buildReportS3Key = (params: {
  clientPrefix: string
  schedule: ReportSchedule
  reportDate: Date
}): string => {
  const dateOnly = toIsoDateOnly(params.reportDate)
  const safePrefix = String(params.clientPrefix || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-')
  if (!safePrefix) throw new Error('client_prefix is required for report S3 key')
  return `${safePrefix}/reports/${params.schedule}/${dateOnly}/corridor-summary.csv`
}

const getReportWindowDays = (schedule: ReportSchedule): number => {
  return schedule === 'monthly' ? 30 : 7
}

const loadEligibleClients = async (
  pool: Pool,
  schedule: ReportSchedule,
): Promise<InstitutionalClientRow[]> => {
  const result = await query<InstitutionalClientRow>(
    `SELECT id AS client_id, client_prefix, corridors_allowed, report_schedule
       FROM public.institutional_client
      WHERE status = 'active'
        AND report_schedule = $1
      ORDER BY id ASC`,
    [schedule],
    pool,
  )
  return result.rows
}

const loadCorridorSummary = async (
  pool: Pool,
  params: {
    corridorIds: string[] | null
    windowDays: number
    amountBucket: number
  },
): Promise<CorridorSummaryRow[]> => {
  const result = await query<CorridorSummaryRow>(
    `SELECT
        date::text AS date,
        corridor_id,
        method_profile::text AS method_profile,
        teer_rate::double precision AS teer_rate,
        rci_ratio::double precision AS rci_ratio,
        rvi_bps::double precision AS rvi_bps,
        provider_count,
        suppression_flag
     FROM gold_export.cdp_daily
    WHERE date >= (CURRENT_DATE - ($1 || ' days')::interval)::date
      AND amount_bucket = $2
      AND ($3::text[] IS NULL OR corridor_id = ANY($3))
    ORDER BY corridor_id ASC, date ASC, method_profile ASC`,
    [params.windowDays, params.amountBucket, params.corridorIds],
    pool,
  )

  // Enrich with best provider from pulse cache if available
  const enrichedRows: CorridorSummaryRow[] = []
  for (const row of result.rows) {
    let bestProvider: string | null = null
    try {
      const providerResult = await query<{ best_provider: string | null }>(
        `SELECT (payload->>'bestProvider')::text AS best_provider
         FROM gold.pulse_cache
         WHERE key LIKE '%cost-trend%' || $1 || '%'
         LIMIT 1`,
        [row.corridor_id],
        pool,
      )
      bestProvider = providerResult.rows[0]?.best_provider ?? null
    } catch {
      // Best provider enrichment is optional
    }

    enrichedRows.push({ ...row, best_provider: bestProvider })
  }

  return enrichedRows
}

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
})

export const runScheduledReportJob = async (
  options: { schedule?: ReportSchedule } = {},
): Promise<void> => {
  if (isShutdownRequested()) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  const schedule: ReportSchedule = options.schedule ?? 'weekly'
  const bucket = requireExportsBucket()
  const dbUrl = config.db.planeCUrl || config.db.planeBUrl
  if (!dbUrl) throw new Error('DATABASE_URL not configured')

  const pool = createPool(dbUrl)
  const lock = new WorkerLock(JOB_NAME, 600)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    return
  }

  const startTime = Date.now()
  const reportDate = new Date()
  const amountBucket = DEFAULT_AMOUNT_BUCKET ?? 500

  try {
    logger.info('job_start', { schedule })
    await recordBatchJobMetric(JOB_NAME, 'job_start')

    const clients = await loadEligibleClients(pool, schedule)
    if (clients.length === 0) {
      logger.info('job_no_clients', { schedule })
      await recordBatchJobMetric(JOB_NAME, 'job_complete')
      return
    }

    logger.info('job_clients_loaded', { schedule, count: clients.length })

    const windowDays = getReportWindowDays(schedule)
    let reportsUploaded = 0

    for (const client of clients) {
      if (isShutdownRequested()) {
        logger.info('job_interrupted', { reason: 'shutdown_requested', reports_uploaded: reportsUploaded })
        break
      }

      const corridorIds = normalizeCorridorsAllowed(client.corridors_allowed)

      try {
        const rows = await loadCorridorSummary(pool, {
          corridorIds,
          windowDays,
          amountBucket,
        })

        if (rows.length === 0) {
          logger.info('client_no_data', {
            client_prefix: client.client_prefix,
            corridors: corridorIds?.length ?? 'all',
          })
          continue
        }

        const csvRows = rows.map((row) => ({
          date: row.date,
          corridor_id: row.corridor_id,
          method_profile: row.method_profile,
          teer_rate: row.teer_rate,
          rci_ratio: row.rci_ratio,
          rvi_bps: row.rvi_bps,
          best_provider: row.best_provider,
          provider_count: row.provider_count,
          suppression_flag: row.suppression_flag,
        }))

        const csvContent = buildCsv([...SUMMARY_CSV_HEADERS], csvRows)
        const s3Key = buildReportS3Key({
          clientPrefix: client.client_prefix,
          schedule,
          reportDate,
        })

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: s3Key,
            Body: csvContent,
            ContentType: 'text/csv; charset=utf-8',
            Metadata: {
              'report-schedule': schedule,
              'report-date': toIsoDateOnly(reportDate),
              'client-prefix': client.client_prefix,
              'window-days': String(windowDays),
              'row-count': String(rows.length),
            },
          }),
        )

        reportsUploaded += 1
        logger.info('report_uploaded', {
          client_prefix: client.client_prefix,
          s3_key: s3Key,
          rows: rows.length,
        })
      } catch (error) {
        logger.error('client_report_failed', {
          client_prefix: client.client_prefix,
          error: formatError(error),
        })
      }
    }

    const durationMs = Date.now() - startTime
    logger.info('job_complete', {
      schedule,
      clients_processed: clients.length,
      reports_uploaded: reportsUploaded,
      duration_ms: durationMs,
    })
    await recordBatchJobMetric(JOB_NAME, 'job_complete', durationMs / 1000, {
      schedule,
      clients_processed: String(clients.length),
      reports_uploaded: String(reportsUploaded),
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    logger.error('job_failed', {
      error: formatError(error),
      duration_ms: durationMs,
    })
    await recordBatchJobMetric(JOB_NAME, 'job_failure', durationMs / 1000, {
      schedule,
    })
    throw error
  } finally {
    await lock.release().catch(() => {})
    await pool.end()
  }
}

if (require.main === module) {
  const schedule = (process.env.REPORT_SCHEDULE ?? 'weekly') as ReportSchedule
  runScheduledReportJob({ schedule })
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('job_fatal_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
