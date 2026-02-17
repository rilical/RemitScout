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

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { startHealthServer } from '../shared/health-server'
import {
  deleteMessages,
  receiveJsonMessages,
  sendToDLQ,
  createVisibilityTimeoutExtender,
  drainAndStop,
  type VisibilityTimeoutExtender,
} from '../shared/sqs'
import { CORRIDOR_HISTORY_HEADERS } from './export-worker-constants'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { recordWorkerMetric } from '../shared/worker-metrics'
import { withWorkerRetry } from '../shared/worker-retry'
import { recordBusinessMetric } from '../shared/business-metrics'
import { initErrorTracking } from '../shared/error-tracker'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing } from '../shared/tracing'
import { ExportJobRepository, type ExportJobRow } from '../plane-a/src/repositories'
import {
  buildCsv,
  buildCsvSections,
  buildZip,
  renderPdf,
  type CsvSection,
} from './export-generators'

type ExportQueueMessage = {
  jobId: string
  jobType?: string
  userId?: string
}

const logger = createLogger('script.export-worker')
initTracing('export-worker')
initErrorTracking('export-worker')
const queueUrl = config.queues.exports?.url ?? ''
const queueMode = config.queues.exports?.mode ?? 'off'
const bucket = config.storage.exports?.bucket || ''
const prefix = config.storage.exports?.prefix || 'exports'
const s3Client = new S3Client({})

const batchSize = config.workers.exportWorker.queueBatchSize
const idleSleepMs = config.workers.exportWorker.queueIdleSleepMs
const lockTtlSeconds = config.workers.exportWorker.queueLockTtlSeconds
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const jobExpiryDays = config.workers.exportWorker.jobExpiryDays
const exportFetchPageSize = config.workers.exportWorker.fetchPageSize
const healthEnabled = config.workers.health.enabled
const healthPort = config.workers.health.port
const isLambdaRuntime = config.runtime.isLambda
const shutdownTimeoutMs = config.workers.exportWorker.shutdownTimeoutMs

let healthServer: { close: () => Promise<void> } | null = null
const activeExtenders = new Set<VisibilityTimeoutExtender>()
const shutdown = createShutdownHandler({
  name: 'export-worker',
  logger,
  timeoutMs: shutdownTimeoutMs,
  exitOnSignal: false,
  onShutdownRequested: async () => {
    await Promise.allSettled(Array.from(activeExtenders, (extender) => drainAndStop(extender)))
  },
})
const { signal: shutdownSignal } = shutdown

const fetchComparisonHistory = async (
  userId: string,
  params: Record<string, unknown>,
): Promise<Array<Record<string, unknown>>> => {
  const dateFrom = typeof params.dateFrom === 'string' ? new Date(params.dateFrom) : null
  const dateTo = typeof params.dateTo === 'string' ? new Date(params.dateTo) : null

  const baseConditions: string[] = ['user_id = $1']
  const baseValues: Array<string | Date> = [userId]
  let index = 2
  if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
    baseConditions.push(`created_at >= $${index}`)
    baseValues.push(dateFrom)
    index += 1
  }
  if (dateTo && !Number.isNaN(dateTo.getTime())) {
    baseConditions.push(`created_at <= $${index}`)
    baseValues.push(dateTo)
  }

  const out: Array<Record<string, unknown>> = []
  let cursor: { createdAt: Date; id: string } | null = null

  for (;;) {
    const conditions = [...baseConditions]
    const values: Array<string | Date | number> = [...baseValues]
    let cursorCreatedAtIndex: number | null = null
    let cursorIdIndex: number | null = null

    if (cursor) {
      values.push(cursor.createdAt)
      cursorCreatedAtIndex = values.length
      values.push(cursor.id)
      cursorIdIndex = values.length
      conditions.push(`(created_at, id) < ($${cursorCreatedAtIndex}, $${cursorIdIndex})`)
    }

    values.push(exportFetchPageSize)
    const limitParam = `$${values.length}`

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
       ORDER BY created_at DESC, id DESC
       LIMIT ${limitParam}`,
      values,
      pool,
    )

    for (const row of result.rows) {
      out.push({
        id: row.id,
        from_country: row.from_country,
        to_country: row.to_country,
        amount: row.amount,
        method: row.method,
        path: row.path,
        created_at: row.created_at.toISOString(),
      })
    }

    const last = result.rows[result.rows.length - 1]
    if (!last || result.rows.length < exportFetchPageSize) break
    cursor = { createdAt: last.created_at, id: last.id }
  }

  return out
}

const fetchWatchlist = async (userId: string) => {
  const out: Array<Record<string, unknown>> = []
  let cursor: { updatedAt: Date; id: string } | null = null

  for (;;) {
    const values: Array<string | Date | number> = [userId]
    const conditions = ['user_id = $1', 'deleted_at IS NULL']

    if (cursor) {
      values.push(cursor.updatedAt)
      const updatedAtIndex = values.length
      values.push(cursor.id)
      const idIndex = values.length
      conditions.push(`(updated_at, id) < ($${updatedAtIndex}, $${idIndex})`)
    }

    values.push(exportFetchPageSize)
    const limitParam = `$${values.length}`

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
       WHERE ${conditions.join(' AND ')}
       ORDER BY updated_at DESC, id DESC
       LIMIT ${limitParam}`,
      values,
      pool,
    )

    for (const row of result.rows) {
      out.push({
        id: row.id,
        target_type: row.target_type,
        target_payload: row.target_payload,
        label: row.label,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      })
    }

    const last = result.rows[result.rows.length - 1]
    if (!last || result.rows.length < exportFetchPageSize) break
    cursor = { updatedAt: last.updated_at, id: last.id }
  }

  return out
}

const fetchAlerts = async (userId: string) => {
  const out: Array<Record<string, unknown>> = []
  let cursor: { updatedAt: Date; alertId: string } | null = null

  for (;;) {
    const values: Array<string | Date | number> = [userId]
    const conditions = ['w.user_id = $1', 'w.deleted_at IS NULL']

    if (cursor) {
      values.push(cursor.updatedAt)
      const updatedAtIndex = values.length
      values.push(cursor.alertId)
      const idIndex = values.length
      conditions.push(`(r.updated_at, r.id) < ($${updatedAtIndex}, $${idIndex})`)
    }

    values.push(exportFetchPageSize)
    const limitParam = `$${values.length}`

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
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.updated_at DESC, r.id DESC
       LIMIT ${limitParam}`,
      values,
      pool,
    )

    for (const row of result.rows) {
      out.push({
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
      })
    }

    const last = result.rows[result.rows.length - 1]
    if (!last || result.rows.length < exportFetchPageSize) break
    cursor = { updatedAt: last.updated_at, alertId: last.alert_id }
  }

  return out
}

const fetchAlertEvents = async (userId: string) => {
  const out: Array<Record<string, unknown>> = []
  let cursor: { triggeredAt: Date; id: string } | null = null

  for (;;) {
    const values: Array<string | Date | number> = [userId]
    const conditions = ['w.user_id = $1']

    if (cursor) {
      values.push(cursor.triggeredAt)
      const tsIndex = values.length
      values.push(cursor.id)
      const idIndex = values.length
      conditions.push(`(e.triggered_at, e.id) < ($${tsIndex}, $${idIndex})`)
    }

    values.push(exportFetchPageSize)
    const limitParam = `$${values.length}`

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
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.triggered_at DESC, e.id DESC
       LIMIT ${limitParam}`,
      values,
      pool,
    )

    for (const row of result.rows) {
      out.push({
        id: row.id,
        alert_id: row.alert_id,
        triggered_at: row.triggered_at.toISOString(),
        value: row.value,
        message: row.message,
        context: row.context,
        notification_status: row.notification_status,
        provider_safe: row.provider_safe,
      })
    }

    const last = result.rows[result.rows.length - 1]
    if (!last || result.rows.length < exportFetchPageSize) break
    cursor = { triggeredAt: last.triggered_at, id: last.id }
  }

  return out
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
    const out: Array<Record<string, unknown>> = []
    let cursor: { ts: Date; id: string } | null = null

    const columns = table === 'silver.telemetry_search_event'
      ? 'id, ts, anon_session_id, user_id, corridor_id, amount_bucket, payin, payout, utm, page_path'
      : 'id, ts, anon_session_id, user_id, provider_id, corridor_id, target_url, page_path, utm'

    for (;;) {
      const values: Array<string | Date | number> = [userId]
      const conditions = ['user_id = $1']

      if (cursor) {
        values.push(cursor.ts)
        const tsIndex = values.length
        values.push(cursor.id)
        const idIndex = values.length
        conditions.push(`(ts, id) < ($${tsIndex}, $${idIndex})`)
      }

      values.push(exportFetchPageSize)
      const limitParam = `$${values.length}`

      const result = await query<Record<string, unknown>>(
        `SELECT ${columns}
         FROM ${table}
         WHERE ${conditions.join(' AND ')}
         ORDER BY ts DESC, id DESC
         LIMIT ${limitParam}`,
        values,
        pool,
      )

      out.push(...result.rows)

      const last = result.rows[result.rows.length - 1] as { ts?: Date; id?: string } | undefined
      if (!last || result.rows.length < exportFetchPageSize) break
      if (!(last.ts instanceof Date) || typeof last.id !== 'string') break
      cursor = { ts: last.ts, id: last.id }
    }

    return out
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

  const baseConditions: string[] = ['corridor_id = ANY($1)']
  const baseValues: Array<string[] | Date> = [corridorIds]
  let index = 2

  if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
    baseConditions.push(`date >= $${index}`)
    baseValues.push(dateFrom)
    index += 1
  }
  if (dateTo && !Number.isNaN(dateTo.getTime())) {
    baseConditions.push(`date <= $${index}`)
    baseValues.push(dateTo)
  }

  const out: Array<Record<string, unknown>> = []
  let cursor: { date: Date; corridorId: string; amountBucket: number; methodProfile: string } | null = null

  for (;;) {
    const conditions = [...baseConditions]
    const values: Array<string[] | Date | string | number> = [...baseValues]

    if (cursor) {
      values.push(cursor.date)
      const dateIndex = values.length
      values.push(cursor.corridorId)
      const corridorIndex = values.length
      values.push(cursor.amountBucket)
      const bucketIndex = values.length
      values.push(cursor.methodProfile)
      const methodIndex = values.length
      conditions.push(`(date, corridor_id, amount_bucket, method_profile) < ($${dateIndex}, $${corridorIndex}, $${bucketIndex}, $${methodIndex})`)
    }

    values.push(exportFetchPageSize)
    const limitParam = `$${values.length}`

    const result = await query<{
      date: Date
      corridor_id: string
      amount_bucket: number
      method_profile: string
      teer_rate: number | null
      rci_ratio: number | null
      rvi_bps: number | null
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
              teer_rate::double precision AS teer_rate,
              rci_ratio::double precision AS rci_ratio,
              rvi_bps::double precision AS rvi_bps,
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
       ORDER BY date DESC, corridor_id DESC, amount_bucket DESC, method_profile DESC
       LIMIT ${limitParam}`,
      values,
      pool,
    )

    for (const row of result.rows) {
      out.push({
        date: row.date.toISOString().split('T')[0],
        corridor_id: row.corridor_id,
        amount_bucket: row.amount_bucket,
        method_profile: row.method_profile,
        teer_rate: row.teer_rate,
        rci_ratio: row.rci_ratio,
        rvi_bps: row.rvi_bps,
        rci_median_bps: row.rci_median_bps,
        rci_p10_bps: row.rci_p10_bps,
        rci_p90_bps: row.rci_p90_bps,
        dispersion_bps: row.dispersion_bps,
        volatility_7d: row.volatility_7d,
        provider_count_binned: row.provider_count_binned,
        suppression_flag: row.suppression_flag,
        suppression_reason: row.suppression_reason,
      })
    }

    const last = result.rows[result.rows.length - 1]
    if (!last || result.rows.length < exportFetchPageSize) break
    cursor = {
      date: last.date,
      corridorId: last.corridor_id,
      amountBucket: last.amount_bucket,
      methodProfile: last.method_profile,
    }
  }

  return out
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
        headers: [...CORRIDOR_HISTORY_HEADERS],
        rows: corridorHistory,
      })
    }
    return sections
  }

  if (jobType.startsWith('indices')) {
    const corridorIds = Array.isArray(params.corridorIds)
      ? params.corridorIds.filter((id) => typeof id === 'string') as string[]
      : []
    const corridorHistory = await fetchCorridorHistory(corridorIds, params)

    return [
      {
        title: 'indices_history',
        headers: [...CORRIDOR_HISTORY_HEADERS],
        rows: corridorHistory,
      },
    ]
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

    const buffer = await buildZip(entries, (warning) => {
      logger.warn('zip_warning', { error: warning.message })
    })
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
    recordBusinessMetric('export_jobs_completed', 1, {
      mode: queueMode === 'off' ? 'db' : 'sqs',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await exportRepo.updateStatus(job.id, 'failed', { finished_at: new Date(), error: message })
    recordBusinessMetric('export_jobs_failed', 1, {
      mode: queueMode === 'off' ? 'db' : 'sqs',
    })
    throw error
  }
}

export const runQueueWorker = async (options?: { once?: boolean }) => {
  if (queueMode === 'off') {
    return
  }
  if (!queueUrl) {
    logger.warn('export_worker_disabled', { reason: 'missing_queue_url' })
    return
  }

  try {
    while (!shutdown.isShuttingDown()) {
      const { messages, error: receiveError } = await receiveJsonMessages<ExportQueueMessage>(queueUrl, batchSize)
      if (receiveError) {
        logger.error('sqs_receive_failed', { queue_url: queueUrl, error: receiveError.message })
      }
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

        const extender = createVisibilityTimeoutExtender(queueUrl, message.receiptHandle)
        activeExtenders.add(extender)
        try {
          await withWorkerRetry(() => processJob(payload.jobId), {
            maxRetries: 2,
            initialDelayMs: 1000,
            maxDelayMs: 20000,
            signal: shutdownSignal,
            operation: 'export.queue.process_job',
          })
          await recordWorkerMetric('export-queue-worker', 'message_processed', 1)
          deleteHandles.push(message.receiptHandle)
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          logger.error('export_job_failed', {
            job_id: payload.jobId,
            error: err.message,
          })
          await recordWorkerMetric('export-queue-worker', 'message_failed', 1)
          await sendToDLQ(queueUrl, message, err)
          await recordWorkerMetric('export-queue-worker', 'dlq_sent', 1)
        } finally {
          activeExtenders.delete(extender)
          await extender()
        }
      }

      const { failed } = await deleteMessages(queueUrl, deleteHandles)
      if (failed.length > 0) {
        logger.warn('sqs_delete_failed', { queue_url: queueUrl, failed_count: failed.length })
      }

      if (options?.once) {
        break
      }
    }
  } finally {
    // no-op: SQS handles distribution; lock-free for ECS scaling
  }
}

export const runDbWorker = async (options?: { once?: boolean }) => {
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
    while (!shutdown.isShuttingDown()) {
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

const pool = createPool(config.db.planeAUrl)

export const runExportWorker = async (options?: { once?: boolean }) => {
  if (!bucket) {
    logger.warn('export_bucket_missing', { bucket })
  }

  if (!isLambdaRuntime && healthEnabled) {
    try {
      healthServer = await startHealthServer({
        port: healthPort,
        logger,
        loggerName: 'export-worker',
        enableDatabaseCheck: true,
        enableRedisCheck: true,
        enableSqsCheck: queueMode !== 'off' && Boolean(queueUrl),
        sqsQueueUrl: queueUrl || undefined,
      })
    } catch (error) {
      logger.warn('health_server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  try {
    if (queueMode === 'off') {
      await runDbWorker(options)
    } else {
      await runQueueWorker(options)
    }
  } finally {
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (shutdown.isShuttingDown()) {
      await shutdown.shutdown('shutdown_requested')
    }
  }
}

if (config.env !== 'test' && !config.runtime.isLambda && require.main === module) {
  runExportWorker()
    .catch((error) => {
      logger.error('export_worker_fatal', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
