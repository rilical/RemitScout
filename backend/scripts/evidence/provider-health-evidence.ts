import { createPool, query } from '../../shared/db'
import { config } from '../../shared/config'
import { formatError } from '../../shared/utils/error-handling'
import { getHealthCorridors, type ProviderId } from '../../shared/health-corridors'
import { getProviderCatalogEntry } from '../../shared/provider-catalog'
import {
  DEFAULT_EVIDENCE_BUDGETS,
  getGithubActionsRunUrl,
  resolveCaseEnv,
  writeEvidenceResult,
  type EvidenceFinding,
  type EvidencePointer,
  type EvidenceResult,
} from '../lib/evidence'

type IngestionRunRow = {
  run_id: string
  collector_type: string | null
  started_at: string | null
  finished_at: string | null
  status: string
  proxy_country: string | null
  error_code: string | null
  error_detail: string | null
  created_at: string
}

type OpsAlertRow = {
  provider_id: string | null
  corridor_id: string | null
  http_status: number | null
  block_reason: string | null
  proxy_country: string | null
  request_id: string | null
  created_at: string | null
}

type CircuitBreakerRow = {
  provider_id: string
  corridor_id: string | null
  state: string
  reason: string | null
  cooldown_until: string | null
  updated_at: string | null
}

type FreshnessRow = {
  corridor_id: string
  last_collected_at: string | null
}

export type ProviderHealthEvidenceInput = {
  providerId?: string
  windowHours?: number
  caseId?: string
  pool?: ReturnType<typeof createPool>
}

export type ProviderHealthEvidenceSummary = {
  providerId: string
  displayName: string
  windowHours: number
  runs: number
  successRuns: number
  alerts: number
  circuits: number
  missingCorridors: string[]
  staleCorridors: string[]
}

export type ProviderHealthEvidenceOutput = {
  evidence: EvidenceResult
  summary: ProviderHealthEvidenceSummary
}

const parseWindowHours = (value: string | undefined): number => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 6
  return Math.min(168, Math.max(1, Math.floor(n)))
}

export const collectProviderHealthEvidence = async (
  input: ProviderHealthEvidenceInput = {},
): Promise<ProviderHealthEvidenceOutput> => {
  const providerId = String(input.providerId || process.env.PROVIDER_ID || '').trim()
  if (!providerId) {
    throw new Error('Missing PROVIDER_ID')
  }

  const windowHours = input.windowHours ?? parseWindowHours(process.env.WINDOW_HOURS)
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()
  const caseId = String(input.caseId || process.env.CASE_ID || '').trim()

  const entry = getProviderCatalogEntry(providerId as ProviderId)
  const displayName = entry?.display_name ?? providerId
  const env = resolveCaseEnv(config.envName || process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')

  const pool = input.pool ?? createPool(config.db.planeBUrl)
  const ownsPool = !input.pool
  try {
    const healthCorridors = [...getHealthCorridors(providerId as ProviderId)].map((c) => String(c).trim()).filter(Boolean)

    const [runsResult, alertsResult, circuitsResult, freshnessResult] = await Promise.all([
      query<IngestionRunRow>(
        `SELECT run_id,
                collector_type,
                started_at,
                finished_at,
                status,
                proxy_country,
                error_code,
                error_detail,
                created_at
           FROM silver.ingestion_run
          WHERE provider_id = $1
            AND created_at >= $2::timestamptz
          ORDER BY created_at DESC
          LIMIT 10`,
        [providerId, since],
        pool,
      ),
      query<OpsAlertRow>(
        `SELECT provider_id,
                corridor_id,
                http_status,
                block_reason,
                proxy_country,
                request_id,
                created_at
           FROM silver.ops_alert_event
          WHERE provider_id = $1
            AND created_at >= $2::timestamptz
          ORDER BY created_at DESC
          LIMIT 20`,
        [providerId, since],
        pool,
      ),
      query<CircuitBreakerRow>(
        `SELECT provider_id,
                corridor_id,
                state,
                reason,
                cooldown_until,
                updated_at
           FROM silver.circuit_breaker
          WHERE provider_id = $1
            AND state = 'open'
          ORDER BY updated_at DESC
          LIMIT 10`,
        [providerId],
        pool,
      ),
      healthCorridors.length > 0
        ? query<FreshnessRow>(
            `SELECT corridor_id, MAX(collected_at) AS last_collected_at
               FROM silver.latest_quote_by_provider
              WHERE provider_id = $1
                AND corridor_id = ANY($2::text[])
              GROUP BY corridor_id`,
            [providerId, healthCorridors],
            pool,
          )
        : Promise.resolve({ rows: [] as FreshnessRow[] } as any),
    ])

    const runs = runsResult.rows
    const alerts = alertsResult.rows
    const circuits = circuitsResult.rows
    const freshnessRows = freshnessResult.rows

    const successRuns = runs.filter((r) => String(r.status || '').toLowerCase() === 'success').length

    const httpStatusCounts: Record<string, number> = {}
    for (const e of alerts) {
      const s = e.http_status === null || e.http_status === undefined ? 'null' : String(e.http_status)
      httpStatusCounts[s] = (httpStatusCounts[s] ?? 0) + 1
    }

    const has403 = alerts.some((e) => e.http_status === 403)
    const has429 = alerts.some((e) => e.http_status === 429)

    const latestByCorridor = new Map<string, string>()
    for (const row of freshnessRows) {
      if (row.corridor_id && row.last_collected_at) {
        latestByCorridor.set(String(row.corridor_id).toUpperCase(), String(row.last_collected_at))
      }
    }

    const missingCorridors: string[] = []
    const staleCorridors: string[] = []
    for (const corridor of healthCorridors) {
      const key = corridor.toUpperCase()
      const ts = latestByCorridor.get(key)
      if (!ts) {
        missingCorridors.push(key)
        continue
      }
      const ms = new Date(ts).getTime()
      if (!Number.isFinite(ms) || ms < new Date(since).getTime()) {
        staleCorridors.push(key)
      }
    }

    const findings: EvidenceFinding[] = []

    if (runs.length === 0) {
      findings.push({
        reason_code: 'provider.no_recent_runs',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `No ingestion runs recorded in the last ${windowHours}h.`,
        details: { provider_id: providerId, window_hours: windowHours },
      })
    } else if (successRuns === 0) {
      findings.push({
        reason_code: 'provider.no_recent_success',
        severity: env === 'prod' ? 'sev1' : (env === 'staging' ? 'sev2' : 'sev3'),
        message: `No successful ingestion runs in the last ${windowHours}h.`,
        details: { provider_id: providerId, window_hours: windowHours, runs: runs.length },
      })
    }

    if (has403) {
      findings.push({
        reason_code: 'provider.blocked.http_403',
        severity: env === 'prod' ? 'sev1' : 'sev2',
        message: 'Recent ops alerts include HTTP 403 (likely blocked).',
        details: { provider_id: providerId, http_status: 403, http_status_counts: httpStatusCounts },
      })
    }

    if (has429) {
      findings.push({
        reason_code: 'provider.rate_limited.http_429',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: 'Recent ops alerts include HTTP 429 (rate limited).',
        details: { provider_id: providerId, http_status: 429, http_status_counts: httpStatusCounts },
      })
    }

    if (circuits.length > 0) {
      findings.push({
        reason_code: 'provider.circuit_open',
        severity: env === 'prod' ? 'sev1' : 'sev2',
        message: 'Circuit breaker is open for one or more scopes.',
        details: {
          provider_id: providerId,
          open_scopes: circuits.map((c) => ({
            corridor_id: c.corridor_id,
            reason: c.reason,
            cooldown_until: c.cooldown_until,
            updated_at: c.updated_at,
          })),
        },
      })
    }

    if (missingCorridors.length > 0) {
      findings.push({
        reason_code: 'provider.freshness_missing',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: `Missing latest quotes for ${missingCorridors.length}/${healthCorridors.length} health corridors.`,
        details: { provider_id: providerId, missing_corridors: missingCorridors.slice(0, 10) },
      })
    }

    if (staleCorridors.length > 0) {
      findings.push({
        reason_code: 'provider.freshness_stale',
        severity: env === 'prod' ? 'sev2' : 'sev3',
        message: `Stale latest quotes for ${staleCorridors.length}/${healthCorridors.length} health corridors (older than ${windowHours}h).`,
        details: { provider_id: providerId, stale_corridors: staleCorridors.slice(0, 10), window_hours: windowHours },
      })
    }

    const pointers: EvidencePointer[] = []
    const runUrl = getGithubActionsRunUrl()
    if (runUrl) {
      pointers.push({ kind: 'github_actions_run', ref: runUrl, note: 'Evidence workflow run' })
    }

    const recommendedNext = new Set<string>()
    if (entry?.probe?.github_actions) {
      recommendedNext.add('probe.provider.github_actions')
    } else if (entry?.probe?.aws_scheduled) {
      recommendedNext.add('probe.provider.aws_scheduled')
    }
    if (missingCorridors.length > 0 || staleCorridors.length > 0) {
      recommendedNext.add('forensics.corridor_provider.local')
    }
    recommendedNext.add('manual.human_triage')

    const summaryParts = [
      `${displayName} (${providerId})`,
      `runs=${runs.length} successes=${successRuns}`,
      `alerts=${alerts.length}`,
      healthCorridors.length ? `health_corridors=${healthCorridors.length} missing=${missingCorridors.length} stale=${staleCorridors.length}` : 'health_corridors=0',
      `window=${windowHours}h`,
    ]

    const evidence: EvidenceResult = {
      success: findings.length === 0,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: caseId,
      skill_id: 'evidence.provider_health.github_actions',
      summary: summaryParts.join(' | '),
      findings,
      recommended_next_skill_ids: Array.from(recommendedNext.values()),
      pointers,
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }

    return {
      evidence,
      summary: {
        providerId,
        displayName,
        windowHours,
        runs: runs.length,
        successRuns,
        alerts: alerts.length,
        circuits: circuits.length,
        missingCorridors,
        staleCorridors,
      },
    }
  } catch (error: unknown) {
    const { message, stack } = formatError(error)
    const env = resolveCaseEnv(config.envName || process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev')
    const evidence: EvidenceResult = {
      success: false,
      generated_at: new Date().toISOString(),
      environment: env,
      case_id: String(process.env.CASE_ID || '').trim(),
      skill_id: 'evidence.provider_health.github_actions',
      summary: 'Provider health evidence generation failed.',
      findings: [
        {
          reason_code: 'evidence.error',
          severity: env === 'prod' ? 'sev1' : 'sev2',
          message,
          details: { stack },
        },
      ],
      recommended_next_skill_ids: ['manual.human_triage'],
      pointers: [],
      budgets: DEFAULT_EVIDENCE_BUDGETS,
    }
    return {
      evidence,
      summary: {
        providerId,
        displayName,
        windowHours,
        runs: 0,
        successRuns: 0,
        alerts: 0,
        circuits: 0,
        missingCorridors: [],
        staleCorridors: [],
      },
    }
  } finally {
    if (ownsPool) {
      await pool.end()
    }
  }
}

const main = async () => {
  const { evidence } = await collectProviderHealthEvidence()
  writeEvidenceResult(evidence)
  if (!evidence.success) {
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('provider_health_evidence_fatal', { error: error instanceof Error ? error.message : String(error) })
    process.exit(1)
  })
}
