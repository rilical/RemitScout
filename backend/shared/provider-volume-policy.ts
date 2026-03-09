import fs from 'node:fs'
import path from 'node:path'
import bundledPolicyJson from '../../.remit-scout/providers/volume-policy.json'
import {
  defaultModuleVolumePolicy,
  parseModuleVolumePolicy,
  type ModuleVolumePolicy,
} from './module-catalog'

export type ProviderVolumePolicyEntry = {
  provider_id: string
  volume: ModuleVolumePolicy
}

export type ProviderVolumePolicyCatalog = {
  version: number
  description?: string
  default_policy?: ModuleVolumePolicy
  providers: ProviderVolumePolicyEntry[]
}

const CATALOG_PATH_SEGMENTS = path.join('.remit-scout', 'providers', 'volume-policy.json')

const locateCatalogRoot = (startDir: string): string | null => {
  let dir = startDir
  for (let i = 0; i < 12; i += 1) {
    const candidate = path.join(dir, CATALOG_PATH_SEGMENTS)
    if (fs.existsSync(candidate)) {
      return dir
    }

    const parent = path.dirname(dir)
    if (parent === dir) break
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

export const getProviderVolumePolicyPath = (): string => {
  const override = String(process.env.PROVIDER_VOLUME_POLICY_PATH || '').trim()
  if (override) {
    return path.isAbsolute(override) ? override : path.join(getRepoRoot(), override)
  }
  return path.join(getRepoRoot(), '.remit-scout', 'providers', 'volume-policy.json')
}

const unwrapBundledCatalog = (raw: unknown): unknown => {
  if (raw && typeof raw === 'object' && 'default' in raw) {
    const withDefault = (raw as { default?: unknown }).default
    if (withDefault != null) return withDefault
  }
  return raw
}

const parseCatalog = (raw: unknown, catalogPath: string): ProviderVolumePolicyCatalog => {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Provider volume policy catalog invalid JSON object: ${catalogPath}`)
  }

  const value = raw as Record<string, unknown>
  const version = Number(value.version)
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`Provider volume policy catalog missing/invalid version: ${catalogPath}`)
  }

  const providersRaw = Array.isArray(value.providers) ? value.providers : []
  const providers = providersRaw.map((entryRaw) => {
    if (!entryRaw || typeof entryRaw !== 'object') {
      throw new Error(`Provider volume policy catalog contains invalid provider entry: ${catalogPath}`)
    }

    const entry = entryRaw as Record<string, unknown>
    const providerId = String(entry.provider_id ?? '').trim().toLowerCase()
    if (!providerId) {
      throw new Error(`Provider volume policy entry missing provider_id: ${catalogPath}`)
    }

    return {
      provider_id: providerId,
      volume: parseModuleVolumePolicy(entry.volume),
    } satisfies ProviderVolumePolicyEntry
  })

  return {
    version,
    description: typeof value.description === 'string' ? value.description : undefined,
    default_policy: value.default_policy === undefined ? undefined : parseModuleVolumePolicy(value.default_policy),
    providers,
  }
}

let cached: ProviderVolumePolicyCatalog | null = null

const loadBundledCatalog = (): ProviderVolumePolicyCatalog | null => {
  try {
    return parseCatalog(unwrapBundledCatalog(bundledPolicyJson), 'bundled provider volume policy catalog')
  } catch {
    return null
  }
}

export const loadProviderVolumePolicyCatalog = (): ProviderVolumePolicyCatalog => {
  if (cached) return cached

  const catalogPath = getProviderVolumePolicyPath()
  if (!fs.existsSync(catalogPath)) {
    const fallback = loadBundledCatalog()
    if (fallback) {
      cached = fallback
      return cached
    }
    throw new Error(`Provider volume policy catalog missing: ${catalogPath}`)
  }

  const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as unknown
  cached = parseCatalog(raw, catalogPath)
  return cached
}

export const clearProviderVolumePolicyCatalogCache = (): void => {
  cached = null
}

export const getProviderVolumePolicy = (
  providerId: string,
): ModuleVolumePolicy | null => {
  const normalizedProviderId = String(providerId || '').trim().toLowerCase()
  if (!normalizedProviderId) return null

  const catalog = loadProviderVolumePolicyCatalog()
  const match = catalog.providers.find((entry) => entry.provider_id === normalizedProviderId)
  return match?.volume ?? null
}

export const getDefaultProviderVolumePolicy = (): ModuleVolumePolicy => {
  const catalog = loadProviderVolumePolicyCatalog()
  return catalog.default_policy ?? defaultModuleVolumePolicy()
}
