import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam'
import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs'

import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { getQueueAgeSeconds, getQueueDLQ, getQueueDepth, getQueueStats } from '../../shared/sqs'
import { formatError } from '../../shared/utils/error-handling'
import {
  DEFAULT_EVIDENCE_BUDGETS,
  getGithubActionsRunUrl,
  resolveCaseEnv,
  writeEvidenceResult,
  type EvidenceFinding,
  type EvidencePointer,
  type EvidenceResult,
} from '../lib/evidence'

type StatusCountRow = {
  status: string
  count: number | string | null
}

type ExportJobRow = {
  id: string
  status: string
  job_type: string
  s3_key: string | null
  created_at: string | null
  started_at: string | null
  finished_at: string | null
  error: string | null
}

const parseWindowHours = (value: string | undefined): number => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 24
  return Math.min(168, Math.max(1, Math.floor(n)))
}

const stuckQueuedMinutes = (env: 'dev' | 'staging' | 'prod'): number => {
  if (env === 'prod') return 30
  if (env === 'staging') return 60
  return 180
}

const stuckRunningMinutes = (env: 'dev' | 'staging' | 'prod'): number => {
  if (env === 'prod') return 60
  if (env === 'staging') return 120
  return 240
}

const getExportsQueueName = (env: string): string => `remit-scout-${env}-export-job`

const getSqsClient = (): SQSClient => new SQSClient({})
const getS3Client = (): S3Client => new S3Client({})
const getIamClient = (): IAMClient => new IAMClient({})

const resolveExportsQueueUrl = async (
  env: string,
): Promise<{ queueUrl: string; source: string; queueName: string }> => {
  const fromConfig = String(config.queues.exports?.url || '').trim()
  const queueName = getExportsQueueName(env)
  if (fromConfig) return { queueUrl: fromConfig, source: 'config', queueName }

  const client = getSqsClient()
  const res = await client.send(new GetQueueUrlCommand({ QueueName: queueName }))
  const queueUrl = String(res.QueueUrl || '').trim()
  if (!queueUrl) throw new Error(`Queue URL not found for QueueName='${queueName}'`)
  return { queueUrl, source: 'aws_get_queue_url', queueName }
}

const isNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const name = String((error as any).name || '')
  const code = String((error as any).Code || (error as any).code || '')
  const http = Number((error as any).$metadata?.httpStatusCode)
  return name === 'NotFound' || code === 'NotFound' || http === 404
}

const resolveRoleNameFromArn = (arn: string): string | null => {
  const parts = arn.split(':')
  if (parts.length < 6) return null
  const resource = parts.slice(5).join(':')
  const resourceParts = resource.split('/')
  if (resourceParts[0] !== 'role' || resourceParts.length < 2) return null
  return resourceParts.slice(1).join('/')
}

const headObjectExists = async (bucket: string, key: string): Promise<{ ok: boolean; error?: string }> => {
  const client = getS3Client()
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return { ok: true }
  } catch (error: unknown) {
    if (isNotFoundError(error)) return { ok: false }
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

const main = async () => {
  const env = resolveCaseEnv(config.envName || process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')
  const caseId = String(process.env.CASE_ID || '').trim()
  const windowHours = parseWindowHours(process.env.WINDOW_HOURS)
  const sinceIso = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

  const pointers: EvidencePointer[] = []
  const runUrl = getGithubActionsRunUrl()
  if (runUrl) pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'Evidence workflow run' })

  const pool = createPool(config.db.planeBUrl)
  try {
    const queuedBeforeIso = new Date(Date.now() - stuckQueuedMinutes(env) * 60 * 1000).toISOString()
    const runningBeforeIso = new Date(Date.now() - stuckRunningMinutes(env) * 60 * 1000).toISOString()

    const [
      statusCountsRes,
      recentRes,
      stuckQueuedRes,
      stuckRunningRes,
      failedRes,
      doneRes,
    ] = await Promise.all([
      query<StatusCountRow>(
        `SELECT status::text AS status, COUNT(*)::int AS count
         FROM silver.export_job
         WHERE created_at >= $1::timestamptz
         GROUP BY status`,
        [sinceIso],
        pool,
      ),
      query<ExportJobRow>(
        `SELECT id::text AS id,
                status::text AS status,
                job_type::text AS job_type,
                s3_key,
                created_at::text AS created_at,
                started_at::text AS started_at,
                finished_at::text AS finished_at,
                error
         FROM silver.export_job
         WHERE created_at >= $1::timestamptz
         ORDER BY created_at DESC
         LIMIT 20`,
        [sinceIso],
        pool,
      ),
      query<{ id: string; created_at: string | null }>(
        `SELECT id::text AS id, created_at::text AS created_at
         FROM silver.export_job
         WHERE status = 'queued'
           AND created_at < $1::timestamptz
         ORDER BY created_at ASC
         LIMIT 10`,
        [queuedBeforeIso],
        pool,
      ),
      query<{ id: string; started_at: string | null; created_at: string | null }>(
        `SELECT id::text AS id,
                started_at::text AS started_at,
                created_at::text AS created_at
         FROM silver.export_job
         WHERE status = 'running'
           AND COALESCE(started_at, created_at) < $1::timestamptz
         ORDER BY COALESCE(started_at, created_at) ASC
         LIMIT 10`,
        [runningBeforeIso],
        pool,
      ),
      query<{ id: string; created_at: string | null; error: string | null }>(
        `SELECT id::text AS id,
                created_at::text AS created_at,
                LEFT(COALESCE(error, ''), 200) AS error
         FROM silver.export_job
         WHERE status = 'failed'
           AND created_at >= $1::timestamptz
         ORDER BY created_at DESC
         LIMIT 10`,
        [sinceIso],
        pool,
      ),
      query<{ id: string; s3_key: string | null; finished_at: string | null; job_type: string | null }>(
        `SELECT id::text AS id,
                s3_key,
                finished_at::text AS finished_at,
                job_type::text AS job_type
         FROM silver.export_job
         WHERE status = 'done'
           AND created_at >= $1::timestamptz
           AND s3_key IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 5`,
        [sinceIso],
        pool,
      ),
    ])

    const statusCounts = Object.fromEntries(
      statusCountsRes.rows.map((r) => [String(r.status), Number(r.count ?? 0)] as const),
    )

    const stuckQueued = stuckQueuedRes.rows
    const stuckRunning = stuckRunningRes.rows
    const failedJobs = failedRes.rows

    const bucket = String(config.storage.exports?.bucket || '').trim()
    const missingArtifacts: Array<{ id: string; s3_key: string; error?: string }> = []
    const s3CheckErrors: string[] = []

    if (!bucket && doneRes.rows.length > 0) {
      // We still surface this as a finding so the operator fixes workflow/env wiring.
      // The exports worker itself may still be healthy, but evidence cannot verify artifacts without bucket.
    } else if (bucket) {
      for (const job of doneRes.rows) {
        const key = String(job.s3_key || '').trim()
        if (!key) continue
        const exists = await headObjectExists(bucket, key)
        if (!exists.ok) {
          missingArtifacts.push({ id: job.id, s3_key: key, ...(exists.error ? { error: exists.error } : {}) })
          if (exists.error) s3CheckErrors.push(exists.error)
        }
      }
    }

    const parquetKeyMismatches = doneRes.rows.filter((job) => {
      const jobType = String(job.job_type || '')
      if (!jobType.endsWith('_parquet')) return false
      const key = String(job.s3_key || '')
      return !key.endsWith('.parquet')
    })

    const snowflakeRoleArn = String(process.env.SNOWFLAKE_PARTNER_ROLE_ARN || '').trim()
    let snowflakeRoleStatus: 'ok' | 'missing' | 'unknown' = snowflakeRoleArn ? 'unknown' : 'unknown'
    if (snowflakeRoleArn) {
      const roleName = resolveRoleNameFromArn(snowflakeRoleArn)
      if (!roleName) {
        snowflakeRoleStatus = 'missing'
        pointers.push({ kind: 'other', ref: snowflakeRoleArn, note: 'Invalid Snowflake partner role ARN format' })
      } else {
        try {
          await getIamClient().send(new GetRoleCommand({ RoleName: roleName }))
          snowflakeRoleStatus = 'ok'
        } catch (error) {
          snowflakeRoleStatus = 'missing'
          const msg = error instanceof Error ? error.message : String(error)
          pointers.push({ kind: 'other', ref: snowflakeRoleArn, note: `Snowflake partner role missing: ${msg}` })
        }
      }
    }

    let queueUrl = ''
    let queueName = getExportsQueueName(env)
    let queueUrlSource = 'unknown'
    let queueStats: { visible: number; inFlight: number; delayed: number; total: number } | null = null
    let queueOldestAgeSeconds: number | null = null
    let dlqUrl: string | null = null
    let dlqDepth = 0

    try {
      const resolved = await resolveExportsQueueUrl(env)
      queueUrl = resolved.queueUrl
      queueName = resolved.queueName
      queueUrlSource = resolved.source

      queueStats = await getQueueStats(queueUrl)
      queueOldestAgeSeconds = await getQueueAgeSeconds(queueUrl)
      dlqUrl = await getQueueDLQ(queueUrl)
      dlqDepth = dlqUrl ? await getQueueDepth(dlqUrl) : 0
    } catch (error) {
      // Keep DB evidence usable even if AWS access is misconfigured in workflow.
      const msg = error instanceof Error ? error.message : String(error)
      pointers.push({ kind: 'other', ref: `exports_queue_probe_failed:${msg}`, note: 'AWS SQS evidence failed' })
    }

    const findings: EvidenceFinding[] = []

    if (dlqDepth > 0) {
      findings.push({
        reason_code: 'exports.dlq_nonzero',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Exports DLQ depth is ${dlqDepth}.`,
        details: { queue_name: queueName, dlq_url: dlqUrl, dlq_depth: dlqDepth },
      })
    }

    if (failedJobs.length > 0) {
      findings.push({
        reason_code: 'exports.job_failed_recently',
        severity: env === 'prod' ? 'sev1' : 'sev2',
        message: `${failedJobs.length} export jobs failed in the last ${windowHours}h (sampled).`,
        details: { failed_sample: failedJobs.slice(0, 10) },
      })
    }

    if (stuckQueued.length > 0) {
      findings.push({
        reason_code: 'exports.job_stuck_queued',
        severity: env === 'prod' ? 'sev1' : 'sev2',
        message: `${stuckQueued.length} export jobs appear stuck queued (older than ${stuckQueuedMinutes(env)}m).`,
        details: { queued_before: queuedBeforeIso, stuck_queued_sample: stuckQueued },
      })
    }

    if (stuckRunning.length > 0) {
      findings.push({
        reason_code: 'exports.job_stuck_running',
        severity: env === 'prod' ? 'sev1' : 'sev2',
        message: `${stuckRunning.length} export jobs appear stuck running (older than ${stuckRunningMinutes(env)}m).`,
        details: { running_before: runningBeforeIso, stuck_running_sample: stuckRunning },
      })
    }

    if (!bucket && doneRes.rows.length > 0) {
      findings.push({
        reason_code: 'exports.config_missing_bucket',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: 'EXPORTS_S3_BUCKET is not configured; cannot verify export artifacts.',
        details: { done_jobs_with_s3_key_sample: doneRes.rows.map((r) => ({ id: r.id, s3_key: r.s3_key })) },
      })
    }

    if (bucket && missingArtifacts.length > 0) {
      for (const m of missingArtifacts.slice(0, 10)) {
        pointers.push({ kind: 's3', ref: `s3://${bucket}/${m.s3_key}`, note: `missing export artifact for job ${m.id}` })
      }
      findings.push({
        reason_code: 'exports.s3_artifact_missing',
        severity: env === 'prod' ? 'sev1' : 'sev2',
        message: `${missingArtifacts.length}/${doneRes.rows.length} recent done export jobs are missing S3 artifacts.`,
        details: { bucket, missing_sample: missingArtifacts.slice(0, 10), s3_check_errors_sample: s3CheckErrors.slice(0, 3) },
      })
    }

    if (parquetKeyMismatches.length > 0) {
      findings.push({
        reason_code: 'exports.parquet_key_mismatch',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: `${parquetKeyMismatches.length} parquet export jobs have non-parquet S3 keys.`,
        details: { mismatched_sample: parquetKeyMismatches.slice(0, 10) },
      })
    }

    if (snowflakeRoleArn && snowflakeRoleStatus === 'missing') {
      findings.push({
        reason_code: 'exports.snowflake_role_missing',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: 'Snowflake partner role ARN is configured but role was not found.',
        details: { snowflake_partner_role_arn: snowflakeRoleArn },
      })
    }

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.exports_health.github_actions',
      summary: [
        `env=${env}`,
        `window_hours=${windowHours}`,
        `export_job_status_counts=${JSON.stringify(statusCounts)}`,
        `stuck_queued_sample=${stuckQueued.length}`,
        `stuck_running_sample=${stuckRunning.length}`,
        `failed_sample=${failedJobs.length}`,
        `done_s3_checked=${bucket ? doneRes.rows.length : 0}`,
        `done_s3_missing=${missingArtifacts.length}`,
        `parquet_key_mismatch=${parquetKeyMismatches.length}`,
        snowflakeRoleArn ? `snowflake_partner_role=${snowflakeRoleStatus}` : `snowflake_partner_role=unconfigured`,
        queueStats
          ? `queue_total=${queueStats.total} queue_oldest_age_seconds=${queueOldestAgeSeconds !== null ? Math.round(queueOldestAgeSeconds) : 'null'} dlq_depth=${dlqDepth} queue_url_source=${queueUrlSource}`
          : `queue_probe=unavailable`,
      ].join(' | '),
      findings,
      recommended_next_skill_ids: ['evidence.queue_backlog.github_actions', 'manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    evidence.findings.push({
      reason_code: 'exports.stats',
      severity: 'sev3',
      message: 'Exports health snapshot.',
      details: {
        env,
        window_hours: windowHours,
        since: sinceIso,
        export_job_status_counts: statusCounts,
        recent_jobs_sample: recentRes.rows.slice(0, 20),
        queued_before: queuedBeforeIso,
        running_before: runningBeforeIso,
        stuck_queued_sample: stuckQueued,
        stuck_running_sample: stuckRunning,
        failed_sample: failedJobs,
        s3_bucket: bucket || null,
        s3_checked_jobs: doneRes.rows,
        s3_missing_sample: missingArtifacts.slice(0, 10),
        exports_queue: queueUrl
          ? {
              queue_name: queueName,
              queue_url: queueUrl,
              queue_url_source: queueUrlSource,
              stats: queueStats,
              oldest_age_seconds: queueOldestAgeSeconds,
              dlq_url: dlqUrl,
              dlq_depth: dlqDepth,
            }
          : null,
      },
    })

    writeEvidenceResult(evidence)
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    const evidence: EvidenceResult = {
      success: false,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.exports_health.github_actions',
      summary: 'Exports health evidence generation failed.',
      findings: [
        { reason_code: 'evidence.error', severity: env === 'prod' ? 'sev1' : 'sev2', message, details: { stack } },
      ],
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }
    writeEvidenceResult(evidence)
    process.exit(1)
  } finally {
    await pool.end().catch(() => {})
  }
}

main().catch((error) => {
  console.error('exports_health_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})
