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
const lifecycleEvent = process.env.npm_lifecycle_event

const loadActiveCapabilitySeedProviders = async (
  db: ReturnType<typeof createPool>,
): Promise<string[]> => {
  const result = await db.query<{ provider_id: string }>(
    `SELECT provider_id
       FROM silver.rights_matrix
      WHERE allowed_collect = true
        AND allowed_b2c = true
        AND stoplist_status = 'active'
        AND status = 'production'
      ORDER BY provider_id`,
  )

  return result.rows
    .map((row) => row.provider_id?.trim().toLowerCase())
    .filter((providerId): providerId is string => Boolean(providerId))
}

const runDbSeedBootstrap = async (
  db: ReturnType<typeof createPool>,
): Promise<void> => {
  const originalStrictCountrySync = process.env.STRICT_COUNTRY_SYNC
  const originalCapabilitySeedScope = process.env.CAPABILITY_SEED_SCOPE
  const originalCapabilitySeedProviders = process.env.CAPABILITY_SEED_PROVIDERS
  const activeCapabilityProviders = await loadActiveCapabilitySeedProviders(db)

  if (activeCapabilityProviders.length === 0) {
    throw new Error('db_seed_bootstrap_failed: no active capability seed providers found')
  }

  process.env.STRICT_COUNTRY_SYNC = originalStrictCountrySync || '1'
  process.env.CAPABILITY_SEED_SCOPE = originalCapabilitySeedScope || 'all'
  process.env.CAPABILITY_SEED_PROVIDERS = originalCapabilitySeedProviders || activeCapabilityProviders.join(',')

  try {
    logger.info('db_seed_bootstrap_started', {
      strict_country_sync: process.env.STRICT_COUNTRY_SYNC,
      capability_seed_scope: process.env.CAPABILITY_SEED_SCOPE,
      capability_seed_provider_count: activeCapabilityProviders.length,
    })

    const [{ runRightsMatrixSyncCountries }, { runProviderCapabilityMacroSeed }] = await Promise.all([
      import('./rights-matrix-sync-countries'),
      import('./provider-capability-macro-seed'),
    ])

    await runRightsMatrixSyncCountries()
    await runProviderCapabilityMacroSeed()

    logger.info('db_seed_bootstrap_complete')
  } finally {
    if (originalStrictCountrySync === undefined) {
      delete process.env.STRICT_COUNTRY_SYNC
    } else {
      process.env.STRICT_COUNTRY_SYNC = originalStrictCountrySync
    }

    if (originalCapabilitySeedScope === undefined) {
      delete process.env.CAPABILITY_SEED_SCOPE
    } else {
      process.env.CAPABILITY_SEED_SCOPE = originalCapabilitySeedScope
    }

    if (originalCapabilitySeedProviders === undefined) {
      delete process.env.CAPABILITY_SEED_PROVIDERS
    } else {
      process.env.CAPABILITY_SEED_PROVIDERS = originalCapabilitySeedProviders
    }
  }
}

const run = async (): Promise<void> => {
  if (config.planeB.useSeedData) {
    throw new Error(
      'Seed data mode is no longer available. Set PLANE_B_USE_SEED_DATA=false to run ingestion.',
    )
  }

  const db = createPool(config.db.planeBUrl)
  try {
    await runIngestion({ pool: db })
    if (lifecycleEvent === 'db:seed') {
      await runDbSeedBootstrap(db)
    }
    logger.info('ingest_complete')
  } finally {
    await db.end()
  }
}

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
