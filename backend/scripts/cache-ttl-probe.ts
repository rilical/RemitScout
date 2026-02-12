import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createPool } from '../shared/db'
import { VolatilityService } from '../plane-b/src/services/volatility-service'
import { initTracing } from '../shared/tracing'

const logger = createLogger('script.cache-ttl-probe')
initTracing('cache-ttl-probe')

const TEST_CORRIDORS = (
  process.env.CACHE_TTL_TEST_CORRIDORS ||
  'US-MX-USD-MXN,US-PH-USD-PHP,GB-IN-GBP-INR,US-CA-USD-CAD'
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const PROBE_TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS) || 60000

const main = async () => {
  const pool = createPool(config.db.planeBUrl)
  const volatilityService = new VolatilityService(pool)

  let passed = 0
  let failed = 0
  const results: Array<{
    corridor: string
    status: 'pass' | 'fail'
    tier?: string
    ttlSeconds?: number
    error?: string
  }> = []

  logger.info('probe_start', { test_corridors: TEST_CORRIDORS.length })

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Probe timeout')), PROBE_TIMEOUT_MS)
  })

  try {
    await Promise.race([
      (async () => {
        for (const corridorId of TEST_CORRIDORS) {
          try {
            const ttlResult = await volatilityService.getCacheTtlForCorridor(corridorId)

            if (!ttlResult.hasData) {
              logger.warn('probe_no_data', {
                corridor_id: corridorId,
                default_tier: ttlResult.tier,
              })
            }

            const isValidTtl = [30 * 60, 60 * 60, 2 * 60 * 60, 4 * 60 * 60].includes(ttlResult.ttlSeconds)
            const isValidTier = ['tier1', 'tier2', 'tier3'].includes(ttlResult.tier)

            if (!isValidTtl || !isValidTier) {
              failed++
              results.push({
                corridor: corridorId,
                status: 'fail',
                error: `Invalid TTL (${ttlResult.ttlSeconds}) or tier (${ttlResult.tier})`,
              })
              logger.error('probe_fail', {
                corridor_id: corridorId,
                ttl_seconds: ttlResult.ttlSeconds,
                tier: ttlResult.tier,
              })
              continue
            }

            passed++
            results.push({
              corridor: corridorId,
              status: 'pass',
              tier: ttlResult.tier,
              ttlSeconds: ttlResult.ttlSeconds,
            })
            logger.info('probe_pass', {
              corridor_id: corridorId,
              tier: ttlResult.tier,
              ttl_seconds: ttlResult.ttlSeconds,
              volatility_score: ttlResult.volatilityScore,
            })
          } catch (error) {
            failed++
            results.push({
              corridor: corridorId,
              status: 'fail',
              error: (error as Error).message,
            })
            logger.error('probe_error', {
              corridor_id: corridorId,
              error: error as Error,
            })
          }
        }
      })(),
      timeoutPromise,
    ])
  } catch (error) {
    logger.error('probe_timeout_or_crash', { error })
    await pool.end()
    process.exit(1)
  } finally {
    await pool.end()
  }

  const summary = {
    success: failed === 0,
    total: TEST_CORRIDORS.length,
    passed,
    failed,
    results,
  }

  logger.info('probe_summary', summary)

  if (process.env.PROBE_OUTPUT_FORMAT !== 'text') {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    console.log(`Cache TTL Probe: ${summary.success ? 'PASSED' : 'FAILED'}`)
    console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`)
    if (summary.failed > 0) {
      console.log('Failed corridors:')
      summary.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`  - ${r.corridor}: ${r.error}`))
    }
  }

  if (failed > 0) {
    logger.error('probe_failed', { failed_count: failed })
    process.exit(1)
  }

  logger.info('probe_success', { passed_count: passed })
  process.exit(0)
}

let shutdownRequested = false
const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
  process.exit(1)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

main().catch((error) => {
  logger.error('probe_crash', { error })
  process.exit(1)
})
