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

type ThroughputRow = {
  provider_id: string
  bronze_count: number | null
  silver_count: number | null
  bronze_latest: string | null
  silver_latest: string | null
}

const parseWindowHours = (value: string | undefined): number => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 6
  return Math.min(168, Math.max(1, Math.floor(n)))
}

const lagThresholdHours = (env: 'dev' | 'staging' | 'prod'): number => {
  if (env === 'prod') return 1
  if (env === 'staging') return 2
  return 4
}

const diffHours = (newerIso: string, olderIso: string): number | null => {
  const newer = new Date(newerIso).getTime()
  const older = new Date(olderIso).getTime()
  if (!Number.isFinite(newer) || !Number.isFinite(older)) return null
  return (newer - older) / (1000 * 60 * 60)
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
    const res = await query<ThroughputRow>(
      `WITH bronze AS (
         SELECT provider_id,
                COUNT(*)::int AS bronze_count,
                MAX(ingested_at)::text AS bronze_latest
         FROM bronze.provider_raw
         WHERE ingested_at >= $1::timestamptz
         GROUP BY provider_id
       ),
       silver AS (
         SELECT provider_id,
                COUNT(*)::int AS silver_count,
                MAX(collected_at)::text AS silver_latest
         FROM silver.quote_record
         WHERE collected_at >= $1::timestamptz
         GROUP BY provider_id
       )
       SELECT
         COALESCE(b.provider_id, s.provider_id) AS provider_id,
         COALESCE(b.bronze_count, 0)::int AS bronze_count,
         COALESCE(s.silver_count, 0)::int AS silver_count,
         b.bronze_latest,
         s.silver_latest
       FROM bronze b
       FULL OUTER JOIN silver s ON s.provider_id = b.provider_id
       ORDER BY COALESCE(b.bronze_count, 0) DESC, COALESCE(s.silver_count, 0) DESC`,
      [sinceIso],
      pool,
    )

    const rows = res.rows
      .map((r) => ({
        provider_id: String(r.provider_id || '').trim(),
        bronze_count: Number(r.bronze_count ?? 0),
        silver_count: Number(r.silver_count ?? 0),
        bronze_latest: r.bronze_latest ? String(r.bronze_latest) : null,
        silver_latest: r.silver_latest ? String(r.silver_latest) : null,
      }))
      .filter((r) => Boolean(r.provider_id))

    const lagThreshold = lagThresholdHours(env)

    const dropped = rows
      .filter((r) => r.bronze_count > 0 && r.silver_count === 0)
      .sort((a, b) => b.bronze_count - a.bronze_count)
      .slice(0, 10)

    const lagHigh = rows
      .map((r) => {
        const lag = (r.bronze_latest && r.silver_latest) ? diffHours(r.bronze_latest, r.silver_latest) : null
        return { ...r, lag_hours: lag }
      })
      .filter((r) => (r.lag_hours !== null && r.lag_hours > lagThreshold))
      .sort((a, b) => (b.lag_hours ?? 0) - (a.lag_hours ?? 0))
      .slice(0, 10)

    const ratioLow = rows
      .map((r) => {
        const ratio = r.bronze_count > 0 ? r.silver_count / r.bronze_count : null
        return { ...r, ratio }
      })
      .filter((r) => r.ratio !== null && r.bronze_count >= 50 && r.ratio < 0.2)
      .sort((a, b) => (a.ratio ?? 1) - (b.ratio ?? 1))
      .slice(0, 10)

    const findings: EvidenceFinding[] = []

    if (dropped.length > 0) {
      findings.push({
        reason_code: 'pipeline.bronze_write_dropped',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `${dropped.length} providers have Bronze writes but no Silver quote rows in the last ${windowHours}h (sampled).`,
        details: { window_hours: windowHours, providers: dropped.map((p) => ({ provider_id: p.provider_id, bronze_count: p.bronze_count })) },
      })
    }

    if (lagHigh.length > 0) {
      findings.push({
        reason_code: 'pipeline.silver_lag_high',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `${lagHigh.length} providers show Silver lag > ${lagThreshold}h behind Bronze (sampled).`,
        details: {
          window_hours: windowHours,
          lag_threshold_hours: lagThreshold,
          providers: lagHigh.map((p) => ({ provider_id: p.provider_id, lag_hours: p.lag_hours, bronze_latest: p.bronze_latest, silver_latest: p.silver_latest })),
        },
      })
    }

    if (ratioLow.length > 0) {
      findings.push({
        reason_code: 'pipeline.conversion_ratio_low',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: `${ratioLow.length} providers have low Bronze->Silver conversion ratio (<0.2) (sampled).`,
        details: {
          window_hours: windowHours,
          ratio_threshold: 0.2,
          providers: ratioLow.map((p) => ({ provider_id: p.provider_id, ratio: p.ratio, bronze_count: p.bronze_count, silver_count: p.silver_count })),
        },
      })
    }

    const totalBronze = rows.reduce((acc, r) => acc + r.bronze_count, 0)
    const totalSilver = rows.reduce((acc, r) => acc + r.silver_count, 0)
    const providerCount = rows.length

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.bronze_silver_throughput.github_actions',
      summary: [
        `env=${env}`,
        `window_hours=${windowHours}`,
        `providers_observed=${providerCount}`,
        `bronze_rows=${totalBronze}`,
        `silver_rows=${totalSilver}`,
        `lag_threshold_hours=${lagThreshold}`,
      ].join(' | '),
      findings,
      recommended_next_skill_ids: ['evidence.provider_health.github_actions', 'manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    evidence.findings.push({
      reason_code: 'pipeline.stats',
      severity: 'sev3',
      message: 'Bronze->Silver throughput snapshot.',
      details: {
        env,
        window_hours: windowHours,
        since: sinceIso,
        providers_observed: providerCount,
        bronze_rows: totalBronze,
        silver_rows: totalSilver,
        lag_threshold_hours: lagThreshold,
        top_dropped: dropped,
        top_lagging: lagHigh,
        top_ratio_low: ratioLow,
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
      skill_id: 'evidence.bronze_silver_throughput.github_actions',
      summary: 'Bronze->Silver throughput evidence generation failed.',
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
  console.error('bronze_silver_throughput_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})

