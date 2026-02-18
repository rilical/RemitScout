import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
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

const parseLongQuerySeconds = (value: string | undefined): number => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 60
  return Math.min(3600, Math.max(10, Math.floor(n)))
}

const main = async () => {
  const env = resolveCaseEnv(config.envName || process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')
  const caseId = String(process.env.CASE_ID || '').trim()
  const longQuerySeconds = parseLongQuerySeconds(process.env.LONG_QUERY_SECONDS)
  const longQueryBeforeIso = new Date(Date.now() - longQuerySeconds * 1000).toISOString()

  const pointers: EvidencePointer[] = []
  const runUrl = getGithubActionsRunUrl()
  if (runUrl) pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'Evidence workflow run' })

  const pool = createPool(config.db.planeBUrl)
  try {
    await query(`SELECT 1`, [], pool)

    let maxConnections: number | null = null
    let connections: number | null = null
    let pressure: number | null = null

    try {
      const maxRes = await query<{ setting: string }>(
        `SELECT setting
         FROM pg_settings
         WHERE name = 'max_connections'`,
        [],
        pool,
      )
      maxConnections = Number(maxRes.rows[0]?.setting ?? NaN)
      if (!Number.isFinite(maxConnections)) maxConnections = null
    } catch {
      maxConnections = null
    }

    try {
      const connRes = await query<{ connections: number | null }>(
        `SELECT COUNT(*)::int AS connections
         FROM pg_stat_activity`,
        [],
        pool,
      )
      connections = Number(connRes.rows[0]?.connections ?? NaN)
      if (!Number.isFinite(connections)) connections = null
    } catch {
      connections = null
    }

    if (maxConnections !== null && connections !== null && maxConnections > 0) {
      pressure = connections / maxConnections
    }

    const findings: EvidenceFinding[] = []

    if (pressure !== null && pressure >= 0.8) {
      findings.push({
        reason_code: 'db.connection_pressure_high',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `DB connection pressure is high (${(pressure * 100).toFixed(1)}% of max_connections).`,
        details: { connections, max_connections: maxConnections, pressure_ratio: pressure },
      })
    }

    let longQueryCount: number | null = null
    let longQuerySample: Array<Record<string, unknown>> = []
    try {
      const countRes = await query<{ count: number | null }>(
        `SELECT COUNT(*)::int AS count
         FROM pg_stat_activity
         WHERE pid <> pg_backend_pid()
           AND state <> 'idle'
           AND query_start IS NOT NULL
           AND query_start < $1::timestamptz`,
        [longQueryBeforeIso],
        pool,
      )
      longQueryCount = Number(countRes.rows[0]?.count ?? 0)

      const sampleRes = await query<{
        pid: number | null
        usename: string | null
        application_name: string | null
        state: string | null
        wait_event_type: string | null
        wait_event: string | null
        query_start: string | null
        xact_start: string | null
      }>(
        `SELECT
           pid::int,
           usename::text,
           application_name::text,
           state::text,
           wait_event_type::text,
           wait_event::text,
           query_start::text,
           xact_start::text
         FROM pg_stat_activity
         WHERE pid <> pg_backend_pid()
           AND state <> 'idle'
           AND query_start IS NOT NULL
           AND query_start < $1::timestamptz
         ORDER BY query_start ASC
         LIMIT 10`,
        [longQueryBeforeIso],
        pool,
      )
      longQuerySample = sampleRes.rows.map((r) => ({
        pid: r.pid,
        user: r.usename,
        app: r.application_name,
        state: r.state,
        wait_event_type: r.wait_event_type,
        wait_event: r.wait_event,
        query_start: r.query_start,
        xact_start: r.xact_start,
      }))
    } catch (error) {
      findings.push({
        reason_code: 'db.long_query_observation_failed',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: 'Unable to inspect pg_stat_activity for long-running queries.',
        details: { error: error instanceof Error ? error.message : String(error) },
      })
    }

    if (longQueryCount !== null && longQueryCount > 0) {
      findings.push({
        reason_code: 'db.long_query_detected',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `${longQueryCount} long-running queries detected (> ${longQuerySeconds}s).`,
        details: { threshold_seconds: longQuerySeconds, before: longQueryBeforeIso, sample: longQuerySample },
      })
    }

    let largestTables: Array<{ schema: string; table: string; bytes: number }> = []
    try {
      const res = await query<{ schema: string | null; table: string | null; bytes: string | number | null }>(
        `SELECT
           n.nspname::text AS schema,
           c.relname::text AS table,
           pg_total_relation_size(c.oid)::bigint AS bytes
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname IN ('bronze', 'silver', 'gold')
           AND c.relkind = 'r'
         ORDER BY pg_total_relation_size(c.oid) DESC
         LIMIT 10`,
        [],
        pool,
      )
      largestTables = res.rows
        .map((r) => ({
          schema: String(r.schema || ''),
          table: String(r.table || ''),
          bytes: Number(r.bytes ?? 0),
        }))
        .filter((r) => r.schema && r.table && Number.isFinite(r.bytes))
    } catch {
      largestTables = []
    }

    const bigTables = largestTables.filter((t) => t.bytes >= 50 * 1024 * 1024 * 1024).slice(0, 10)
    if (bigTables.length > 0) {
      findings.push({
        reason_code: 'db.table_size_high',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: `${bigTables.length} tables exceed 50GiB (sampled).`,
        details: { threshold_bytes: 50 * 1024 * 1024 * 1024, tables: bigTables },
      })
    }

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.db_health.github_actions',
      summary: [
        `env=${env}`,
        `connections=${connections ?? 'null'}`,
        `max_connections=${maxConnections ?? 'null'}`,
        `pressure_ratio=${pressure !== null ? pressure.toFixed(3) : 'null'}`,
        `long_query_threshold_seconds=${longQuerySeconds}`,
        `long_query_count=${longQueryCount ?? 'null'}`,
        `largest_tables_sample=${largestTables.length}`,
      ].join(' | '),
      findings,
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    evidence.findings.push({
      reason_code: 'db.stats',
      severity: 'sev3',
      message: 'DB health snapshot.',
      details: {
        env,
        connections,
        max_connections: maxConnections,
        pressure_ratio: pressure,
        long_query_threshold_seconds: longQuerySeconds,
        long_query_count: longQueryCount,
        long_query_sample: longQuerySample,
        largest_tables: largestTables,
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
      skill_id: 'evidence.db_health.github_actions',
      summary: 'DB health evidence generation failed.',
      findings: [
        { reason_code: 'db.connection_failed', severity: env === 'prod' ? 'sev1' : 'sev2', message, details: { stack } },
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
  console.error('db_health_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})

