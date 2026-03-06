import { listProviders, type ProviderId } from '../../shared/provider-catalog'
import { getProviderIds } from '../../plane-b/src/providers'
import { getRegisteredDiscoveryProviders } from '../../plane-b/src/discovery/discovery-runner'

export const CANONICAL_PROVIDER_COUNT = 24

export const PLAYWRIGHT_ASSISTED_DISCOVERY_PROVIDERS = new Set<string>([
  'paysend',
  'remitly',
  'wise',
])

export const STATIC_FALLBACK_DISCOVERY_PROVIDERS = new Set<string>([
  'alansari',
  'dahabshiil',
  'intermex',
  'mukuru',
  'paysend',
  'placid',
  'remitbee',
  'wellsfargo',
  'wise',
])

export const RIGHTS_MATRIX_SEEDED_DISCOVERY_PROVIDERS = new Set<string>([
  'bossmoney',
  'dahabshiil',
  'instarem',
  'mukuru',
  'orbitremit',
  'pangea',
  'placid',
  'remitbee',
  'sendwave',
  'singx',
  'transfergo',
])

export type ProviderInventorySummary = {
  canonicalCount: number
  registryCount: number
  discoveryCount: number
  missingFromRegistry: string[]
  missingFromDiscovery: string[]
  extraInRegistry: string[]
  extraInDiscovery: string[]
}

const normalizeList = (values: string[]): string[] => {
  return values
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .sort()
}

const diffLists = (left: string[], right: string[]): string[] => {
  const rightSet = new Set(right)
  return left.filter((value) => !rightSet.has(value))
}

export const getProviderInventorySummary = (): ProviderInventorySummary => {
  const canonical = normalizeList(listProviders())
  const registry = normalizeList(getProviderIds())
  const discovery = normalizeList(getRegisteredDiscoveryProviders())

  return {
    canonicalCount: canonical.length,
    registryCount: registry.length,
    discoveryCount: discovery.length,
    missingFromRegistry: diffLists(canonical, registry),
    missingFromDiscovery: diffLists(canonical, discovery),
    extraInRegistry: diffLists(registry, canonical),
    extraInDiscovery: diffLists(discovery, canonical),
  }
}

export const assertCanonicalProviderCoverage = (): ProviderInventorySummary => {
  const summary = getProviderInventorySummary()
  const hasCountMismatch = (
    summary.canonicalCount !== CANONICAL_PROVIDER_COUNT
    || summary.registryCount !== CANONICAL_PROVIDER_COUNT
    || summary.discoveryCount !== CANONICAL_PROVIDER_COUNT
  )
  const hasMembershipMismatch = (
    summary.missingFromRegistry.length > 0
    || summary.missingFromDiscovery.length > 0
    || summary.extraInRegistry.length > 0
    || summary.extraInDiscovery.length > 0
  )

  if (hasCountMismatch || hasMembershipMismatch) {
    throw new Error(
      `provider_catalog_mismatch: canonical=${summary.canonicalCount} registry=${summary.registryCount} `
      + `discovery=${summary.discoveryCount} missing_registry=${summary.missingFromRegistry.join(',') || 'none'} `
      + `missing_discovery=${summary.missingFromDiscovery.join(',') || 'none'} `
      + `extra_registry=${summary.extraInRegistry.join(',') || 'none'} `
      + `extra_discovery=${summary.extraInDiscovery.join(',') || 'none'}`,
    )
  }

  return summary
}

export const isCanonicalProviderId = (providerId: string): providerId is ProviderId => {
  return listProviders().includes(providerId as ProviderId)
}

export const getDiscoveryEvidenceProfile = (providerId: string) => {
  const normalized = String(providerId || '').trim().toLowerCase()
  return {
    providerId: normalized,
    playwrightAssisted: PLAYWRIGHT_ASSISTED_DISCOVERY_PROVIDERS.has(normalized),
    staticFallbackDebt: STATIC_FALLBACK_DISCOVERY_PROVIDERS.has(normalized),
    rightsMatrixSeeded: RIGHTS_MATRIX_SEEDED_DISCOVERY_PROVIDERS.has(normalized),
  }
}

export type EvidenceConfidence = 'api' | 'playwright' | 'hybrid' | 'static_fallback'

export const resolveEvidenceConfidence = (input: {
  providerId: string
  hasPositiveCapabilityProbe: boolean
  hasFreshQuotes: boolean
}): EvidenceConfidence => {
  const profile = getDiscoveryEvidenceProfile(input.providerId)
  const hasLiveEvidence = input.hasPositiveCapabilityProbe || input.hasFreshQuotes

  if ((profile.staticFallbackDebt || profile.rightsMatrixSeeded) && !hasLiveEvidence) {
    return 'static_fallback'
  }
  if (profile.playwrightAssisted && !hasLiveEvidence) {
    return 'playwright'
  }
  if ((profile.playwrightAssisted || profile.staticFallbackDebt || profile.rightsMatrixSeeded) && hasLiveEvidence) {
    return 'hybrid'
  }
  return 'api'
}
