import fs from 'node:fs'
import path from 'node:path'

import type { Pool } from 'pg'

import { createPool, query } from '../shared/db'
import { createLogger } from '../shared/logger'
import { getModuleCatalogPath } from '../shared/module-catalog'
import { GLOBAL_WEIGHT_CORRIDOR_ID } from '../shared/weighting-model'
import { config } from '../shared/config'

const logger = createLogger('script.module-volume-seed-backfill')

type SnapshotRow = {
  corridor_id: string
  provider_id: string
  weight: number
  weight_confidence: number | null
}

type ModuleCatalogFile = {
  $schema?: string
  version: number
  description?: string
  modules: Array<{
    module_id: string
    provider_id: string
    collector_type: string
    status: string
    spec_version: number
    volume?: any
  }>
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

const loadCatalog = (catalogPath: string): ModuleCatalogFile => {
  const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as ModuleCatalogFile
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.modules)) {
    throw new Error(`invalid module catalog: ${catalogPath}`)
  }
  return raw
}

const latestSnapshotQuery = `
SELECT DISTINCT ON (corridor_id, lower(provider_id))
  corridor_id,
  lower(provider_id) AS provider_id,
  weight::double precision AS weight,
  weight_confidence::double precision AS weight_confidence
FROM gold.provider_weight_snapshot
WHERE model_version = $1
ORDER BY corridor_id, lower(provider_id), computed_at DESC
`

const buildSourceMaps = (rows: SnapshotRow[]) => {
  const globalByProvider = new Map<string, { weight: number; confidence: number }>()
  const corridorByProvider = new Map<string, Array<{
    corridor_id: string
    weight: number
    confidence: number
  }>>()

  for (const row of rows) {
    const providerId = String(row.provider_id || '').trim().toLowerCase()
    if (!providerId) continue
    const weight = clamp01(Number(row.weight), 0)
    const confidence = clamp01(Number(row.weight_confidence), 0.7)
    if (row.corridor_id === GLOBAL_WEIGHT_CORRIDOR_ID) {
      globalByProvider.set(providerId, { weight, confidence })
      continue
    }
    const entries = corridorByProvider.get(providerId) ?? []
    entries.push({
      corridor_id: row.corridor_id,
      weight,
      confidence,
    })
    corridorByProvider.set(providerId, entries)
  }

  for (const [providerId, entries] of corridorByProvider.entries()) {
    entries.sort((a, b) => a.corridor_id.localeCompare(b.corridor_id))
    corridorByProvider.set(providerId, entries)
  }

  return {
    globalByProvider,
    corridorByProvider,
  }
}

const updateCatalog = (
  catalog: ModuleCatalogFile,
  maps: ReturnType<typeof buildSourceMaps>,
  options: {
    sourceModelVersion: string
    targetModelVersion: string
    overrideThreshold: number
  },
) => {
  const productionModules = catalog.modules.filter((module) => module.status === 'production')
  const defaultUniform = productionModules.length > 0 ? 1 / productionModules.length : 1
  let modulesUpdated = 0
  let overridesAdded = 0

  for (const module of catalog.modules) {
    const providerId = String(module.provider_id || '').trim().toLowerCase()
    if (!providerId) continue

    const sourceGlobal = maps.globalByProvider.get(providerId)
    const existingSeed = module.volume?.synthetic_seed || {}
    const defaultWeight = clamp01(
      Number(sourceGlobal?.weight ?? existingSeed.default_weight),
      defaultUniform,
    )
    const defaultConfidence = clamp01(
      Number(sourceGlobal?.confidence ?? existingSeed.default_confidence),
      0.7,
    )

    const providerCorridors = maps.corridorByProvider.get(providerId) ?? []
    const corridorOverrides = providerCorridors
      .filter((entry) => Math.abs(entry.weight - defaultWeight) >= options.overrideThreshold)
      .map((entry) => ({
        corridor_id: entry.corridor_id,
        weight: entry.weight,
        confidence: entry.confidence,
        source_note: `backfill:${options.sourceModelVersion}:corridor_override`,
      }))

    overridesAdded += corridorOverrides.length

    module.volume = {
      strategy: 'synthetic_seed',
      model_version: options.targetModelVersion,
      fallback_chain: ['reported', 'inferred_proxy', 'synthetic_seed', 'equal_weight'],
      synthetic_seed: {
        default_weight: defaultWeight,
        default_confidence: defaultConfidence,
        source_note: `backfill:${options.sourceModelVersion}:global_default`,
        corridor_overrides: corridorOverrides,
      },
      reported: {
        enabled: false,
        source_ref: null,
        freshness_slo_hours: 24,
      },
      inferred_proxy: {
        enabled: false,
        factor_name: 'volume_proxy',
        lookback_days: 30,
      },
    }

    modulesUpdated += 1
  }

  return {
    modulesUpdated,
    overridesAdded,
  }
}

const validateProductionSeeds = (catalog: ModuleCatalogFile) => {
  const missing: string[] = []
  for (const module of catalog.modules) {
    if (module.status !== 'production') continue
    const weight = Number(module.volume?.synthetic_seed?.default_weight)
    const confidence = Number(module.volume?.synthetic_seed?.default_confidence)
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
      missing.push(`${module.module_id}:invalid_default_weight`)
    }
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      missing.push(`${module.module_id}:invalid_default_confidence`)
    }
  }
  if (missing.length > 0) {
    throw new Error(`production seed validation failed: ${missing.join(', ')}`)
  }
}

const run = async (): Promise<void> => {
  const sourceModelVersion = String(process.env.SYNTHETIC_SEED_SOURCE_MODEL || 'synthetic_volume_v1').trim()
  const targetModelVersion = String(process.env.SYNTHETIC_SEED_TARGET_MODEL || 'synthetic_seed_v1').trim()
  const overrideThreshold = Math.max(0, toNumber(process.env.SYNTHETIC_SEED_OVERRIDE_THRESHOLD, 0.0001))
  const write = parseBool(process.env.SYNTHETIC_SEED_BACKFILL_WRITE, false) || process.argv.includes('--write')

  const catalogPath = getModuleCatalogPath()
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
      target_model_version: targetModelVersion,
      override_threshold: overrideThreshold,
      write,
      catalog_path: path.relative(process.cwd(), catalogPath),
    })

    const snapshot = await query<SnapshotRow>(latestSnapshotQuery, [sourceModelVersion], pool as Pool)
    if (snapshot.rows.length === 0) {
      throw new Error(`no provider weights found for model_version='${sourceModelVersion}'`)
    }

    const catalog = loadCatalog(catalogPath)
    const maps = buildSourceMaps(snapshot.rows)
    const summary = updateCatalog(catalog, maps, {
      sourceModelVersion,
      targetModelVersion,
      overrideThreshold,
    })

    validateProductionSeeds(catalog)

    if (write) {
      fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)
    }

    logger.info('backfill_complete', {
      source_rows: snapshot.rows.length,
      modules_updated: summary.modulesUpdated,
      overrides_added: summary.overridesAdded,
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
