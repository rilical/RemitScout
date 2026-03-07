import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { HEALTH_CORRIDORS } from '../../shared/health-corridors'
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

const tier0Corridors = Array.from(new Set(Object.values(HEALTH_CORRIDORS).flat()))

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseIntOr = (value: string | undefined, fallback: number) => {
  const raw = String(value ?? '').trim()
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? Math.floor(n) : fallback
}

const hoursBetween = (aIso: string, bIso: string) => {
  const a = new Date(aIso).getTime()
  const b = new Date(bIso).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.abs(a - b) / (1000 * 60 * 60)
}

const main = async () => {
  const env = resolveCaseEnv(config.envName || process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')
  const caseId = String(process.env.CASE_ID || '').trim()
  const amountBucket = Math.max(1, Math.min(100000, parseIntOr(process.env.AMOUNT_BUCKET, 500)))
  const methodProfile = String(process.env.METHOD_PROFILE || 'standard_bank').trim() || 'standard_bank'

  const pointers: EvidencePointer[] = []
  const runUrl = getGithubActionsRunUrl()
  if (runUrl) pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'Evidence workflow run' })

  if (tier0Corridors.length === 0) {
    const evidence: EvidenceResult = {
      success: false,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.indices_readiness.github_actions',
      summary: 'Tier-0 corridor set is empty (HEALTH_CORRIDORS).',
      findings: [
        {
          reason_code: 'indices.missing_corridors',
          severity: 'sev3',
          message: 'Tier-0 corridors set is empty.',
          details: { corridors_expected: 0 },
        },
      ],
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }
    writeEvidenceResult(evidence)
    process.exit(1)
  }

  const pool = createPool(config.db.planeBUrl)

  try {
    const cdp = await query<{
      total: number | null
      available: number | null
      suppressed: number | null
      min_provider_count: number | null
      weight_confidence_p10: number | null
      latest_date: string | null
    }>(
      `WITH latest AS (
         SELECT DISTINCT ON (corridor_id)
           corridor_id,
           date,
           suppression_flag,
           provider_count,
           weight_confidence
         FROM gold_export.cdp_daily
         WHERE corridor_id = ANY($1::text[])
           AND amount_bucket = $2
           AND method_profile = $3::method_profile
         ORDER BY corridor_id, date DESC
       )
       SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE suppression_flag IS FALSE)::int AS available,
         COUNT(*) FILTER (WHERE suppression_flag IS TRUE)::int AS suppressed,
         MIN(provider_count)::int AS min_provider_count,
         percentile_cont(0.1) WITHIN GROUP (ORDER BY weight_confidence)::double precision
           AS weight_confidence_p10,
         MAX(date)::text AS latest_date
       FROM latest`,
      [tier0Corridors, amountBucket, methodProfile],
      pool,
    )

    const fx = await query<{ last_updated: string | null }>(
      `SELECT MAX(last_updated)::text AS last_updated
       FROM gold.fx_rates`,
      [],
      pool,
    ).catch(() => ({ rows: [] as Array<{ last_updated: string | null }> }))

    const row = cdp.rows[0]
    const corridorsExpected = tier0Corridors.length
    const total = Number(row?.total ?? 0)
    const available = Number(row?.available ?? 0)
    const suppressed = Number(row?.suppressed ?? 0)
    const missing = Math.max(0, corridorsExpected - total)
    const availableRatio = total > 0 ? available / total : 0
    const suppressedRatio = total > 0 ? suppressed / total : 0
    const minProviderCount = toNumber(row?.min_provider_count)
    const weightConfidenceP10 = toNumber(row?.weight_confidence_p10)
    const latestDate = row?.latest_date ?? null

    const fxLastUpdated = fx.rows[0]?.last_updated ?? null
    const fxAgeHours = fxLastUpdated ? hoursBetween(new Date().toISOString(), fxLastUpdated) : null

    const findings: EvidenceFinding[] = []

    if (missing > 0) {
      findings.push({
        reason_code: 'indices.missing_corridors',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `${missing} tier-0 corridors are missing from gold_export.cdp_daily latest snapshot.`,
        details: { corridors_expected: corridorsExpected, corridors_observed: total, corridors_missing: missing, amount_bucket: amountBucket, method_profile: methodProfile },
      })
    }

    if (availableRatio < 0.8) {
      findings.push({
        reason_code: 'indices.low_available_ratio',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Available ratio ${availableRatio.toFixed(3)} is below 0.8.`,
        details: { available_ratio: availableRatio, available, total },
      })
    }

    if (suppressedRatio > 0.2) {
      findings.push({
        reason_code: 'indices.high_suppressed_ratio',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Suppressed ratio ${suppressedRatio.toFixed(3)} exceeds 0.2.`,
        details: { suppressed_ratio: suppressedRatio, suppressed, total },
      })
    }

    if (minProviderCount !== null && minProviderCount < 3) {
      findings.push({
        reason_code: 'indices.low_provider_count',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Min provider_count ${minProviderCount} is below 3.`,
        details: { min_provider_count: minProviderCount },
      })
    }

    if (weightConfidenceP10 !== null && weightConfidenceP10 < 0.3) {
      findings.push({
        reason_code: 'indices.low_weight_confidence',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Weight confidence p10 ${weightConfidenceP10.toFixed(3)} is below 0.3.`,
        details: { weight_confidence_p10: weightConfidenceP10 },
      })
    }

    if (fxAgeHours !== null && fxAgeHours > 24) {
      findings.push({
        reason_code: 'indices.fx_stale',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `Gold FX rates appear stale (${fxAgeHours.toFixed(1)}h since last update).`,
        details: { fx_last_updated: fxLastUpdated, fx_age_hours: fxAgeHours },
      })
    }

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.indices_readiness.github_actions',
      summary: [
        `env=${env}`,
        `corridors_expected=${corridorsExpected}`,
        `corridors_observed=${total}`,
        `corridors_missing=${missing}`,
        `available_ratio=${availableRatio.toFixed(3)}`,
        `suppressed_ratio=${suppressedRatio.toFixed(3)}`,
        `min_provider_count=${minProviderCount ?? 'null'}`,
        `weight_confidence_p10=${weightConfidenceP10 ?? 'null'}`,
        `latest_date=${latestDate ?? 'null'}`,
        `amount_bucket=${amountBucket}`,
        `method_profile=${methodProfile}`,
        `fx_last_updated=${fxLastUpdated ?? 'null'}`,
      ].join(' | '),
      findings,
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    evidence.findings.push({
      reason_code: 'indices.stats',
      severity: 'sev3',
      message: 'Indices readiness snapshot.',
      details: {
        corridors_expected: corridorsExpected,
        corridors_observed: total,
        corridors_missing: missing,
        available,
        suppressed,
        available_ratio: availableRatio,
        suppressed_ratio: suppressedRatio,
        min_provider_count: minProviderCount,
        weight_confidence_p10: weightConfidenceP10,
        latest_date: latestDate,
        amount_bucket: amountBucket,
        method_profile: methodProfile,
        fx_last_updated: fxLastUpdated,
        fx_age_hours: fxAgeHours,
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
      skill_id: 'evidence.indices_readiness.github_actions',
      summary: 'Indices readiness evidence generation failed.',
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
  console.error('indices_readiness_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
  process.exit(1)
})
