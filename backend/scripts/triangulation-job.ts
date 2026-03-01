/**
 * Triangulation Job — scheduled task that runs triangulation and stress detection.
 *
 * Usage:
 *   npx tsx scripts/triangulation-job.ts
 *
 * Environment:
 *   DATABASE_URL_PLANE_B — Plane B database connection
 *   TRIANGULATION_ENABLED — must be 'true' to run (default: false)
 *   TRIANGULATION_AMOUNT_BUCKETS — comma-separated list (default: 500)
 *   TRIANGULATION_METHOD_PROFILE — method profile (default: bank_transfer:bank_deposit)
 *   STRESS_DETECTION_ENABLED — run stress detection after triangulation (default: false)
 */
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initErrorTracking } from '../shared/error-tracker'
import { TriangulationEngine } from '../plane-b/src/triangulation/engine'
import { StressEventsPipeline } from '../plane-b/src/triangulation/stress-events'

const logger = createLogger('scripts.triangulation-job')

async function main() {
  initErrorTracking()

  const enabled = process.env.TRIANGULATION_ENABLED === 'true'
  if (!enabled) {
    logger.info('triangulation_disabled')
    process.exit(0)
  }

  const pool = createPool(config.db.planeBUrl)
  const startedAt = Date.now()

  try {
    // Run triangulation
    const engine = new TriangulationEngine(pool)
    const amountBuckets = (process.env.TRIANGULATION_AMOUNT_BUCKETS ?? '500')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter(Number.isFinite)

    const methodProfile = process.env.TRIANGULATION_METHOD_PROFILE ?? 'bank_transfer:bank_deposit'

    logger.info('triangulation_starting', { amountBuckets, methodProfile })

    const results = await engine.triangulate({ amountBuckets, methodProfile })

    logger.info('triangulation_complete', {
      results: results.length,
      durationMs: Date.now() - startedAt,
    })

    // Run stress detection if enabled
    if (process.env.STRESS_DETECTION_ENABLED === 'true') {
      const pipeline = new StressEventsPipeline(pool)
      const events = await pipeline.runCycle()

      logger.info('stress_detection_complete', {
        events: events.length,
        durationMs: Date.now() - startedAt,
      })
    }
  } catch (err) {
    logger.error('triangulation_job_failed', {
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startedAt,
    })
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
