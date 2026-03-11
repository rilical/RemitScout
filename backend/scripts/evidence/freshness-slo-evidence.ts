import type { Pool } from 'pg'

import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { getSLOTarget } from '../../shared/slo-tracker'
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

const TIER_1_FILTER = ['tier_1', 'tier_1_alpha']
const TIER_2_FILTER = ['tier_2']

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseWindowHours = (value: string | undefined): number => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 24
  return Math.min(168, Math.max(1, Math.floor(n)))
}

const querySingle = async <T extends Record<string, unknown>>(
  pool: Pool,
  sql: string,
  params: unknown[],
  field: keyof T,
): Promise<number | null> => {
  const result = await query<T>(sql, params, pool)
  return toNumber(result.rows[0]?.[field])
}

const fetchFreshnessP95 = async (pool: Pool, filter: string[], sinceIso: string): Promise<number | null> => {
  return querySingle<{ p95_seconds: number | null }>(
    pool,
    `SELECT percentile_cont(0.95) WITHIN GROUP (
       ORDER BY EXTRACT(EPOCH FROM (NOW() - lqp.collected_at))
     )::double precision AS p95_seconds
     FROM silver.latest_quote_by_provider lqp
     JOIN silver.corridor_priority cp ON cp.corridor_id = lqp.corridor_id
     WHERE lqp.status = 'ok'
       AND lqp.collected_at >= $1::timestamptz
       AND cp.priority_tier = ANY($2::text[])`,
    [sinceIso, filter],
    'p95_seconds',
  )
}

const fetchMissingCorridorCount = async (pool: Pool, filter: string[], sinceIso: string): Promise<number> => {
  const res = await query<{ missing_count: number | null }>(
    `WITH last_ok AS (
       SELECT corridor_id, MAX(collected_at) AS last_collected_at
       FROM silver.latest_quote_by_provider
       WHERE status = 'ok'
       GROUP BY corridor_id
     )
     SELECT COUNT(*)::int AS missing_count
     FROM silver.corridor_priority cp
     LEFT JOIN last_ok l ON l.corridor_id = cp.corridor_id
     WHERE cp.priority_tier = ANY($1::text[])
       AND (l.last_collected_at IS NULL OR l.last_collected_at < $2::timestamptz)`,
    [filter, sinceIso],
    pool,
  )
  return Number(res.rows[0]?.missing_count ?? 0)
}

const fetchMissingCorridorSample = async (pool: Pool, filter: string[], sinceIso: string): Promise<string[]> => {
  const res = await query<{ corridor_id: string }>(
    `WITH last_ok AS (
       SELECT corridor_id, MAX(collected_at) AS last_collected_at
       FROM silver.latest_quote_by_provider
       WHERE status = 'ok'
       GROUP BY corridor_id
     )
     SELECT cp.corridor_id
     FROM silver.corridor_priority cp
     LEFT JOIN last_ok l ON l.corridor_id = cp.corridor_id
     WHERE cp.priority_tier = ANY($1::text[])
       AND (l.last_collected_at IS NULL OR l.last_collected_at < $2::timestamptz)
     ORDER BY cp.corridor_id ASC
     LIMIT 10`,
    [filter, sinceIso],
    pool,
  )
  return res.rows.map((r) => String(r.corridor_id).toUpperCase()).filter(Boolean)
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
    const [p95Tier1, p95Tier2, missingTier1, missingTier2, sampleTier1, sampleTier2] = await Promise.all([
      fetchFreshnessP95(pool, TIER_1_FILTER, sinceIso),
      fetchFreshnessP95(pool, TIER_2_FILTER, sinceIso),
      fetchMissingCorridorCount(pool, TIER_1_FILTER, sinceIso),
      fetchMissingCorridorCount(pool, TIER_2_FILTER, sinceIso),
      fetchMissingCorridorSample(pool, TIER_1_FILTER, sinceIso),
      fetchMissingCorridorSample(pool, TIER_2_FILTER, sinceIso),
    ])

    const t1 = getSLOTarget('freshness_p95')?.threshold ?? 15 * 60
    const t2 = getSLOTarget('freshness_p95_tier2')?.threshold ?? 3 * 60 * 60

    const findings: EvidenceFinding[] = []

    if (p95Tier1 !== null && p95Tier1 > t1) {
      findings.push({
        reason_code: 'freshness.p95_high',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Tier-1 freshness p95 ${(p95Tier1 / 60).toFixed(1)}m exceeds threshold ${(t1 / 60).toFixed(1)}m.`,
        details: { p95_seconds: p95Tier1, threshold_seconds: t1, window_hours: windowHours },
      })
    }

    if (p95Tier2 !== null && p95Tier2 > t2) {
      findings.push({
        reason_code: 'freshness.tier2_regression',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Tier-2 freshness p95 ${(p95Tier2 / 60).toFixed(1)}m exceeds threshold ${(t2 / 60).toFixed(1)}m.`,
        details: { p95_seconds: p95Tier2, threshold_seconds: t2, window_hours: windowHours },
      })
    }

    if ((missingTier1 + missingTier2) > 0) {
      findings.push({
        reason_code: 'freshness.missing_quotes',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Missing fresh quotes for tier corridors (tier1=${missingTier1}, tier2=${missingTier2}) within ${windowHours}h.`,
        details: {
          window_hours: windowHours,
          tier1_missing_count: missingTier1,
          tier2_missing_count: missingTier2,
          tier1_missing_sample: sampleTier1,
          tier2_missing_sample: sampleTier2,
        },
      })
    }

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.freshness_slo.github_actions',
      summary: [
        `env=${env}`,
        `window_hours=${windowHours}`,
        `p95_tier1_seconds=${p95Tier1 !== null ? Math.round(p95Tier1) : 'null'}`,
        `p95_tier2_seconds=${p95Tier2 !== null ? Math.round(p95Tier2) : 'null'}`,
        `threshold_tier1_seconds=${t1}`,
        `threshold_tier2_seconds=${t2}`,
        `missing_tier1=${missingTier1}`,
        `missing_tier2=${missingTier2}`,
      ].join(' | '),
      findings,
      recommended_next_skill_ids: ['evidence.no_quotes_audit.github_actions', 'evidence.provider_health.github_actions', 'manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    evidence.findings.push({
      reason_code: 'freshness.stats',
      severity: 'sev3',
      message: 'Freshness SLO snapshot.',
      details: {
        env,
        window_hours: windowHours,
        since: sinceIso,
        p95_tier1_seconds: p95Tier1,
        p95_tier2_seconds: p95Tier2,
        threshold_tier1_seconds: t1,
        threshold_tier2_seconds: t2,
        tier1_missing_count: missingTier1,
        tier2_missing_count: missingTier2,
        tier1_missing_sample: sampleTier1,
        tier2_missing_sample: sampleTier2,
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
      skill_id: 'evidence.freshness_slo.github_actions',
      summary: 'Freshness SLO evidence generation failed.',
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
  console.error('freshness_slo_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})

