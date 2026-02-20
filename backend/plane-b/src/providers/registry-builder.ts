import type { Pool } from 'pg'
import { listProviders } from '../../../shared/provider-catalog'

/**
 * Common run options passed through the provider registry to collectors.
 */
export type ProviderRunOptions = {
  pool: Pool
  collectorType: string
  corridors: string[]
  amountBuckets: number[]
  payinMethod: string
  payoutMethod: string
  locale?: string
  delayMs?: number
  jitterMs?: number
  rateLimitBackoffMs?: number
  rateLimitJitterMs?: number
  rateLimitMaxRetries?: number
  corridorDelayMs?: number
  corridorJitterMs?: number
  freshnessSloMinutes?: number
  freshnessSloEnabled?: boolean
  rpmOverride?: number
  perCorridorRpmOverride?: number
  closePool?: boolean
}

export type ProviderRegistryEntry = {
  providerId: string
  displayName: string
  supportedCorridors: string[]
  baseRates: {
    rpm: number
    perCorridorRpm: number
  }
  run: (options: ProviderRunOptions) => Promise<boolean>
}

export type ProviderDefinition = Omit<ProviderRegistryEntry, 'run'> & {
  runCollector: (options: ProviderRunOptions) => Promise<boolean>
}

const withRegistryRunOptions = (options: ProviderRunOptions): ProviderRunOptions => ({
  ...options,
  closePool: false,
})

export const buildProviderRegistry = (
  definitions: ProviderDefinition[],
): ProviderRegistryEntry[] => {
  return definitions.map((definition) => ({
    providerId: definition.providerId,
    displayName: definition.displayName,
    supportedCorridors: definition.supportedCorridors,
    baseRates: definition.baseRates,
    run: (options: ProviderRunOptions) => definition.runCollector(withRegistryRunOptions(options)),
  }))
}

export const validateProviderRegistry = (registry: ProviderRegistryEntry[]) => {
  const ids = new Set<string>()
  for (const entry of registry) {
    if (!entry.providerId || typeof entry.providerId !== 'string') {
      throw new Error('Provider registry entry missing providerId')
    }
    if (ids.has(entry.providerId)) {
      throw new Error(`Provider registry has duplicate providerId: ${entry.providerId}`)
    }
    ids.add(entry.providerId)
    if (!entry.displayName || typeof entry.displayName !== 'string') {
      throw new Error(`Provider registry entry missing displayName: ${entry.providerId}`)
    }
    if (!Array.isArray(entry.supportedCorridors)) {
      throw new Error(`Provider registry entry missing supportedCorridors: ${entry.providerId}`)
    }
    if (
      !entry.baseRates
      || !Number.isFinite(entry.baseRates.rpm)
      || !Number.isFinite(entry.baseRates.perCorridorRpm)
    ) {
      throw new Error(`Provider registry entry missing baseRates: ${entry.providerId}`)
    }
    if (typeof entry.run !== 'function') {
      throw new Error(`Provider registry entry missing run function: ${entry.providerId}`)
    }
  }

  const catalogProviderIds = new Set<string>(listProviders())
  for (const providerId of ids) {
    if (!catalogProviderIds.has(providerId)) {
      throw new Error(`Provider registry providerId missing from catalog: ${providerId}`)
    }
  }

  for (const providerId of catalogProviderIds) {
    if (!ids.has(providerId)) {
      throw new Error(`Provider catalog providerId missing from providerRegistry: ${providerId}`)
    }
  }
}
