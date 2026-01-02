/**
 * Ingestion runner for Plane B.
 *
 * This replaces the legacy db-seed script. Seed data mode is no longer supported.
 */
import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { runIngestion } from '../plane-b/src/ingest'

const logger = createLogger('script.ingest-run')

const run = async (): Promise<void> => {
  if (config.planeB.useSeedData) {
    throw new Error(
      'Seed data mode is no longer available. Set PLANE_B_USE_SEED_DATA=false to run ingestion.',
    )
  }

  const db = createPool(config.db.planeBUrl)
  try {
    await runIngestion({ pool: db })
    logger.info('ingest_complete')
  } finally {
    await db.end()
  }
}

const lifecycleEvent = process.env.npm_lifecycle_event
if (lifecycleEvent === 'db:seed') {
  logger.warn('db_seed_deprecated', { message: 'Use ingest:run instead of db:seed.' })
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    logger.error('ingest_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  process.exit(1)
  })
