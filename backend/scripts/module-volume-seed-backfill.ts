import fs from 'node:fs'
import path from 'node:path'

import type { Pool } from 'pg'

import { createPool, query } from '../shared/db'
import { createLogger } from '../shared/logger'
import { type ModuleVolumePolicy } from '../shared/module-catalog'
import { loadProviderCatalog } from '../shared/provider-catalog'
import {
  clearProviderVolumePolicyCatalogCache,
  getDefaultProviderVolumePolicy,
  getProviderVolumePolicyPath,
  type ProviderVolumePolicyCatalog,
} from '../shared/provider-volume-policy'
import { GLOBAL_WEIGHT_CORRIDOR_ID } from '../shared/weighting-model'
import { config } from '../shared/config'

const logger = createLogger('script.module-volume-seed-backfill')

type SnapshotRow = {
  provider_id: string
  weight: number
  weight_confidence: number | null
}

type ProviderVolumeCatalogFile = ProviderVolumePolicyCatalog & {
  $schema?: string
}

const parseBool = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return fallback
}

const clamp01 = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, Math.min(1, value))
}

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const loadCatalog = (catalogPath: string): ProviderVolumeCatalogFile => {
  if (!fs.existsSync(catalogPath)) {
    return {
      $schema: '../schema/provider-volume-policy.schema.json',
      version: 1,
      description: 'Provider-scoped volume weighting policy catalog.',
      default_policy: getDefaultProviderVolumePolicy(),
      providers: [],
    }
  }

  clearProviderVolumePolicyCatalogCache()
  const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as ProviderVolumeCatalogFile
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.providers)) {
    throw new Error(`invalid provider volume policy catalog: ${catalogPath}`)
  }
  return raw
}

const latestSnapshotQuery = `
SELECT DISTINCT ON (lower(provider_id))
  lower(provider_id) AS provider_id,
  weight::double precision AS weight,
  weight_confidence::double precision AS weight_confidence
FROM gold.provider_weight_snapshot
WHERE corridor_id = $1
  AND model_version = $2
  AND method_profile = $3::method_profile
ORDER BY lower(provider_id), computed_at DESC
`

const buildSourceMap = (rows: SnapshotRow[]) => {
  const byProvider = new Map<string, { weight: number; confidence: number }>()
  for (const row of rows) {
    const providerId = String(row.provider_id || '').trim().toLowerCase()
    if (!providerId) continue
    byProvider.set(providerId, {
      weight: clamp01(Number(row.weight), 0),
      confidence: clamp01(Number(row.weight_confidence), 0.7),
    })
  }
  return byProvider
}

const buildProviderPolicy = (input: {
  existing?: ModuleVolumePolicy
  source?: { weight: number; confidence: number }
  defaultEqualWeight: number
  sourceModelVersion: string
  sourceMethodProfile: string
  targetModelVersion: string
}) => {
  const base = input.existing ?? getDefaultProviderVolumePolicy()
  const source = input.source
  const fromSnapshot = source != null
  const defaultWeight = fromSnapshot
    ? clamp01(source.weight, input.defaultEqualWeight)
    : input.defaultEqualWeight
  const defaultConfidence = fromSnapshot
    ? clamp01(source.confidence, 0.7)
    : clamp01(Number(base.synthetic_seed.default_confidence), 0.7)

  return {
    strategy: 'synthetic_seed',
    model_version: input.targetModelVersion,
    fallback_chain: [...base.fallback_chain],
    synthetic_seed: {
      default_weight: defaultWeight,
      default_confidence: defaultConfidence,
      source_note: fromSnapshot
        ? `backfill:${input.sourceModelVersion}:${input.sourceMethodProfile}:global_default`
        : `backfill:${input.sourceModelVersion}:${input.sourceMethodProfile}:equal_default`,
      // Keep explicit provider overrides only when they already exist; do not synthesize
      // method-profile-specific corridor weights into a provider-scoped bootstrap catalog.
      corridor_overrides: [...(input.existing?.synthetic_seed.corridor_overrides ?? [])],
    },
    reported: { ...base.reported },
    inferred_proxy: { ...base.inferred_proxy },
  } satisfies ModuleVolumePolicy
}

const updateCatalog = (
  catalog: ProviderVolumeCatalogFile,
  sourceMap: ReturnType<typeof buildSourceMap>,
  options: {
    sourceModelVersion: string
    sourceMethodProfile: string
    targetModelVersion: string
  },
) => {
  const providerIds = new Set(loadProviderCatalog().providers.map((entry) => entry.provider_id))
  for (const providerId of sourceMap.keys()) providerIds.add(providerId)
  for (const entry of catalog.providers) providerIds.add(entry.provider_id)

  const sortedProviderIds = [...providerIds].sort((a, b) => a.localeCompare(b))
  const existingByProvider = new Map(
    catalog.providers.map((entry) => [entry.provider_id, entry.volume] as const),
  )
  const defaultEqualWeight = sortedProviderIds.length > 0 ? 1 / sortedProviderIds.length : 1

  const providers = sortedProviderIds.map((providerId) => ({
    provider_id: providerId,
    volume: buildProviderPolicy({
      existing: existingByProvider.get(providerId),
      source: sourceMap.get(providerId),
      defaultEqualWeight,
      sourceModelVersion: options.sourceModelVersion,
      sourceMethodProfile: options.sourceMethodProfile,
      targetModelVersion: options.targetModelVersion,
    }),
  }))

  return {
    nextCatalog: {
      ...catalog,
      providers,
    },
    summary: {
      providersUpdated: providers.length,
      sourcedFromSnapshot: providers.filter((entry) => sourceMap.has(entry.provider_id)).length,
    },
  }
}

const validatePolicies = (catalog: ProviderVolumeCatalogFile) => {
  const providerIds = new Set<string>()

  const validatePolicy = (label: string, policy: ModuleVolumePolicy | undefined) => {
    if (!policy) return

    const weight = Number(policy.synthetic_seed.default_weight)
    const confidence = Number(policy.synthetic_seed.default_confidence)
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
      throw new Error(`${label}:invalid_default_weight`)
    }
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error(`${label}:invalid_default_confidence`)
    }
  }

  validatePolicy('default_policy', catalog.default_policy)

  for (const entry of catalog.providers) {
    const providerId = String(entry.provider_id || '').trim().toLowerCase()
    if (!providerId) {
      throw new Error('provider_volume_policy:missing_provider_id')
    }
    if (providerIds.has(providerId)) {
      throw new Error(`provider_volume_policy:duplicate_provider_id:${providerId}`)
    }
    providerIds.add(providerId)
    validatePolicy(`provider:${providerId}`, entry.volume)
  }
}

const run = async (): Promise<void> => {
  const sourceModelVersion = String(process.env.SYNTHETIC_SEED_SOURCE_MODEL || 'synthetic_volume_v1').trim()
  const sourceMethodProfile = String(process.env.SYNTHETIC_SEED_METHOD_PROFILE || 'standard_bank').trim()
  const targetModelVersion = String(process.env.SYNTHETIC_SEED_TARGET_MODEL || 'synthetic_seed_v1').trim()
  const write = parseBool(process.env.SYNTHETIC_SEED_BACKFILL_WRITE, false) || process.argv.includes('--write')

  const catalogPath = getProviderVolumePolicyPath()
  const pool = createPool(config.db.planeCUrl)
  let closed = false
  const closePool = async () => {
    if (closed) return
    closed = true
    await pool.end()
  }

  try {
    logger.info('backfill_start', {
      source_model_version: sourceModelVersion,
      source_method_profile: sourceMethodProfile,
      target_model_version: targetModelVersion,
      write,
      catalog_path: path.relative(process.cwd(), catalogPath),
    })

    const snapshot = await query<SnapshotRow>(
      latestSnapshotQuery,
      [GLOBAL_WEIGHT_CORRIDOR_ID, sourceModelVersion, sourceMethodProfile],
      pool as Pool,
    )

    const catalog = loadCatalog(catalogPath)
    const sourceMap = buildSourceMap(snapshot.rows)
    const { nextCatalog, summary } = updateCatalog(catalog, sourceMap, {
      sourceModelVersion,
      sourceMethodProfile,
      targetModelVersion,
    })

    validatePolicies(nextCatalog)

    if (write) {
      fs.writeFileSync(catalogPath, `${JSON.stringify(nextCatalog, null, 2)}\n`)
      clearProviderVolumePolicyCatalogCache()
    }

    logger.info('backfill_complete', {
      source_rows: snapshot.rows.length,
      providers_updated: summary.providersUpdated,
      providers_sourced_from_snapshot: summary.sourcedFromSnapshot,
      wrote_file: write,
      catalog_path: path.relative(process.cwd(), catalogPath),
    })
  } finally {
    await closePool()
  }
}

if (require.main === module) {
  run().catch((error) => {
    logger.error('backfill_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    process.exitCode = 1
  })
}
