import { getProviderCatalogEntry, type ProviderId, loadProviderCatalog } from './provider-catalog'

/**
 * Health corridors are used for:
 * - Provider health probes (scripts/*probe*)
 * - Ops health endpoints (plane-a/src/routes/ops/*-health.ts)
 * - “Tier 0” readiness checks (indices health, smoke checks)
 *
 * Canonical source of truth: `.remit-scout/providers/catalog.json`
 */

export type { ProviderId }

export const HEALTH_CORRIDORS: Record<ProviderId, readonly string[]> = (() => {
  const catalog = loadProviderCatalog()
  const map: Record<string, readonly string[]> = {}
  for (const p of catalog.providers) {
    map[p.provider_id] = p.health_corridors
  }
  return map as Record<ProviderId, readonly string[]>
})()

export const getHealthCorridors = (providerId: ProviderId): readonly string[] => {
  return HEALTH_CORRIDORS[providerId] ?? []
}

export const isHealthCorridor = (providerId: ProviderId, corridorId: string): boolean => {
  if (!corridorId) return false
  const corridors = HEALTH_CORRIDORS[providerId]
  if (!corridors || corridors.length === 0) return false
  return corridors.includes(corridorId)
}

export const getProviderDisplayName = (providerId: ProviderId): string => {
  return getProviderCatalogEntry(providerId)?.display_name ?? providerId
}

