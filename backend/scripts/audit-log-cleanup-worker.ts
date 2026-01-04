/**
 * Audit Log Cleanup Worker - archive and delete expired audit logs.
 *
 * Usage:
 *   pnpm -C backend audit:cleanup
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { getErrorMessage } from '../shared/utils/error-handling'

const logger = createLogger('script.audit-log-cleanup')
const s3Client = new S3Client({})

type AuditLogRow = {
  id: string
  event_id: string
  actor_id: string
  actor_type: string
  actor_role: string | null
  action: string
  entity_type: string
  entity_id: string | null
  resource_type: string | null
  resource_id: string | null
  before_snapshot: Record<string, unknown> | null
  after_snapshot: Record<string, unknown> | null
  changes: Record<string, unknown> | null
  reason: string | null
  evidence_links: string[] | null
  ip_address: string | null
  user_agent: string | null
  request_id: string | null
  session_id: string | null
  metadata: Record<string, unknown> | null
  severity: string | null
  category: string
  created_at: Date
}

type ArchiveFilter = {
  label: string
  cutoff: Date
  category?: string
  severity?: string
  excludeCategories?: string[]
}

const normalizePrefix = (prefix: string) => prefix.replace(/\/+$/, '')

const toIso = (value: Date | null) => (value ? value.toISOString() : null)

const formatNdjson = (rows: AuditLogRow[]) =>
  rows
    .map((row) =>
      JSON.stringify({
        ...row,
        created_at: row.created_at.toISOString(),
      }),
    )
    .join('\n')

const buildFilterClause = (filter: ArchiveFilter, batchSize: number) => {
  const conditions: string[] = ['created_at < $1']
  const params: Array<string | Date> = [filter.cutoff]

  if (filter.category) {
    params.push(filter.category)
    conditions.push(`category = $${params.length}`)
  }
  if (filter.severity) {
    params.push(filter.severity)
    conditions.push(`severity = $${params.length}`)
  }
  if (filter.excludeCategories && filter.excludeCategories.length > 0) {
    params.push(filter.excludeCategories)
    conditions.push(`category <> ALL($${params.length}::text[])`)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const limitParam = params.length + 1

  return {
    whereClause,
    params,
    limitParam,
    limit: batchSize,
  }
}

const archiveAndDelete = async (
  pool: ReturnType<typeof createPool>,
  filter: ArchiveFilter,
  batchSize: number,
  bucket: string,
  prefix: string,
): Promise<{ archived: number; deleted: number; batches: number }> => {
  let archived = 0
  let deleted = 0
  let batches = 0

  const normalizedPrefix = normalizePrefix(prefix)

  while (true) {
    const { whereClause, params, limitParam, limit } = buildFilterClause(filter, batchSize)

    const result = await query<AuditLogRow>(
      `SELECT id, event_id, actor_id, actor_type, actor_role, action,
              entity_type, entity_id, resource_type, resource_id,
              before_snapshot, after_snapshot, changes,
              reason, evidence_links, ip_address, user_agent,
              request_id, session_id, metadata, severity, category, created_at
       FROM silver.audit_log
       ${whereClause}
       ORDER BY created_at ASC
       LIMIT $${limitParam}`,
      [...params, limit],
      pool,
    )

    if (result.rows.length === 0) {
      break
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const objectKey = `${normalizedPrefix}/${filter.label}/${timestamp}-${batches + 1}.ndjson`
    const body = formatNdjson(result.rows)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: body,
        ContentType: 'application/x-ndjson',
      }),
    )

    const ids = result.rows.map((row) => row.id)
    const deleteResult = await query<{ count: number }>(
      `DELETE FROM silver.audit_log
       WHERE id = ANY($1::uuid[])
       RETURNING id`,
      [ids],
      pool,
    )

    archived += result.rows.length
    deleted += deleteResult.rowCount ?? 0
    batches += 1

    logger.info('audit_log_batch_archived', {
      label: filter.label,
      batch: batches,
      archived_count: result.rows.length,
      deleted_count: deleteResult.rowCount ?? 0,
      object_key: objectKey,
    })
  }

  return { archived, deleted, batches }
}

export const runAuditLogCleanup = async (): Promise<void> => {
  const pool = createPool(config.db.planeAUrl)
  const bucket = config.auditLogs.bucket
  const prefix = config.auditLogs.prefix
  const batchSize = config.auditLogs.cleanupBatchSize

  const now = Date.now()
  const retention = config.auditLogs.retentionDays

  if (!bucket) {
    logger.warn('audit_log_cleanup_skipped', { reason: 'bucket_not_configured' })
    return
  }

  if (batchSize < 1) {
    logger.warn('audit_log_cleanup_skipped', { reason: 'invalid_batch_size', batch_size: batchSize })
    return
  }

  const start = Date.now()

  await recordBatchJobMetric('audit-log-cleanup', 'job_start')

  try {
    const tasks: ArchiveFilter[] = [
      {
        label: 'info',
        severity: 'info',
        excludeCategories: ['security', 'compliance'],
        cutoff: new Date(now - retention.info * 24 * 60 * 60 * 1000),
      },
      {
        label: 'user_action',
        category: 'user_action',
        cutoff: new Date(now - retention.user_action * 24 * 60 * 60 * 1000),
      },
      {
        label: 'admin',
        category: 'admin',
        cutoff: new Date(now - retention.admin * 24 * 60 * 60 * 1000),
      },
      {
        label: 'billing',
        category: 'billing',
        cutoff: new Date(now - retention.billing * 24 * 60 * 60 * 1000),
      },
      {
        label: 'data_access',
        category: 'data_access',
        cutoff: new Date(now - retention.data_access * 24 * 60 * 60 * 1000),
      },
      {
        label: 'system',
        category: 'system',
        cutoff: new Date(now - retention.system * 24 * 60 * 60 * 1000),
      },
      {
        label: 'security',
        category: 'security',
        cutoff: new Date(now - retention.security * 24 * 60 * 60 * 1000),
      },
      {
        label: 'compliance',
        category: 'compliance',
        cutoff: new Date(now - retention.compliance * 24 * 60 * 60 * 1000),
      },
    ]

    let totalArchived = 0
    let totalDeleted = 0

    for (const task of tasks) {
      if (task.cutoff.getTime() > now) {
        continue
      }

      const result = await archiveAndDelete(pool, task, batchSize, bucket, prefix)
      totalArchived += result.archived
      totalDeleted += result.deleted
    }

    const durationMs = Date.now() - start
    logger.info('audit_log_cleanup_complete', {
      archived_count: totalArchived,
      deleted_count: totalDeleted,
      duration_ms: durationMs,
      bucket,
    })

    await recordBatchJobMetric('audit-log-cleanup', 'job_complete', durationMs / 1000, {
      archived_count: String(totalArchived),
      deleted_count: String(totalDeleted),
    })
  } catch (error) {
    const durationMs = Date.now() - start
    logger.error('audit_log_cleanup_failed', {
      error: getErrorMessage(error),
      duration_ms: durationMs,
    })
    await recordBatchJobMetric('audit-log-cleanup', 'job_failure', durationMs / 1000)
    throw error
  } finally {
    await pool.end()
  }
}

runAuditLogCleanup()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('audit_log_cleanup_failed', {
      error: getErrorMessage(error),
    })
    process.exit(1)
  })
