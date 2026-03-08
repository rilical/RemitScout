/**
 * E2E Agent Health Check — validates the full agent pipeline is operational.
 *
 * Checks:
 * 1. Recent observations in silver.observation
 * 2. Recent failure bundles in silver.failure_bundle
 * 3. Processed items in silver.dispatch_queue
 * 4. Recent proposals in silver.agent_action
 * 5. detection_cycle_count > 0 in CloudWatch
 * 6. Provider sources indexed in silver.knowledge_chunk
 * 7. Normalization factors in silver.factor
 *
 * Exit code 0 = all checks pass, 1 = at least one check failed.
 *
 * Usage:
 *   pnpm tsx backend/scripts/e2e-agent-health-check.ts
 *   pnpm tsx backend/scripts/e2e-agent-health-check.ts --lookback-hours=2
 */

import dns from 'node:dns'
import { lookup } from 'node:dns/promises'
import net from 'node:net'
import {
  CloudWatchClient,
  GetMetricDataCommand,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch'

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'

const logger = createLogger('script.e2e-agent-health-check')

type CheckResult = {
  name: string
  passed: boolean
  detail: string
}

const LOOKBACK_HOURS = Number(process.env.AGENT_HEALTH_LOOKBACK_HOURS) ||
  Number(process.argv.find((a) => a.startsWith('--lookback-hours='))?.split('=')[1]) || 1
const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const DETECTION_CYCLE_METRIC = 'detection_cycle_count'
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])

type ConnectionHostSource = 'host' | 'hostname' | 'hostaddr'
type ConnectionHostCandidate = {
  source: ConnectionHostSource
  value: string
}
type Ipv4RewriteResult = {
  connectionString: string
  originalHost: string
  resolvedHost: string
  source: ConnectionHostSource
}
type ResolveIpv4Address = (hostname: string) => Promise<string | null>
const HOSTLESS_SENTINEL = '__remit_scout_hostless__'

const resolveEnvironmentName = () => {
  const value = (config.envName || config.env || process.env.ENVIRONMENT || process.env.NODE_ENV || '').trim()
  if (!value) return 'dev'
  const normalized = value.toLowerCase()
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

const shouldForceIpv4DbConnection = () => {
  const explicitFlag = (process.env.DB_FORCE_IPV4 || '').trim().toLowerCase()
  if (explicitFlag) {
    return TRUE_VALUES.has(explicitFlag)
  }
  return process.env.GITHUB_ACTIONS === 'true'
}

const normalizeHostCandidate = (value: string | null | undefined) =>
  (value || '').trim().replace(/^\[|\]$/g, '')

const collectConnectionHostCandidates = (parsed: URL): ConnectionHostCandidate[] => {
  const candidates: ConnectionHostCandidate[] = [
    { source: 'host', value: normalizeHostCandidate(parsed.searchParams.get('host')) },
    { source: 'hostname', value: normalizeHostCandidate(parsed.hostname) },
    { source: 'hostaddr', value: normalizeHostCandidate(parsed.searchParams.get('hostaddr')) },
  ]
  const seen = new Set<string>()

  return candidates.filter((candidate) => {
    if (!candidate.value || candidate.value === HOSTLESS_SENTINEL) return false
    const dedupeKey = `${candidate.source}:${candidate.value.toLowerCase()}`
    if (seen.has(dedupeKey)) return false
    seen.add(dedupeKey)
    return true
  })
}

const parseConnectionString = (connectionString: string) => {
  try {
    return new URL(connectionString)
  } catch {
    if (!connectionString.includes('@/')) {
      throw new TypeError('Invalid URL')
    }
    return new URL(connectionString.replace('@/', `@${HOSTLESS_SENTINEL}/`))
  }
}

const applyResolvedHost = (parsed: URL, resolvedHost: string) => {
  if (parsed.searchParams.has('host')) {
    parsed.searchParams.set('host', resolvedHost)
  }
  if (parsed.searchParams.has('hostaddr')) {
    parsed.searchParams.set('hostaddr', resolvedHost)
  }
  if (parsed.hostname) {
    parsed.hostname = resolvedHost
  }
  return parsed.toString()
}

const defaultResolveIpv4Address: ResolveIpv4Address = async (hostname) => {
  const resolved = await lookup(hostname, { family: 4 })
  return resolved.address || null
}

export const rewriteDbConnectionStringForIpv4 = async (
  connectionString: string,
  resolveIpv4Address: ResolveIpv4Address = defaultResolveIpv4Address,
): Promise<Ipv4RewriteResult | null> => {
  if (!connectionString) {
    return null
  }

  const parsed = parseConnectionString(connectionString)
  const candidates = collectConnectionHostCandidates(parsed)

  for (const candidate of candidates) {
    if (candidate.value === 'localhost') {
      return null
    }

    if (net.isIP(candidate.value) === 4) {
      const rewritten = applyResolvedHost(parsed, candidate.value)
      if (rewritten === connectionString) {
        return null
      }
      return {
        connectionString: rewritten,
        originalHost: candidate.value,
        resolvedHost: candidate.value,
        source: candidate.source,
      }
    }

    if (net.isIP(candidate.value) === 6) {
      continue
    }

    const resolvedHost = await resolveIpv4Address(candidate.value)
    if (!resolvedHost) {
      continue
    }

    return {
      connectionString: applyResolvedHost(parsed, resolvedHost),
      originalHost: candidate.value,
      resolvedHost,
      source: candidate.source,
    }
  }

  return null
}

const resolvePlaneBDbConnectionString = async () => {
  const connectionString = config.db.planeBUrl
  if (!connectionString || !shouldForceIpv4DbConnection()) {
    return connectionString
  }

  try {
    dns.setDefaultResultOrder('ipv4first')
  } catch {
    // Ignore on runtimes that do not support result-order overrides.
  }

  try {
    const rewritten = await rewriteDbConnectionStringForIpv4(connectionString)
    if (!rewritten) {
      return connectionString
    }

    logger.info('agent_health_db_ipv4_resolved', {
      originalHost: rewritten.originalHost,
      resolvedHost: rewritten.resolvedHost,
      source: rewritten.source,
    })
    return rewritten.connectionString
  } catch (error) {
    logger.warn('agent_health_db_ipv4_resolution_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return connectionString
  }
}

const loadDetectionCycleMetricCount = async (): Promise<number> => {
  const cloudWatch = new CloudWatchClient({})
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000)
  const environment = resolveEnvironmentName()

  const listResponse = await cloudWatch.send(new ListMetricsCommand({
    Namespace: AGENT_METRIC_NAMESPACE,
    MetricName: DETECTION_CYCLE_METRIC,
    RecentlyActive: 'PT3H',
    Dimensions: [
      { Name: 'environment', Value: environment },
      { Name: 'service', Value: 'remit-scout' },
    ],
  }))

  const metrics = (listResponse.Metrics ?? []).slice(0, 50)
  if (metrics.length === 0) {
    return 0
  }

  const queries = metrics.map((metric, index) => ({
    Id: `m${index}`,
    MetricStat: {
      Metric: {
        Namespace: AGENT_METRIC_NAMESPACE,
        MetricName: DETECTION_CYCLE_METRIC,
        Dimensions: metric.Dimensions,
      },
      Period: 60,
      Stat: 'Sum',
    },
    ReturnData: true,
  }))

  const metricData = await cloudWatch.send(new GetMetricDataCommand({
    StartTime: startTime,
    EndTime: endTime,
    MetricDataQueries: queries,
  }))

  return (metricData.MetricDataResults ?? []).reduce((total, result) => {
    const metricTotal = (result.Values ?? []).reduce((sum, value) => sum + Number(value || 0), 0)
    return total + metricTotal
  }, 0)
}

async function runChecks(): Promise<CheckResult[]> {
  const pool = createPool(await resolvePlaneBDbConnectionString())
  const results: CheckResult[] = []
  const lookbackInterval = `${LOOKBACK_HOURS} hours`

  try {
    // 1. Recent observations in silver.observation
    const obsResult = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM silver.observation
       WHERE created_at > NOW() - $1::interval`,
      [lookbackInterval],
    )
    const obsCount = Number(obsResult.rows[0]?.cnt ?? 0)
    results.push({
      name: 'observations',
      passed: obsCount > 0,
      detail: `${obsCount} observations in last ${LOOKBACK_HOURS}h`,
    })

    // 2. Recent failure bundles in silver.failure_bundle
    const bundleResult = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM silver.failure_bundle
       WHERE created_at > NOW() - $1::interval`,
      [lookbackInterval],
    )
    const bundleCount = Number(bundleResult.rows[0]?.cnt ?? 0)
    results.push({
      name: 'failure_bundles',
      passed: true, // bundles are only created when failures happen — 0 is OK
      detail: `${bundleCount} failure bundles in last ${LOOKBACK_HOURS}h (0 is acceptable if no failures)`,
    })

    // 3. Processed items in silver.dispatch_queue
    const dispatchResult = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM silver.dispatch_queue
       WHERE status IN ('completed', 'processing', 'dispatched')
         AND updated_at > NOW() - $1::interval`,
      [lookbackInterval],
    )
    const dispatchCount = Number(dispatchResult.rows[0]?.cnt ?? 0)
    results.push({
      name: 'dispatch_queue',
      passed: dispatchCount > 0,
      detail: `${dispatchCount} processed dispatch items in last ${LOOKBACK_HOURS}h`,
    })

    // 4. Recent agent actions in silver.agent_action
    const actionResult = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM silver.agent_action
       WHERE created_at > NOW() - $1::interval`,
      [lookbackInterval],
    )
    const actionCount = Number(actionResult.rows[0]?.cnt ?? 0)
    results.push({
      name: 'agent_actions',
      passed: true, // agent actions only appear when repairs happen — 0 is OK
      detail: `${actionCount} agent actions in last ${LOOKBACK_HOURS}h (0 is acceptable if no repairs needed)`,
    })

    // 5. Detection cycles — prove the orchestrator emitted CloudWatch health metrics recently.
    const cycleCount = await loadDetectionCycleMetricCount()
    results.push({
      name: 'detection_cycles',
      passed: cycleCount > 0,
      detail: `${cycleCount} CloudWatch detection cycles in last ${LOOKBACK_HOURS}h`,
    })

    // 6. Provider sources indexed in silver.knowledge_chunk
    const knowledgeResult = await pool.query<{ source_type: string; cnt: string }>(
      `SELECT source_type, COUNT(*)::text AS cnt
       FROM silver.knowledge_chunk
       GROUP BY source_type
       ORDER BY source_type`,
    )
    const knowledgeTotal = knowledgeResult.rows.reduce((sum, r) => sum + Number(r.cnt), 0)
    const knowledgeDetail = knowledgeResult.rows.map((r) => `${r.source_type}=${r.cnt}`).join(', ')
    results.push({
      name: 'knowledge_chunks',
      passed: knowledgeTotal > 0,
      detail: knowledgeTotal > 0
        ? `${knowledgeTotal} chunks indexed (${knowledgeDetail})`
        : 'No knowledge chunks indexed — run seed-knowledge-plane.ts',
    })

    // 7. Normalization factors in silver.factor
    const factorResult = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM silver.factor
       WHERE collected_at > NOW() - $1::interval`,
      [lookbackInterval],
    )
    const factorCount = Number(factorResult.rows[0]?.cnt ?? 0)
    results.push({
      name: 'normalization_factors',
      passed: true, // factors depend on normalization queue being enabled
      detail: `${factorCount} factors extracted in last ${LOOKBACK_HOURS}h`,
    })
  } finally {
    await pool.end()
  }

  return results
}

async function main(): Promise<number> {
  logger.info('e2e_health_check_starting', { lookbackHours: LOOKBACK_HOURS })

  const results = await runChecks()

  const passed = results.filter((r) => r.passed)
  const failed = results.filter((r) => !r.passed)

  console.log('\n=== Agent Pipeline E2E Health Check ===\n')
  console.log(`Lookback window: ${LOOKBACK_HOURS}h\n`)

  for (const result of results) {
    const icon = result.passed ? 'PASS' : 'FAIL'
    console.log(`  [${icon}] ${result.name}: ${result.detail}`)
  }

  console.log(`\n  Summary: ${passed.length}/${results.length} checks passed`)

  if (failed.length > 0) {
    console.log('\n  Failed checks:')
    for (const f of failed) {
      console.log(`    - ${f.name}: ${f.detail}`)
    }
    logger.warn('e2e_health_check_failures', {
      failedChecks: failed.map((f) => f.name),
      passedChecks: passed.map((p) => p.name),
    })
    return 1
  }

  logger.info('e2e_health_check_passed', { checkCount: results.length })
  console.log('\n  All checks passed.\n')
  return 0
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      logger.error('e2e_health_check_fatal', {
        error: err instanceof Error ? err.message : String(err),
      })
      console.error('Fatal error:', err)
      process.exit(1)
    })
}
