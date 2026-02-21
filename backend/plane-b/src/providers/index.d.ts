/**
 * LLM Code Map:
 * - `providerDefinitions`: single source for provider wiring and static metadata.
 * - `providerRegistry`: runtime registry consumed by Plane B ingest/refresh workers.
 * - Exports:
 *   - `getProvider(providerId)`: lookup provider entry.
 *   - `getProviderIds()`: list all provider ids (used by probes, schedulers, workflows).
 *   - `hasProvider(providerId)`: membership check.
 */
import { type ProviderRegistryEntry, type ProviderRunOptions } from './registry-builder';
export type { ProviderRegistryEntry, ProviderRunOptions };
/**
 * Central runtime registry for provider metadata and collector entry points.
 */
export declare const providerRegistry: ProviderRegistryEntry[];
export declare const getProvider: (providerId: string) => ProviderRegistryEntry | undefined;
export declare const getProviderIds: () => string[];
export declare const hasProvider: (providerId: string) => boolean;
