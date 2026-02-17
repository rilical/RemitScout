/**
 * Institutional Daily Export Job
 *
 * Writes per-client daily CSV drops for TEER/RCI/RVI from `gold_export.cdp_daily` to:
 *   s3://remit-scout-exports-{env}/indices/{client_prefix}/daily/YYYY/MM/DD/{teer|rci|rvi}.csv
 *
 * Designed to run as a Plane C scheduled Lambda after gold-indices recomputes.
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

const logger = createLogger('script.institutional-daily-export-job')
const s3Client = new S3Client({})

export const INSTITUTIONAL_EXPORT_JOB_NAME = 'institutional-daily-export-job'
export const INSTITUTIONAL_EXPORT_PREFIX = 'indices'

export const INSTITUTIONAL_EXPORT_TEER_HEADERS = [
  'date',
  'corridor_id',
  'amount_bucket',
  'method_profile',
  'teer_rate',
  'mid_market_rate',
  'provider_count',
  'provider_count_binned',
  'suppression_flag',
  'suppression_reason',
  'weight_confidence',
  'weight_window_days',
  'weighting_model',
  'methodology_version',
  'created_at',
] as const

export const INSTITUTIONAL_EXPORT_RCI_HEADERS = [
  'date',
  'corridor_id',
  'amount_bucket',
  'method_profile',
  'rci_ratio',
  'mid_market_rate',
  'provider_count',
  'provider_count_binned',
  'suppression_flag',
  'suppression_reason',
  'weight_confidence',
  'weight_window_days',
  'weighting_model',
  'methodology_version',
  'created_at',
] as const

export const INSTITUTIONAL_EXPORT_RVI_HEADERS = [
  'date',
  'corridor_id',
  'amount_bucket',
  'method_profile',
  'rvi_bps',
  'mid_market_rate',
  'provider_count',
  'provider_count_binned',
  'suppression_flag',
  'suppression_reason',
  'weight_confidence',
  'weight_window_days',
  'weighting_model',
  'methodology_version',
  'created_at',
] as const

type InstitutionalExportKind = 'teer' | 'rci' | 'rvi'

type InstitutionalClientRow = {
  client_id: string
  client_prefix: string
  corridors_allowed: unknown | null
}

type GoldExportRow = {
  date: string
  corridor_id: string
  amount_bucket: number
  method_profile: string
  teer_rate: number | null
  rci_ratio: number | null
  rvi_bps: number | null
  provider_count: number | null
  provider_count_binned: number | null
  suppression_flag: boolean
  suppression_reason: string | null
  mid_market_rate: number | null
  weighting_model: string | null
  methodology_version: string | null
  weight_confidence: number | null
  weight_window_days: number | null
  created_at: Date
}

const parseIsoDateOnly = (value: string): Date | null => {
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  const [y, m, d] = trimmed.split('-').map((part) => Number(part))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  const parsed = new Date(Date.UTC(y, m - 1, d))
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    return null
  }
  return parsed
}

const toIsoDateOnly = (value: Date): string => value.toISOString().slice(0, 10)

export const resolveExportDateUtc = (now: Date, override?: string): Date => {
  if (override && override.trim()) {
    const parsed = parseIsoDateOnly(override)
    if (!parsed) {
      throw new Error(`INSTITUTIONAL_EXPORT_DATE must be YYYY-MM-DD (got: ${override})`)
    }
    return parsed
  }

  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const yesterdayUtc = new Date(todayUtc)
  yesterdayUtc.setUTCDate(todayUtc.getUTCDate() - 1)
  return yesterdayUtc
}

export const normalizeCorridorsAllowed = (
  raw: unknown,
): string[] | null => {
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
      // Safer default: invalid shape => deny all.
      return []
    } catch {
      // Safer default: invalid JSON => deny all.
      return []
    }
  }

  // Unknown type: deny all.
  return []
}

export const buildInstitutionalIndicesKey = (params: {
  clientPrefix: string
  exportDate: Date
  kind: InstitutionalExportKind
}): string => {
  const dateOnly = toIsoDateOnly(params.exportDate)
  const year = dateOnly.slice(0, 4)
  const month = dateOnly.slice(5, 7)
  const day = dateOnly.slice(8, 10)
  const rawPrefix = String(params.clientPrefix || '').trim()
  const safePrefix = rawPrefix.replace(/[^a-zA-Z0-9_-]/g, '-')
  if (!safePrefix) {
    throw new Error('client_prefix is required for institutional export key')
  }
  return `${INSTITUTIONAL_EXPORT_PREFIX}/${safePrefix}/daily/${year}/${month}/${day}/${params.kind}.csv`
}

const toTeerCsvRows = (rows: GoldExportRow[]) =>
  rows.map((row) => ({
    date: row.date,
    corridor_id: row.corridor_id,
    amount_bucket: row.amount_bucket,
    method_profile: row.method_profile,
    teer_rate: row.teer_rate,
    mid_market_rate: row.mid_market_rate,
    provider_count: row.provider_count,
    provider_count_binned: row.provider_count_binned,
    suppression_flag: row.suppression_flag,
    suppression_reason: row.suppression_reason,
    weight_confidence: row.weight_confidence,
    weight_window_days: row.weight_window_days,
    weighting_model: row.weighting_model,
    methodology_version: row.methodology_version,
    created_at: row.created_at ? row.created_at.toISOString() : null,
  }))

const toRciCsvRows = (rows: GoldExportRow[]) =>
  rows.map((row) => ({
    date: row.date,
    corridor_id: row.corridor_id,
    amount_bucket: row.amount_bucket,
    method_profile: row.method_profile,
    rci_ratio: row.rci_ratio,
    mid_market_rate: row.mid_market_rate,
    provider_count: row.provider_count,
    provider_count_binned: row.provider_count_binned,
    suppression_flag: row.suppression_flag,
    suppression_reason: row.suppression_reason,
    weight_confidence: row.weight_confidence,
    weight_window_days: row.weight_window_days,
    weighting_model: row.weighting_model,
    methodology_version: row.methodology_version,
    created_at: row.created_at ? row.created_at.toISOString() : null,
  }))

const toRviCsvRows = (rows: GoldExportRow[]) =>
  rows.map((row) => ({
    date: row.date,
    corridor_id: row.corridor_id,
    amount_bucket: row.amount_bucket,
    method_profile: row.method_profile,
    rvi_bps: row.rvi_bps,
    mid_market_rate: row.mid_market_rate,
    provider_count: row.provider_count,
    provider_count_binned: row.provider_count_binned,
    suppression_flag: row.suppression_flag,
    suppression_reason: row.suppression_reason,
    weight_confidence: row.weight_confidence,
    weight_window_days: row.weight_window_days,
    weighting_model: row.weighting_model,
    methodology_version: row.methodology_version,
    created_at: row.created_at ? row.created_at.toISOString() : null,
  }))

const requireExportsBucket = (): string => {
  const bucket = config.storage.exports.bucket
  if (!bucket) {
    throw new Error('EXPORTS_S3_BUCKET not configured')
  }
  return bucket
}

const requirePlaneCDbUrl = (): string => {
  const url = config.db.planeCUrl
  if (!url) {
    throw new Error('DATABASE_URL_PLANE_C not configured')
  }
  return url
}

const preflightIndicesReady = async (pool: Pool, exportDate: Date, amountBucket: number) => {
  const dateOnly = toIsoDateOnly(exportDate)
  const result = await query<{
    count: number
    max_created_at: Date | null
  }>(
    `SELECT COUNT(*)::int AS count,
            MAX(created_at) AS max_created_at
       FROM gold_export.cdp_daily
      WHERE date = $1::date
        AND amount_bucket = $2`,
    [dateOnly, amountBucket],
    pool,
  )

  const row = result.rows[0]
  const count = row?.count ?? 0
  const maxCreatedAt = row?.max_created_at ?? null
  if (count <= 0) {
    throw new Error(`Indices not ready: gold_export.cdp_daily has 0 rows for date=${dateOnly} bucket=${amountBucket}`)
  }
  if (!maxCreatedAt) {
    throw new Error(`Indices not ready: missing created_at for date=${dateOnly} bucket=${amountBucket}`)
  }

  const now = new Date()
  const todayMidnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (maxCreatedAt.getTime() < todayMidnightUtc.getTime()) {
    throw new Error(
      `Indices not refreshed after UTC midnight: max_created_at=${maxCreatedAt.toISOString()} < today_midnight_utc=${todayMidnightUtc.toISOString()}`,
    )
  }
}

const loadActiveInstitutionalClients = async (pool: Pool): Promise<InstitutionalClientRow[]> => {
  const result = await query<InstitutionalClientRow>(
    `SELECT id AS client_id, client_prefix, corridors_allowed
       FROM public.institutional_client
      WHERE status = 'active'
      ORDER BY id ASC`,
    [],
    pool,
  )
  return result.rows
}

const loadIndicesRowsForClient = async (pool: Pool, params: {
  exportDate: Date
  amountBucket: number
  corridorIds: string[] | null
}): Promise<GoldExportRow[]> => {
  const dateOnly = toIsoDateOnly(params.exportDate)
  const corridorFilter = params.corridorIds

  const result = await query<GoldExportRow>(
    `SELECT
        date::text AS date,
        corridor_id,
        amount_bucket,
        method_profile::text AS method_profile,
        teer_rate::double precision AS teer_rate,
        rci_ratio::double precision AS rci_ratio,
        rvi_bps::double precision AS rvi_bps,
        provider_count,
        provider_count_binned,
        suppression_flag,
        suppression_reason,
        mid_market_rate::double precision AS mid_market_rate,
        weighting_model,
        methodology_version,
        weight_confidence::double precision AS weight_confidence,
        weight_window_days,
        created_at
     FROM gold_export.cdp_daily
    WHERE date = $1::date
      AND amount_bucket = $2
      AND ($3::text[] IS NULL OR corridor_id = ANY($3))
    ORDER BY corridor_id ASC, method_profile ASC`,
    [dateOnly, params.amountBucket, corridorFilter],
    pool,
  )

  return result.rows
}

const upsertInstitutionalExportLog = async (pool: Pool, params: {
  clientId: string
  exportDate: Date
  kind: InstitutionalExportKind
  fileKey: string
  rowCount: number
  status: 'done' | 'failed'
  error: string | null
}): Promise<void> => {
  const exportDateOnly = toIsoDateOnly(params.exportDate)
  await query(
    `INSERT INTO public.institutional_export_log (
        client_id,
        export_date,
        export_kind,
        file_key,
        row_count,
        status,
        error,
        updated_at
      )
      VALUES ($1::uuid, $2::date, $3::institutional_export_kind, $4, $5, $6::institutional_export_status, $7, NOW())
      ON CONFLICT (client_id, export_date, export_kind)
      DO UPDATE SET
        file_key = EXCLUDED.file_key,
        row_count = EXCLUDED.row_count,
        status = EXCLUDED.status,
        error = EXCLUDED.error,
        updated_at = NOW()`,
    [
      params.clientId,
      exportDateOnly,
      params.kind,
      params.fileKey,
      params.rowCount,
      params.status,
      params.error,
    ],
    pool,
  )
}

const uploadCsv = async (bucket: string, key: string, csv: string): Promise<void> => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(csv, 'utf8'),
      ContentType: 'text/csv',
    }),
  )
}

export const runInstitutionalDailyExportJob = async (
  options: { exportDateOverride?: string } = {},
): Promise<void> => {
  initTracing(INSTITUTIONAL_EXPORT_JOB_NAME)

  const lockTtlSeconds = 3600
  const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))

  const { isShutdownRequested, signal: shutdownSignal } = createShutdownHandler({
    timeoutMs: 30000,
    logger,
  })

  if (isShutdownRequested()) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  const lock = new WorkerLock(INSTITUTIONAL_EXPORT_JOB_NAME, lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    return
  }

  let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
  let pool: ReturnType<typeof createPool> | null = null
  const startTime = Date.now()
  let batchFailureRecorded = false

  try {
    lockRefreshTimer = setInterval(() => {
      lock.extend()
        .then((extended) => {
          if (!extended && config.redis.url) {
            logger.warn('lock_extend_failed', { lock_key: INSTITUTIONAL_EXPORT_JOB_NAME })
          }
        })
        .catch((error) => {
          logger.warn('lock_extend_failed', {
            lock_key: INSTITUTIONAL_EXPORT_JOB_NAME,
            error: error instanceof Error ? error.message : String(error),
          })
        })
    }, lockRefreshMs)

    await recordBatchJobMetric(INSTITUTIONAL_EXPORT_JOB_NAME, 'job_start')

    const now = new Date()
    const exportDate = resolveExportDateUtc(
      now,
      options.exportDateOverride ?? process.env.INSTITUTIONAL_EXPORT_DATE,
    )
    const amountBucket = DEFAULT_AMOUNT_BUCKET

    pool = createPool(requirePlaneCDbUrl())
    const bucket = requireExportsBucket()

    logger.info('job_start', {
      export_date: toIsoDateOnly(exportDate),
      amount_bucket: amountBucket,
      s3_bucket: bucket,
    })

    await preflightIndicesReady(pool, exportDate, amountBucket)

    const clients = await loadActiveInstitutionalClients(pool)
    logger.info('clients_loaded', { clients_total: clients.length })

    let clientsSucceeded = 0
    let clientsFailed = 0
    let filesWritten = 0

    for (const client of clients) {
      if (isShutdownRequested() || shutdownSignal.aborted) {
        throw new Error('shutdown_requested')
      }

      const corridorIds = normalizeCorridorsAllowed(client.corridors_allowed)
      if (corridorIds !== null && corridorIds.length === 0 && client.corridors_allowed !== null) {
        logger.warn('client_corridors_empty', { client_id: client.client_id })
      }

      let rows: GoldExportRow[] = []
      if (corridorIds === null || corridorIds.length > 0) {
        rows = await loadIndicesRowsForClient(pool, {
          exportDate,
          amountBucket,
          corridorIds,
        })
      }

      const rowCount = rows.length
      logger.info('client_rows_loaded', {
        client_id: client.client_id,
        row_count: rowCount,
        corridor_filter_mode: corridorIds === null ? 'all' : 'allowlist',
        corridor_filter_count: corridorIds === null ? null : corridorIds.length,
      })

      const kinds: InstitutionalExportKind[] = ['teer', 'rci', 'rvi']
      let clientOk = true

      for (const kind of kinds) {
        const fileKey = buildInstitutionalIndicesKey({
          clientPrefix: client.client_prefix,
          exportDate,
          kind,
        })

        try {
          const csv = (() => {
            if (kind === 'teer') {
              return buildCsv(
                [...INSTITUTIONAL_EXPORT_TEER_HEADERS],
                toTeerCsvRows(rows),
              )
            }
            if (kind === 'rci') {
              return buildCsv(
                [...INSTITUTIONAL_EXPORT_RCI_HEADERS],
                toRciCsvRows(rows),
              )
            }
            return buildCsv(
              [...INSTITUTIONAL_EXPORT_RVI_HEADERS],
              toRviCsvRows(rows),
            )
          })()

          await uploadCsv(bucket, fileKey, csv)
          await upsertInstitutionalExportLog(pool, {
            clientId: client.client_id,
            exportDate,
            kind,
            fileKey,
            rowCount,
            status: 'done',
            error: null,
          })

          filesWritten += 1
          logger.info('client_file_written', {
            client_id: client.client_id,
            export_kind: kind,
            file_key: fileKey,
            row_count: rowCount,
          })
        } catch (error) {
          clientOk = false
          const { message } = formatError(error)
          logger.error('client_file_failed', {
            client_id: client.client_id,
            export_kind: kind,
            file_key: fileKey,
            error: message,
          })

          try {
            await upsertInstitutionalExportLog(pool, {
              clientId: client.client_id,
              exportDate,
              kind,
              fileKey,
              rowCount,
              status: 'failed',
              error: message,
            })
          } catch (logError) {
            const { message: logMessage } = formatError(logError)
            logger.error('export_log_upsert_failed', {
              client_id: client.client_id,
              export_kind: kind,
              error: logMessage,
            })
          }
        }
      }

      if (clientOk) {
        clientsSucceeded += 1
      } else {
        clientsFailed += 1
      }
    }

    const durationSeconds = (Date.now() - startTime) / 1000
    if (clientsFailed > 0) {
      await recordBatchJobMetric(INSTITUTIONAL_EXPORT_JOB_NAME, 'job_failure', durationSeconds, {
        clients_total: String(clients.length),
        clients_succeeded: String(clientsSucceeded),
        clients_failed: String(clientsFailed),
        files_written: String(filesWritten),
      })
      batchFailureRecorded = true
      throw new Error(`Institutional export completed with failures: clients_failed=${clientsFailed}`)
    }

    await recordBatchJobMetric(INSTITUTIONAL_EXPORT_JOB_NAME, 'job_complete', durationSeconds, {
      clients_total: String(clients.length),
      clients_succeeded: String(clientsSucceeded),
      clients_failed: String(clientsFailed),
      files_written: String(filesWritten),
    })

    logger.info('job_complete', {
      export_date: toIsoDateOnly(exportDate),
      clients_total: clients.length,
      clients_succeeded: clientsSucceeded,
      files_written: filesWritten,
      duration_seconds: durationSeconds,
    })
  } catch (error) {
    const durationSeconds = (Date.now() - startTime) / 1000
    const { message } = formatError(error)
    logger.error('job_failed', { error: message, duration_seconds: durationSeconds })

    // Emit a batch job failure so ops alarms can trigger. This is best-effort.
    if (!batchFailureRecorded) {
      try {
        await recordBatchJobMetric(INSTITUTIONAL_EXPORT_JOB_NAME, 'job_failure', durationSeconds, {
          reason: 'exception',
        })
      } catch {
        // ignore
      }
    }

    throw error
  } finally {
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    await lock.release().catch((error) => {
      logger.warn('lock_release_failed', {
        lock_key: INSTITUTIONAL_EXPORT_JOB_NAME,
        error: error instanceof Error ? error.message : String(error),
      })
    })
    if (pool) {
      await pool.end()
    }
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runInstitutionalDailyExportJob({ exportDateOverride: process.env.INSTITUTIONAL_EXPORT_DATE })
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      const { message, stack } = formatError(error)
      logger.error('job_fatal_error', { error: message, stack })
      process.exit(1)
    })
}
