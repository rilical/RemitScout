/**
 * Rights matrix dev bootstrap (dev-only utility)
 *
 * The B2B sweep scheduler filters eligible providers using `silver.rights_matrix`.
 * If rights rows are missing (or `allowed_collect/allowed_b2b` are false), the scheduler
 * can legitimately build zero tasks even when capability coverage exists.
 *
 * This script upserts a minimal, explicit allow set for dev so Tier-2 canary sweeps are
 * deterministic. It intentionally does not set country support; run
 * `scripts/rights-matrix-sync-countries.ts` after this to populate country lists.
 */

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import { providerRegistry } from '../plane-b/src/providers'

initTracing('rights-matrix-dev-bootstrap')
initErrorTracking('rights-matrix-dev-bootstrap')

const logger = createLogger('script.rights-matrix-dev-bootstrap')

const splitList = (value: string | undefined): string[] => {
  return (value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  const normalized = value.trim().toLowerCase()
  if (!normalized) return fallback
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'y'
}

type ExistingRightsRow = {
  provider_id: string
  allowed_b2c: boolean | null
}

export const runRightsMatrixDevBootstrap = async (): Promise<void> => {
  const envName = (config.envName || config.env || '').toLowerCase()
  if (envName !== 'dev' && envName !== 'development') {
    if (process.env.RIGHTS_BOOTSTRAP_ALLOW_NON_DEV !== '1') {
      throw new Error(
        `Refusing to run rights-matrix bootstrap outside dev (env=${envName}). Set RIGHTS_BOOTSTRAP_ALLOW_NON_DEV=1 to override.`,
      )
    }
  }

  const providers = splitList(process.env.RIGHTS_BOOTSTRAP_PROVIDERS)
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
  const resolvedProviders = providers.length
    ? providers
    : providerRegistry.map(p => p.providerId)

  const defaultAllowedB2c = toBoolean(process.env.RIGHTS_BOOTSTRAP_DEFAULT_ALLOWED_B2C, true)
  const note = (process.env.RIGHTS_BOOTSTRAP_NOTE || 'dev bootstrap').trim()

  const pool = createPool(config.db.planeBUrl)
  try {
    const existing = await query<ExistingRightsRow>(
      `SELECT provider_id, allowed_b2c
         FROM silver.rights_matrix
        WHERE provider_id = ANY($1::text[])`,
      [resolvedProviders],
      pool,
    )
    const allowedB2cByProvider = new Map<string, boolean>()
    for (const row of existing.rows) {
      if (!row.provider_id) continue
      if (row.allowed_b2c === null || row.allowed_b2c === undefined) continue
      allowedB2cByProvider.set(String(row.provider_id).toLowerCase(), Boolean(row.allowed_b2c))
    }

    const providerIds: string[] = []
    const allowedCollect: boolean[] = []
    const allowedB2c: boolean[] = []
    const allowedB2b: boolean[] = []
    const notes: string[] = []

    for (const providerId of resolvedProviders) {
      providerIds.push(providerId)
      allowedCollect.push(true)
      allowedB2b.push(true)
      allowedB2c.push(allowedB2cByProvider.get(providerId) ?? defaultAllowedB2c)
      notes.push(note)
    }

    await query(
      `INSERT INTO silver.rights_matrix (provider_id, allowed_collect, allowed_b2c, allowed_b2b, notes)
       SELECT * FROM UNNEST(
         $1::text[],
         $2::boolean[],
         $3::boolean[],
         $4::boolean[],
         $5::text[]
       )
       ON CONFLICT (provider_id) DO UPDATE SET
         allowed_collect = EXCLUDED.allowed_collect,
         allowed_b2c = EXCLUDED.allowed_b2c,
         allowed_b2b = EXCLUDED.allowed_b2b,
         notes = EXCLUDED.notes,
         updated_at = NOW()`,
      [providerIds, allowedCollect, allowedB2c, allowedB2b, notes],
      pool,
    )

    logger.info('rights_bootstrap_complete', {
      providers: providerIds.length,
      default_allowed_b2c: defaultAllowedB2c,
      note,
    })
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  runRightsMatrixDevBootstrap().catch((error) => {
    logger.error('rights_bootstrap_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  })
}

