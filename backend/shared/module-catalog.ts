import fs from 'node:fs'
import path from 'node:path'

import moduleCatalogJson from '../../.remit-scout/modules/catalog.json'
import type { ProviderId } from './provider-catalog'
import type {
  ModuleOwnerKind,
  ModuleRolloutState,
  ModuleSignalLayer,
} from './types/module-spec'

export type ModuleVolumeStrategy =
  | 'synthetic_seed'
  | 'reported'
  | 'inferred_proxy'
  | 'equal_weight'

export type ModuleVolumeModelVersion =
  | 'synthetic_seed_v1'
  | 'reported_v1'
  | 'inferred_proxy_v1'
  | 'equal_weight_v1'
  | string

export type ModuleVolumeCorridorOverride = {
  corridor_id: string
  weight: number
  confidence: number
  source_note: string
}

export type ModuleSyntheticSeedPolicy = {
  default_weight: number
  default_confidence: number
  source_note: string
  corridor_overrides: ModuleVolumeCorridorOverride[]
}

export type ModuleReportedPolicy = {
  enabled: boolean
  source_ref: string | null
  freshness_slo_hours: number
}

export type ModuleInferredProxyPolicy = {
  enabled: boolean
  factor_name: string
  lookback_days: number
}

export type ModuleVolumePolicy = {
  strategy: ModuleVolumeStrategy
  model_version: ModuleVolumeModelVersion
  fallback_chain: ModuleVolumeStrategy[]
  synthetic_seed: ModuleSyntheticSeedPolicy
  reported: ModuleReportedPolicy
  inferred_proxy: ModuleInferredProxyPolicy
}

export type ModuleCatalogEntry = {
  module_id: string
  owner_kind: ModuleOwnerKind
  owner_id: string
  provider_id: ProviderId
  collector_type: string
  display_name: string
  status: 'candidate' | 'sandbox' | 'beta' | 'production' | 'deprecated' | 'quarantined'
  signal_layer: ModuleSignalLayer
  capture_method: string
  rollout_state: ModuleRolloutState
  spec_version: number
  schema_version: number
  supported_corridors: string[]
  supported_amount_buckets: number[]
  payin_method: string | null
  payout_method: string | null
  policy_flags: {
    auto_heal_enabled: boolean
    emit_observations: boolean
    include_in_gold: boolean
  }
  lineage: {
    schema_ref: string | null
    source_ref: string | null
  }
  volume?: ModuleVolumePolicy
}

export type ModuleCatalog = {
  version: number
  description?: string
  modules: ModuleCatalogEntry[]
}

const MODULE_CATALOG_PATH_SEGMENTS = path.join('.remit-scout', 'modules', 'catalog.json')
const ALL_STRATEGIES: ModuleVolumeStrategy[] = [
  'synthetic_seed',
  'reported',
  'inferred_proxy',
  'equal_weight',
]

const DEFAULT_CAPTURE_METHOD = 'http'
const DEFAULT_ROLLOUT_STATE: ModuleRolloutState = 'enabled'

const clamp01 = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, Math.min(1, value))
}

const asString = (value: unknown, fallback: string): string => {
  const out = String(value ?? '').trim()
  return out || fallback
}

const asInteger = (value: unknown, fallback: number): number => {
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? n : fallback
}

const asStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  const out = String(value).trim()
  return out || null
}

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
}

const asNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry))
}

const isModuleVolumeStrategy = (value: string): value is ModuleVolumeStrategy => {
  return ALL_STRATEGIES.includes(value as ModuleVolumeStrategy)
}

const locateCatalogRoot = (startDir: string): string | null => {
  let dir = startDir
  for (let i = 0; i < 12; i += 1) {
    const candidate = path.join(dir, MODULE_CATALOG_PATH_SEGMENTS)
    if (fs.existsSync(candidate)) {
      return dir
    }

    const parent = path.dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }

  return null
}

const getRepoRoot = (): string => {
  const override = String(process.env.REMIT_SCOUT_REPO_ROOT || '').trim()
  if (override) return override

  const cwdRoot = locateCatalogRoot(process.cwd())
  if (cwdRoot) return cwdRoot

  const sourceRoot = locateCatalogRoot(__dirname)
  if (sourceRoot) return sourceRoot

  return process.cwd()
}

export const getModuleCatalogPath = (): string => {
  const override = String(process.env.MODULE_CATALOG_PATH || '').trim()
  if (override) {
    return path.isAbsolute(override) ? override : path.join(getRepoRoot(), override)
  }
  return path.join(getRepoRoot(), '.remit-scout', 'modules', 'catalog.json')
}

export const defaultModuleVolumePolicy = (): ModuleVolumePolicy => ({
  strategy: 'synthetic_seed',
  model_version: 'synthetic_seed_v1',
  fallback_chain: [...ALL_STRATEGIES],
  synthetic_seed: {
    default_weight: 0,
    default_confidence: 0.5,
    source_note: 'default',
    corridor_overrides: [],
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
})

const parseFallbackChain = (value: unknown): ModuleVolumeStrategy[] => {
  if (!Array.isArray(value)) return [...ALL_STRATEGIES]
  const ordered = value
    .map((entry) => String(entry || '').trim())
    .filter((entry): entry is ModuleVolumeStrategy => isModuleVolumeStrategy(entry))
  if (ordered.length === 0) return [...ALL_STRATEGIES]
  return Array.from(new Set(ordered))
}

export const parseModuleVolumePolicy = (raw: unknown): ModuleVolumePolicy => {
  const base = defaultModuleVolumePolicy()
  if (!raw || typeof raw !== 'object') return base
  const value = raw as Record<string, unknown>

  const strategyRaw = asString(value.strategy, base.strategy)
  const strategy = isModuleVolumeStrategy(strategyRaw) ? strategyRaw : base.strategy

  const syntheticSeedRaw = (value.synthetic_seed && typeof value.synthetic_seed === 'object')
    ? value.synthetic_seed as Record<string, unknown>
    : {}

  const corridorOverrides = Array.isArray(syntheticSeedRaw.corridor_overrides)
    ? syntheticSeedRaw.corridor_overrides
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null
        const item = entry as Record<string, unknown>
        const corridorId = asString(item.corridor_id, '')
        if (!corridorId) return null
        return {
          corridor_id: corridorId,
          weight: clamp01(Number(item.weight), 0),
          confidence: clamp01(Number(item.confidence), 0.5),
          source_note: asString(item.source_note, 'catalog_override'),
        } satisfies ModuleVolumeCorridorOverride
      })
      .filter((entry): entry is ModuleVolumeCorridorOverride => entry !== null)
    : []

  const reportedRaw = (value.reported && typeof value.reported === 'object')
    ? value.reported as Record<string, unknown>
    : {}

  const inferredRaw = (value.inferred_proxy && typeof value.inferred_proxy === 'object')
    ? value.inferred_proxy as Record<string, unknown>
    : {}

  const fallbackChainRaw = parseFallbackChain(value.fallback_chain)
  const fallbackChain = fallbackChainRaw.includes(strategy)
    ? fallbackChainRaw
    : [strategy, ...fallbackChainRaw.filter((item) => item !== strategy)]

  return {
    strategy,
    model_version: asString(value.model_version, `${strategy}_v1`),
    fallback_chain: fallbackChain,
    synthetic_seed: {
      default_weight: clamp01(Number(syntheticSeedRaw.default_weight), 0),
      default_confidence: clamp01(Number(syntheticSeedRaw.default_confidence), 0.5),
      source_note: asString(syntheticSeedRaw.source_note, 'catalog_seed'),
      corridor_overrides: corridorOverrides,
    },
    reported: {
      enabled: Boolean(reportedRaw.enabled),
      source_ref:
        reportedRaw.source_ref === null
          ? null
          : asString(reportedRaw.source_ref, '') || null,
      freshness_slo_hours: asInteger(reportedRaw.freshness_slo_hours, 24),
    },
    inferred_proxy: {
      enabled: Boolean(inferredRaw.enabled),
      factor_name: asString(inferredRaw.factor_name, 'volume_proxy'),
      lookback_days: asInteger(inferredRaw.lookback_days, 30),
    },
  }
}

const normalizeRolloutState = (
  value: unknown,
  status: ModuleCatalogEntry['status'],
): ModuleRolloutState => {
  const normalized = asString(value, '')
  if (normalized === 'enabled' || normalized === 'shadow' || normalized === 'disabled') {
    return normalized
  }
  if (status === 'sandbox') return 'shadow'
  if (status === 'deprecated' || status === 'quarantined') return 'disabled'
  return DEFAULT_ROLLOUT_STATE
}

const normalizeSignalLayer = (value: unknown, ownerKind: ModuleOwnerKind): ModuleSignalLayer => {
  const normalized = asString(value, '')
  if (
    normalized === 'quote' ||
    normalized === 'factor' ||
    normalized === 'stress' ||
    normalized === 'health' ||
    normalized === 'event'
  ) {
    return normalized
  }
  return ownerKind === 'provider' ? 'quote' : 'factor'
}

let cached: ModuleCatalog | null = null

const unwrapBundledCatalog = (raw: unknown): unknown => {
  if (raw && typeof raw === 'object' && 'default' in raw) {
    const withDefault = (raw as { default?: unknown }).default
    if (withDefault != null) return withDefault
  }
  return raw
}

const parseCatalog = (raw: unknown, catalogPath: string): ModuleCatalog => {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Module catalog invalid JSON object: ${catalogPath}`)
  }

  const value = raw as Record<string, unknown>
  const version = Number(value.version)
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`Module catalog missing/invalid version: ${catalogPath}`)
  }

  const modulesRaw = value.modules
  if (!Array.isArray(modulesRaw)) {
    throw new Error(`Module catalog missing/invalid modules array: ${catalogPath}`)
  }

  const seen = new Set<string>()
  const parsed: ModuleCatalogEntry[] = modulesRaw.map((entryRaw) => {
    if (!entryRaw || typeof entryRaw !== 'object') {
      throw new Error(`Module catalog contains invalid module entry: ${catalogPath}`)
    }

    const entry = entryRaw as Record<string, unknown>
    const moduleId = asString(entry.module_id, '')
    const providerId = asString(entry.provider_id, '')
    const ownerKind = asString(entry.owner_kind, providerId ? 'provider' : 'signal_source') as ModuleOwnerKind
    const ownerId = asString(entry.owner_id, providerId || '')
    const collectorType = asString(entry.collector_type, '')
    const status = asString(entry.status, 'candidate')
    const specVersion = asInteger(entry.spec_version, 1)
    const signalLayer = normalizeSignalLayer(entry.signal_layer, ownerKind)

    if (!moduleId) throw new Error(`Module catalog entry missing module_id: ${catalogPath}`)
    if (!ownerId) throw new Error(`Module catalog entry missing owner_id/provider_id: ${catalogPath}`)
    if (!collectorType) throw new Error(`Module catalog entry missing collector_type: ${catalogPath}`)
    if (seen.has(moduleId)) throw new Error(`Module catalog duplicate module_id='${moduleId}': ${catalogPath}`)
    seen.add(moduleId)

    return {
      module_id: moduleId,
      owner_kind: ownerKind,
      owner_id: ownerId,
      provider_id: (providerId || ownerId) as ProviderId,
      collector_type: collectorType,
      display_name: asString(entry.display_name, moduleId),
      status: status as ModuleCatalogEntry['status'],
      signal_layer: signalLayer,
      capture_method: asString(entry.capture_method, collectorType || DEFAULT_CAPTURE_METHOD),
      rollout_state: normalizeRolloutState(entry.rollout_state, status as ModuleCatalogEntry['status']),
      spec_version: specVersion,
      schema_version: asInteger(entry.schema_version, 1),
      supported_corridors: asStringArray(entry.supported_corridors),
      supported_amount_buckets: asNumberArray(entry.supported_amount_buckets),
      payin_method: signalLayer === 'quote' ? asStringOrNull(entry.payin_method) ?? 'bank_transfer' : null,
      payout_method: signalLayer === 'quote' ? asStringOrNull(entry.payout_method) ?? 'bank_deposit' : null,
      policy_flags: {
        auto_heal_enabled: Boolean((entry.policy_flags as Record<string, unknown> | undefined)?.auto_heal_enabled),
        emit_observations:
          (entry.policy_flags as Record<string, unknown> | undefined)?.emit_observations === undefined
            ? true
            : Boolean((entry.policy_flags as Record<string, unknown>).emit_observations),
        include_in_gold:
          (entry.policy_flags as Record<string, unknown> | undefined)?.include_in_gold === undefined
            ? signalLayer !== 'health'
            : Boolean((entry.policy_flags as Record<string, unknown>).include_in_gold),
      },
      lineage: {
        schema_ref: asStringOrNull((entry.lineage as Record<string, unknown> | undefined)?.schema_ref),
        source_ref: asStringOrNull((entry.lineage as Record<string, unknown> | undefined)?.source_ref),
      },
      ...(entry.volume === undefined ? {} : { volume: parseModuleVolumePolicy(entry.volume) }),
    }
  })

  const description = typeof value.description === 'string'
    ? value.description
    : undefined

  return {
    version,
    ...(description ? { description } : {}),
    modules: parsed,
  }
}

const loadBundledCatalog = (): ModuleCatalog | null => {
  try {
    return parseCatalog(unwrapBundledCatalog(moduleCatalogJson), 'bundled module catalog')
  } catch {
    return null
  }
}

export const loadModuleCatalog = (): ModuleCatalog => {
  if (cached) return cached

  const catalogPath = getModuleCatalogPath()
  if (!fs.existsSync(catalogPath)) {
    const fallback = loadBundledCatalog()
    if (fallback) {
      cached = fallback
      return cached
    }
    throw new Error(`Module catalog missing: ${catalogPath}`)
  }

  const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as unknown
  const parsed = parseCatalog(raw, catalogPath)
  cached = parsed
  return cached
}

export const clearModuleCatalogCache = (): void => {
  cached = null
}

export const getProductionModuleByProviderId = (
  providerId: string,
): ModuleCatalogEntry | null => {
  const modules = loadModuleCatalog().modules
  return modules.find((module) => module.provider_id === providerId && module.status === 'production') ?? null
}
