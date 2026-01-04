/**
 * Export Worker - processes export jobs from SQS or DB queue.
 *
 * Modes:
 * - queue: consumes SQS messages when EXPORT_JOB_QUEUE_MODE=queue
 * - shadow: consumes SQS but jobs are still tracked in DB
 * - off: polls DB for queued jobs
 */

import { setTimeout as sleep } from 'timers/promises'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import PDFDocument from 'pdfkit'
import archiver from 'archiver'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import {
  deleteMessages,
  receiveJsonMessages,
  sendToDLQ,
  createVisibilityTimeoutExtender,
} from '../shared/sqs'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { ExportJobRepository, type ExportJobRow } from '../plane-a/src/repositories'

type ExportQueueMessage = {
  jobId: string
  jobType?: string
  userId?: string
}

type CsvSection = {
  title: string
  headers: string[]
  rows: Array<Record<string, unknown>>
}

const logger = createLogger('script.export-worker')
const queueUrl = config.queues.exports?.url ?? ''
const queueMode = config.queues.exports?.mode ?? 'off'
const bucket = config.storage.exports?.bucket || ''
const prefix = config.storage.exports?.prefix || 'exports'
const s3Client = new S3Client({})

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const batchSize = toNumber(process.env.EXPORT_QUEUE_BATCH_SIZE, 5)
const idleSleepMs = toNumber(process.env.EXPORT_QUEUE_IDLE_SLEEP_MS, 2000)
const lockTtlSeconds = toNumber(process.env.EXPORT_QUEUE_LOCK_TTL_SECONDS, 120)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const jobExpiryDays = toNumber(process.env.EXPORT_JOB_EXPIRY_DAYS, 7)

let shutdownRequested = false
let forceExitTimer: ReturnType<typeof setTimeout> | null = null

const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
  forceExitTimer = setTimeout(() => {
    logger.warn('shutdown_forced')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

const escapeCsv = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const buildCsv = (headers: string[], rows: Array<Record<string, unknown>>): string => {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(','))
  }
  return lines.join('\n')
}

const buildCsvSections = (sections: CsvSection[]): string => {
  const lines: string[] = []
  for (const section of sections) {
    lines.push(`SECTION:${section.title}`)
    lines.push(buildCsv(section.headers, section.rows))
    lines.push('')
  }
  return lines.join('\n')
}

const renderPdf = async (title: string, sections: CsvSection[]): Promise<Buffer> => {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(18).text(title)
    doc.moveDown()

    for (const section of sections) {
      doc.fontSize(14).text(section.title)
      doc.moveDown(0.5)
      doc.fontSize(10).text(section.headers.join(' | '))
      doc.moveDown(0.25)
      for (const row of section.rows) {
        const line = section.headers.map((header) => String(row[header] ?? '')).join(' | ')
        doc.text(line)
      }
      doc.moveDown()
    }

    doc.end()
  })
}

const buildZip = async (entries: Array<{ name: string; content: Buffer | string }>): Promise<Buffer> => {
  return await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []
    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('warning', (warning) => {
      logger.warn('zip_warning', { error: warning.message })
    })
    archive.on('error', reject)
    archive.on('end', () => resolve(Buffer.concat(chunks)))

    for (const entry of entries) {
      archive.append(entry.content, { name: entry.name })
    }
    try {
      archive.finalize()
    } catch (error) {
      reject(error)
    }
  })
}

const fetchComparisonHistory = async (
  userId: string,
  params: Record<string, unknown>,
): Promise<Array<Record<string, unknown>>> => {
  const dateFrom = typeof params.dateFrom === 'string' ? new Date(params.dateFrom) : null
  const dateTo = typeof params.dateTo === 'string' ? new Date(params.dateTo) : null

  const conditions: string[] = ['user_id = $1']
  const values: Array<string | Date> = [userId]
  let index = 2
  if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
    conditions.push(`created_at >= $${index}`)
    values.push(dateFrom)
    index += 1
  }
  if (dateTo && !Number.isNaN(dateTo.getTime())) {
    conditions.push(`created_at <= $${index}`)
    values.push(dateTo)
  }

  const result = await query<{
    id: string
    from_country: string
    to_country: string
    amount: number
    method: string
    path: string | null
    created_at: Date
  }>(
    `SELECT id,
            from_country,
            to_country,
            amount::double precision AS amount,
            method,
            path,
            created_at
     FROM silver.comparison_history
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC`,
    values,
    pool,
  )

  return result.rows.map((row) => ({
    id: row.id,
    from_country: row.from_country,
    to_country: row.to_country,
    amount: row.amount,
    method: row.method,
    path: row.path,
    created_at: row.created_at.toISOString(),
  }))
}

const fetchWatchlist = async (userId: string) => {
  const result = await query<{
    id: string
    target_type: string
    target_payload: Record<string, unknown>
    label: string | null
    created_at: Date
    updated_at: Date
  }>(
    `SELECT id, target_type, target_payload, label, created_at, updated_at
     FROM silver.watchlist_item
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
    [userId],
    pool,
  )

  return result.rows.map((row) => ({
    id: row.id,
    target_type: row.target_type,
    target_payload: row.target_payload,
    label: row.label,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }))
}

const fetchAlerts = async (userId: string) => {
  const result = await query<{
    alert_id: string
    metric: string
    comparator: string
    threshold: number
    currency: string | null
    frequency: string
    enabled: boolean
    created_at: Date
    updated_at: Date
    last_triggered_at: Date | null
    last_value: number | null
    in_alarm: boolean | null
    watchlist_id: string
    target_type: string
    target_payload: Record<string, unknown>
  }>(
    `SELECT r.id as alert_id,
            r.metric,
            r.comparator,
            r.threshold::double precision AS threshold,
            r.currency,
            r.frequency,
            r.enabled,
            r.created_at,
            r.updated_at,
            s.last_triggered_at,
            s.last_value::double precision AS last_value,
            s.in_alarm,
            w.id as watchlist_id,
            w.target_type,
            w.target_payload
     FROM silver.alert_rule r
     JOIN silver.watchlist_item w ON w.id = r.watchlist_item_id
     LEFT JOIN silver.alert_state s ON s.alert_id = r.id
     WHERE w.user_id = $1 AND w.deleted_at IS NULL
     ORDER BY r.updated_at DESC`,
    [userId],
    pool,
  )

  return result.rows.map((row) => ({
    alert_id: row.alert_id,
    metric: row.metric,
    comparator: row.comparator,
    threshold: row.threshold,
    currency: row.currency,
    frequency: row.frequency,
    enabled: row.enabled,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    last_triggered_at: row.last_triggered_at ? row.last_triggered_at.toISOString() : null,
    last_value: row.last_value,
    in_alarm: row.in_alarm,
    watchlist_id: row.watchlist_id,
    target_type: row.target_type,
    target_payload: row.target_payload,
  }))
}

const fetchAlertEvents = async (userId: string) => {
  const result = await query<{
    id: string
    alert_id: string
    triggered_at: Date
    value: number
    message: string
    context: Record<string, unknown> | null
    notification_status: string
    provider_safe: boolean
  }>(
    `SELECT e.id,
            e.alert_id,
            e.triggered_at,
            e.value::double precision AS value,
            e.message,
            e.context,
            e.notification_status,
            e.provider_safe
     FROM silver.alert_event e
     JOIN silver.alert_rule r ON r.id = e.alert_id
     JOIN silver.watchlist_item w ON w.id = r.watchlist_item_id
     WHERE w.user_id = $1
     ORDER BY e.triggered_at DESC`,
    [userId],
    pool,
  )

  return result.rows.map((row) => ({
    id: row.id,
    alert_id: row.alert_id,
    triggered_at: row.triggered_at.toISOString(),
    value: row.value,
    message: row.message,
    context: row.context,
    notification_status: row.notification_status,
    provider_safe: row.provider_safe,
  }))
}

const isMissingTableOrColumn = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  return code === '42P01' || code === '42703'
}

const fetchTelemetryTable = async (
  table: 'silver.telemetry_search_event' | 'silver.telemetry_outbound_click',
  userId: string,
): Promise<Array<Record<string, unknown>>> => {
  try {
    const result = await query<Record<string, unknown>>(
      `SELECT * FROM ${table} WHERE user_id = $1`,
      [userId],
      pool,
    )
    return result.rows
  } catch (error) {
    if (isMissingTableOrColumn(error)) {
      logger.warn('telemetry_table_unavailable', { table })
      return []
    }
    throw error
  }
}

const fetchUserProfile = async (userId: string) => {
  const result = await query<{
    user_id: string
    email: string | null
    created_at: Date
    last_seen_at: Date | null
    plan_code: string | null
    status: string | null
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    current_period_end: Date | null
  }>(
    `SELECT a.user_id,
            a.email,
            a.created_at,
            a.last_seen_at,
            p.plan_code,
            p.status,
            p.stripe_customer_id,
            p.stripe_subscription_id,
            p.current_period_end
     FROM silver.user_account a
     LEFT JOIN silver.user_plan p ON p.user_id = a.user_id
     WHERE a.user_id = $1`,
    [userId],
    pool,
  )

  const row = result.rows[0]
  if (!row) return null
  return {
    user_id: row.user_id,
    email: row.email,
    created_at: row.created_at.toISOString(),
    last_seen_at: row.last_seen_at ? row.last_seen_at.toISOString() : null,
    plan_code: row.plan_code,
    status: row.status,
    stripe_customer_id: row.stripe_customer_id,
    stripe_subscription_id: row.stripe_subscription_id,
    current_period_end: row.current_period_end ? row.current_period_end.toISOString() : null,
  }
}

const fetchCorridorHistory = async (
  corridorIds: string[],
  params: Record<string, unknown>,
): Promise<Array<Record<string, unknown>>> => {
  if (corridorIds.length === 0) return []
  const dateFrom = typeof params.dateFrom === 'string' ? new Date(params.dateFrom) : null
  const dateTo = typeof params.dateTo === 'string' ? new Date(params.dateTo) : null

  const conditions: string[] = ['corridor_id = ANY($1)']
  const values: Array<string[] | Date> = [corridorIds]
  let index = 2

  if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
    conditions.push(`date >= $${index}`)
    values.push(dateFrom)
    index += 1
  }
  if (dateTo && !Number.isNaN(dateTo.getTime())) {
    conditions.push(`date <= $${index}`)
    values.push(dateTo)
  }

  const result = await query<{
    date: Date
    corridor_id: string
    amount_bucket: number
    method_profile: string
    rci_median_bps: number | null
    rci_p10_bps: number | null
    rci_p90_bps: number | null
    dispersion_bps: number | null
    volatility_7d: number | null
    provider_count_binned: number | null
    suppression_flag: boolean
    suppression_reason: string | null
  }>(
    `SELECT date,
            corridor_id,
            amount_bucket,
            method_profile,
            rci_median_bps::double precision AS rci_median_bps,
            rci_p10_bps::double precision AS rci_p10_bps,
            rci_p90_bps::double precision AS rci_p90_bps,
            dispersion_bps::double precision AS dispersion_bps,
            volatility_7d::double precision AS volatility_7d,
            provider_count_binned,
            suppression_flag,
            suppression_reason
     FROM gold_export.cdp_daily
     WHERE ${conditions.join(' AND ')}
     ORDER BY date DESC`,
    values,
    pool,
  )

  return result.rows.map((row) => ({
    date: row.date.toISOString().split('T')[0],
    corridor_id: row.corridor_id,
    amount_bucket: row.amount_bucket,
    method_profile: row.method_profile,
    rci_median_bps: row.rci_median_bps,
    rci_p10_bps: row.rci_p10_bps,
    rci_p90_bps: row.rci_p90_bps,
    dispersion_bps: row.dispersion_bps,
    volatility_7d: row.volatility_7d,
    provider_count_binned: row.provider_count_binned,
    suppression_flag: row.suppression_flag,
    suppression_reason: row.suppression_reason,
  }))
}

const buildSectionsForJob = async (
  jobType: string,
  userId: string,
  params: Record<string, unknown>,
): Promise<CsvSection[]> => {
  if (jobType.startsWith('history')) {
    const history = await fetchComparisonHistory(userId, params)
    const corridorIds = Array.isArray(params.corridorIds)
      ? params.corridorIds.filter((id) => typeof id === 'string') as string[]
      : []
    const corridorHistory = await fetchCorridorHistory(corridorIds, params)

    const sections: CsvSection[] = [
      {
        title: 'comparison_history',
        headers: ['id', 'from_country', 'to_country', 'amount', 'method', 'path', 'created_at'],
        rows: history,
      },
    ]
    if (corridorHistory.length > 0) {
      sections.push({
        title: 'corridor_history',
        headers: [
          'date',
          'corridor_id',
          'amount_bucket',
          'method_profile',
          'rci_median_bps',
          'rci_p10_bps',
          'rci_p90_bps',
          'dispersion_bps',
          'volatility_7d',
          'provider_count_binned',
          'suppression_flag',
          'suppression_reason',
        ],
        rows: corridorHistory,
      })
    }
    return sections
  }

  if (jobType.startsWith('watchlist')) {
    const watchlist = await fetchWatchlist(userId)
    return [
      {
        title: 'watchlist_items',
        headers: ['id', 'target_type', 'target_payload', 'label', 'created_at', 'updated_at'],
        rows: watchlist,
      },
    ]
  }

  if (jobType.startsWith('alerts')) {
    const [alerts, alertEvents] = await Promise.all([
      fetchAlerts(userId),
      fetchAlertEvents(userId),
    ])
    const sections: CsvSection[] = [
      {
        title: 'alerts',
        headers: [
          'alert_id',
          'metric',
          'comparator',
          'threshold',
          'currency',
          'frequency',
          'enabled',
          'created_at',
          'updated_at',
          'last_triggered_at',
          'last_value',
          'in_alarm',
          'watchlist_id',
          'target_type',
          'target_payload',
        ],
        rows: alerts,
      },
    ]
    if (alertEvents.length > 0) {
      sections.push({
        title: 'alert_events',
        headers: [
          'id',
          'alert_id',
          'triggered_at',
          'value',
          'message',
          'context',
          'notification_status',
          'provider_safe',
        ],
        rows: alertEvents,
      })
    }
    return sections
  }

  if (jobType.startsWith('all')) {
    const [history, watchlist, alerts, alertEvents] = await Promise.all([
      fetchComparisonHistory(userId, params),
      fetchWatchlist(userId),
      fetchAlerts(userId),
      fetchAlertEvents(userId),
    ])
    const sections: CsvSection[] = [
      {
        title: 'comparison_history',
        headers: ['id', 'from_country', 'to_country', 'amount', 'method', 'path', 'created_at'],
        rows: history,
      },
      {
        title: 'watchlist_items',
        headers: ['id', 'target_type', 'target_payload', 'label', 'created_at', 'updated_at'],
        rows: watchlist,
      },
      {
        title: 'alerts',
        headers: [
          'alert_id',
          'metric',
          'comparator',
          'threshold',
          'currency',
          'frequency',
          'enabled',
          'created_at',
          'updated_at',
          'last_triggered_at',
          'last_value',
          'in_alarm',
          'watchlist_id',
          'target_type',
          'target_payload',
        ],
        rows: alerts,
      },
    ]
    if (alertEvents.length > 0) {
      sections.push({
        title: 'alert_events',
        headers: [
          'id',
          'alert_id',
          'triggered_at',
          'value',
          'message',
          'context',
          'notification_status',
          'provider_safe',
        ],
        rows: alertEvents,
      })
    }
    return sections
  }

  return []
}

const generateExportFile = async (
  job: ExportJobRow,
): Promise<{ buffer: Buffer; contentType: string; extension: string }> => {
  if (job.job_type === 'gdpr_export') {
    const [profile, watchlist, alerts, history, alertEvents, telemetrySearches, telemetryClicks] =
      await Promise.all([
        fetchUserProfile(job.user_id),
        fetchWatchlist(job.user_id),
        fetchAlerts(job.user_id),
        fetchComparisonHistory(job.user_id, job.params ?? {}),
        fetchAlertEvents(job.user_id),
        fetchTelemetryTable('silver.telemetry_search_event', job.user_id),
        fetchTelemetryTable('silver.telemetry_outbound_click', job.user_id),
      ])

    const entries = [
      {
        name: 'profile.json',
        content: JSON.stringify(profile ?? {}, null, 2),
      },
      {
        name: 'watchlist.csv',
        content: buildCsv(
          ['id', 'target_type', 'target_payload', 'label', 'created_at', 'updated_at'],
          watchlist,
        ),
      },
      {
        name: 'alerts.csv',
        content: buildCsv(
          [
            'alert_id',
            'metric',
            'comparator',
            'threshold',
            'currency',
            'frequency',
            'enabled',
            'created_at',
            'updated_at',
            'last_triggered_at',
            'last_value',
            'in_alarm',
            'watchlist_id',
            'target_type',
            'target_payload',
          ],
          alerts,
        ),
      },
      {
        name: 'alert-events.csv',
        content: buildCsv(
          ['id', 'alert_id', 'triggered_at', 'value', 'message', 'context', 'notification_status', 'provider_safe'],
          alertEvents,
        ),
      },
      ...(telemetrySearches.length > 0
        ? [
            {
              name: 'telemetry-searches.csv',
              content: buildCsv(Object.keys(telemetrySearches[0] ?? {}), telemetrySearches),
            },
          ]
        : []),
      ...(telemetryClicks.length > 0
        ? [
            {
              name: 'telemetry-clicks.csv',
              content: buildCsv(Object.keys(telemetryClicks[0] ?? {}), telemetryClicks),
            },
          ]
        : []),
      {
        name: 'history.csv',
        content: buildCsv(
          ['id', 'from_country', 'to_country', 'amount', 'method', 'path', 'created_at'],
          history,
        ),
      },
      {
        name: 'README.txt',
        content:
          'This archive contains your Remit-Scout data export. Files: profile.json, watchlist.csv, alerts.csv, alert-events.csv, history.csv, telemetry-searches.csv, telemetry-clicks.csv (if available).',
      },
    ]

    const buffer = await buildZip(entries)
    return { buffer, contentType: 'application/zip', extension: 'zip' }
  }

  const sections = await buildSectionsForJob(job.job_type, job.user_id, job.params ?? {})
  const isPdf = job.job_type.endsWith('_pdf')

  if (isPdf) {
    const buffer = await renderPdf('Remit-Scout Export', sections)
    return { buffer, contentType: 'application/pdf', extension: 'pdf' }
  }

  const csv = buildCsvSections(sections)
  return { buffer: Buffer.from(csv, 'utf8'), contentType: 'text/csv', extension: 'csv' }
}

const uploadExport = async (
  userId: string,
  jobId: string,
  file: { buffer: Buffer; contentType: string; extension: string },
): Promise<string> => {
  if (!bucket) {
    throw new Error('EXPORTS_S3_BUCKET not configured')
  }
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '') || 'exports'
  const key = `${normalizedPrefix}/${userId}/${jobId}.${file.extension}`

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.contentType,
    }),
  )
  return key
}

const processJob = async (jobId: string) => {
  const exportRepo = new ExportJobRepository(pool)
  const job = await exportRepo.getById(jobId)
  if (!job) {
    logger.warn('export_job_missing', { job_id: jobId })
    return
  }
  if (job.status !== 'queued') {
    logger.info('export_job_skipped', { job_id: jobId, status: job.status })
    return
  }

  await exportRepo.updateStatus(job.id, 'running', { started_at: new Date(), error: null })

  try {
    const file = await generateExportFile(job)
    const key = await uploadExport(job.user_id, job.id, file)
    const expiresAt = new Date(Date.now() + jobExpiryDays * 24 * 60 * 60 * 1000)
    await exportRepo.updateS3Key(job.id, key, expiresAt)
    await exportRepo.updateStatus(job.id, 'done', { finished_at: new Date(), error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await exportRepo.updateStatus(job.id, 'failed', { finished_at: new Date(), error: message })
    throw error
  }
}

const runQueueWorker = async (options?: { once?: boolean }) => {
  if (queueMode === 'off') {
    return
  }
  if (!queueUrl) {
    logger.warn('export_worker_disabled', { reason: 'missing_queue_url' })
    return
  }

  const lock = new WorkerLock('export-queue-worker', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('export_worker_skipped', { reason: 'lock_already_held' })
    await recordWorkerMetric('export-queue-worker', 'lock_failed', 1)
    return
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'export-queue-worker',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  try {
    while (!shutdownRequested) {
      const messages = await receiveJsonMessages<ExportQueueMessage>(queueUrl, batchSize)
      if (messages.length === 0) {
        if (options?.once) {
          break
        }
        await sleep(idleSleepMs)
        continue
      }

      const deleteHandles: string[] = []
      for (const message of messages) {
        const payload = message.payload
        if (!payload?.jobId) {
          logger.warn('export_message_invalid', { message_id: message.messageId })
          deleteHandles.push(message.receiptHandle)
          continue
        }

        const stopExtending = createVisibilityTimeoutExtender(queueUrl, message.receiptHandle)
        try {
          await withWorkerRetry(() => processJob(payload.jobId), {
            maxRetries: 2,
            initialDelayMs: 1000,
            maxDelayMs: 20000,
          })
          stopExtending()
          await recordWorkerMetric('export-queue-worker', 'message_processed', 1)
          deleteHandles.push(message.receiptHandle)
        } catch (error) {
          stopExtending()
          const err = error instanceof Error ? error : new Error(String(error))
          logger.error('export_job_failed', {
            job_id: payload.jobId,
            error: err.message,
          })
          await recordWorkerMetric('export-queue-worker', 'message_failed', 1)
          await sendToDLQ(queueUrl, message, err)
          await recordWorkerMetric('export-queue-worker', 'dlq_sent', 1)
        }
      }

      await deleteMessages(queueUrl, deleteHandles)

      if (options?.once) {
        break
      }
    }
  } finally {
    clearInterval(lockRefreshTimer)
    await lock.release()
  }
}

const runDbWorker = async (options?: { once?: boolean }) => {
  if (queueMode !== 'off') return

  const lock = new WorkerLock('export-db-worker', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('export_worker_skipped', { reason: 'lock_already_held' })
    await recordWorkerMetric('export-db-worker', 'lock_failed', 1)
    return
  }

  const lockRefreshTimer = setInterval(() => {
    lock.extend().catch((error) => {
      logger.warn('lock_extend_failed', {
        lock_key: 'export-db-worker',
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, lockRefreshMs)

  const exportRepo = new ExportJobRepository(pool)

  try {
    while (!shutdownRequested) {
      const jobs = await exportRepo.getPendingJobs(1)
      if (jobs.length === 0) {
        if (options?.once) {
          break
        }
        await sleep(idleSleepMs)
        continue
      }

      const job = jobs[0]
      try {
        await processJob(job.id)
        await recordWorkerMetric('export-db-worker', 'message_processed', 1)
      } catch (error) {
        logger.error('export_job_failed', {
          job_id: job.id,
          error: error instanceof Error ? error.message : String(error),
        })
        await recordWorkerMetric('export-db-worker', 'message_failed', 1)
      }

      if (options?.once) {
        break
      }
    }
  } finally {
    clearInterval(lockRefreshTimer)
    await lock.release()
  }
}

let pool = createPool(config.db.planeAUrl)

export const runExportWorker = async (options?: { once?: boolean }) => {
  if (!bucket) {
    logger.warn('export_bucket_missing', { bucket })
  }

  try {
    if (queueMode === 'off') {
      await runDbWorker(options)
    } else {
      await runQueueWorker(options)
    }
  } finally {
    await pool.end().catch(() => {
      // Ignore shutdown errors
    })
  }
}

runExportWorker()
  .then(() => {
    if (forceExitTimer) {
      clearTimeout(forceExitTimer)
    }
    process.exit(0)
  })
  .catch((error) => {
    logger.error('export_worker_fatal', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })
