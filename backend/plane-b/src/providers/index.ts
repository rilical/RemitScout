/**
 * LLM Code Map:
 * - `providerDefinitions`: single source for provider wiring and static metadata.
 * - `providerRegistry`: runtime registry consumed by Plane B ingest/refresh workers.
 * - Exports:
 *   - `getProvider(providerId)`: lookup provider entry.
 *   - `getProviderIds()`: list all provider ids (used by probes, schedulers, workflows).
 *   - `hasProvider(providerId)`: membership check.
 */
import {
  buildProviderRegistry,
  validateProviderRegistry,
  type ProviderRegistryEntry,
  type ProviderRunOptions,
} from './registry-builder'
import { providerDefinitions } from './provider-definitions'

export type { ProviderRegistryEntry, ProviderRunOptions }

/**
 * Central runtime registry for provider metadata and collector entry points.
 */
export const providerRegistry: ProviderRegistryEntry[] = buildProviderRegistry(providerDefinitions)

validateProviderRegistry(providerRegistry)

const providerRegistryById = new Map(
  providerRegistry.map(provider => [provider.providerId, provider] as const),
)

export const getProvider = (providerId: string) => providerRegistryById.get(providerId)

export const getProviderIds = () => providerRegistry.map(provider => provider.providerId)

export const hasProvider = (providerId: string) => providerRegistryById.has(providerId)
