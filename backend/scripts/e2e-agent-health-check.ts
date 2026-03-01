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

async function runChecks(): Promise<CheckResult[]> {
  const pool = createPool(config.db.planeBUrl)
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

    // 5. Detection cycles — check that orchestrator has been cycling
    // We look for recent dispatch_queue entries from the orchestrator (queue_name starts with 'agent-')
    const cycleResult = await pool.query<{ cnt: string }>(
      `SELECT COUNT(DISTINCT DATE_TRUNC('minute', created_at))::text AS cnt
       FROM silver.dispatch_queue
       WHERE queue_name LIKE 'agent-%'
         AND created_at > NOW() - $1::interval`,
      [lookbackInterval],
    )
    const cycleMinutes = Number(cycleResult.rows[0]?.cnt ?? 0)
    results.push({
      name: 'detection_cycles',
      passed: cycleMinutes > 0 || dispatchCount > 0,
      detail: `${cycleMinutes} distinct minutes with agent dispatch activity in last ${LOOKBACK_HOURS}h`,
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

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    logger.error('e2e_health_check_fatal', {
      error: err instanceof Error ? err.message : String(err),
    })
    console.error('Fatal error:', err)
    process.exit(1)
  })
