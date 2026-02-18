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

const hoursSince = (iso: string): number | null => {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return null
  return (Date.now() - t) / (1000 * 60 * 60)
}

const staleThresholdHours = (env: 'dev' | 'staging' | 'prod'): number => {
  if (env === 'prod') return 6
  if (env === 'staging') return 12
  return 24
}

const main = async () => {
  const env = resolveCaseEnv(config.envName || process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')
  const caseId = String(process.env.CASE_ID || '').trim()

  const pointers: EvidencePointer[] = []
  const runUrl = getGithubActionsRunUrl()
  if (runUrl) pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'Evidence workflow run' })

  const pool = createPool(config.db.planeBUrl)
  try {
    const res = await query<{ total: number | null; last_updated: string | null }>(
      `SELECT
         COUNT(*)::int AS total,
         MAX(updated_at)::text AS last_updated
       FROM gold.pulse_cache`,
      [],
      pool,
    )

    const row = res.rows[0]
    const total = Number(row?.total ?? 0)
    const lastUpdated = row?.last_updated ?? null
    const ageHours = lastUpdated ? hoursSince(lastUpdated) : null
    const threshold = staleThresholdHours(env)

    const findings: EvidenceFinding[] = []

    if (total <= 0) {
      findings.push({
        reason_code: 'pulse.cache_missing_keys',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: 'gold.pulse_cache is empty.',
        details: { total_keys: total },
      })
    }

    if (!lastUpdated || (ageHours !== null && ageHours > threshold)) {
      findings.push({
        reason_code: 'pulse.cache_stale',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: lastUpdated
          ? `gold.pulse_cache appears stale (${ageHours?.toFixed(1)}h > ${threshold}h).`
          : `gold.pulse_cache last_updated is missing.`,
        details: { last_updated: lastUpdated, age_hours: ageHours, threshold_hours: threshold, total_keys: total },
      })
    }

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.pulse_cache_health.github_actions',
      summary: [
        `env=${env}`,
        `pulse_cache_total_keys=${total}`,
        `pulse_cache_last_updated=${lastUpdated ?? 'null'}`,
        `pulse_cache_age_hours=${ageHours !== null ? ageHours.toFixed(2) : 'null'}`,
        `stale_threshold_hours=${threshold}`,
      ].join(' | '),
      findings,
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    evidence.findings.push({
      reason_code: 'pulse.stats',
      severity: 'sev3',
      message: 'Pulse cache snapshot.',
      details: { total_keys: total, last_updated: lastUpdated, age_hours: ageHours, stale_threshold_hours: threshold },
    })

    writeEvidenceResult(evidence)
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    const evidence: EvidenceResult = {
      success: false,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.pulse_cache_health.github_actions',
      summary: 'Pulse cache health evidence generation failed.',
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
  console.error('pulse_cache_health_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})

