import fs from 'node:fs'
import path from 'node:path'

/**
 * Provider catalog is repo-native data under `.remit-scout/providers/catalog.json`.
 *
 * This is a deliberate design choice:
 * - Backend runtime (Plane A/B/C + scripts) can read the same canonical provider metadata
 * - CI / GitHub Actions / CDK can also read the same file without TS cross-package imports
 *
 * The Docker image must include `.remit-scout/` (see backend/Dockerfile).
 */

export type ProviderId =
  | 'alansari'
  | 'bossmoney'
  | 'dahabshiil'
  | 'instarem'
  | 'intermex'
  | 'koronapay'
  | 'mukuru'
  | 'orbitremit'
  | 'pangea'
  | 'paysend'
  | 'placid'
  | 'remitbee'
  | 'remitly'
  | 'ria'
  | 'sendwave'
  | 'singx'
  | 'transfergo'
  | 'wellsfargo'
  | 'westernunion'
  | 'wirebarley'
  | 'wise'
  | 'worldremit'
  | 'xe'
  | 'xoom'

const PROVIDER_ID_SET = new Set<string>([
  'alansari',
  'bossmoney',
  'dahabshiil',
  'instarem',
  'intermex',
  'koronapay',
  'mukuru',
  'orbitremit',
  'pangea',
  'paysend',
  'placid',
  'remitbee',
  'remitly',
  'ria',
  'sendwave',
  'singx',
  'transfergo',
  'wellsfargo',
  'westernunion',
  'wirebarley',
  'wise',
  'worldremit',
  'xe',
  'xoom',
])

export type ProviderProbeConfig = {
  aws_scheduled: boolean
  // Must match existing CDK construct IDs when set (to avoid resource replacement).
  aws_cdk_id?: string
  github_actions: boolean
}

export type ProviderCatalogEntry = {
  provider_id: ProviderId
  display_name: string
  supports_b2b: boolean
  supports_b2c: boolean
  health_corridors: string[]
  probe?: ProviderProbeConfig
}

export type ProviderCatalog = {
  version: number
  providers: ProviderCatalogEntry[]
}

const getRepoRoot = (): string => {
  const override = String(process.env.REMIT_SCOUT_REPO_ROOT || '').trim()
  if (override) return override

  // Be robust to different runtime layouts:
  // - local source:        <repo>/backend/shared
  // - compiled scripts:    <repo>/backend/dist/shared
  // - docker runner copy:  /app/backend/shared OR /app/backend/dist/shared
  // In all cases `.remit-scout/` lives at the repo root (or WORKDIR root in docker).
  let dir = __dirname
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, '.remit-scout', 'providers', 'catalog.json')
    if (fs.existsSync(candidate)) return dir

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  // Fallback to the legacy assumption (kept for safety).
  return path.resolve(__dirname, '..', '..')
}

export const getProviderCatalogPath = (): string => {
  return path.join(getRepoRoot(), '.remit-scout', 'providers', 'catalog.json')
}

const isProviderId = (value: string): value is ProviderId => PROVIDER_ID_SET.has(value)

let cached: ProviderCatalog | null = null

export const loadProviderCatalog = (): ProviderCatalog => {
  if (cached) return cached

  const catalogPath = getProviderCatalogPath()
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Provider catalog missing: ${catalogPath}`)
  }

  const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as unknown
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Provider catalog invalid JSON object: ${catalogPath}`)
  }

  const version = Number((raw as any).version)
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`Provider catalog missing/invalid version: ${catalogPath}`)
  }

  const providers = (raw as any).providers
  if (!Array.isArray(providers)) {
    throw new Error(`Provider catalog missing/invalid providers array: ${catalogPath}`)
  }

  const parsed: ProviderCatalogEntry[] = providers.map((p: any) => {
    const providerId = String(p?.provider_id ?? '').trim()
    if (!providerId || !isProviderId(providerId)) {
      throw new Error(`Provider catalog has unknown provider_id='${providerId}': ${catalogPath}`)
    }
    const displayName = String(p?.display_name ?? providerId).trim() || providerId
    const supportsB2b = Boolean(p?.supports_b2b)
    const supportsB2c = Boolean(p?.supports_b2c)
    const healthCorridors = Array.isArray(p?.health_corridors)
      ? p.health_corridors.map((c: any) => String(c).trim()).filter(Boolean)
      : []

    const probe: ProviderProbeConfig | undefined = p?.probe
      ? {
          aws_scheduled: Boolean(p.probe.aws_scheduled),
          aws_cdk_id: p.probe.aws_cdk_id ? String(p.probe.aws_cdk_id) : undefined,
          github_actions: Boolean(p.probe.github_actions),
        }
      : undefined

    return {
      provider_id: providerId as ProviderId,
      display_name: displayName,
      supports_b2b: supportsB2b,
      supports_b2c: supportsB2c,
      health_corridors: healthCorridors,
      ...(probe ? { probe } : {}),
    }
  })

  cached = { version, providers: parsed }
  return cached
}

export const listProviders = (): ProviderId[] => {
  return loadProviderCatalog().providers.map((p) => p.provider_id)
}

export const getProviderCatalogEntry = (providerId: ProviderId): ProviderCatalogEntry | null => {
  const catalog = loadProviderCatalog()
  return catalog.providers.find((p) => p.provider_id === providerId) ?? null
}

export const listAwsScheduledProbeProviders = (): Array<{
  providerId: ProviderId
  cdkId: string
}> => {
  return loadProviderCatalog()
    .providers
    .filter((p) => p.probe?.aws_scheduled === true)
    .map((p) => ({
      providerId: p.provider_id,
      cdkId: p.probe?.aws_cdk_id || p.provider_id,
    }))
}

export const listGithubActionsProbeProviders = (): ProviderId[] => {
  return loadProviderCatalog()
    .providers
    .filter((p) => p.probe?.github_actions === true)
    .map((p) => p.provider_id)
}
