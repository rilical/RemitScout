import type { Pool } from 'pg'

import { runRemitlyCollector } from './remitly/collector'
import { REMITLY_B2B_CORRIDORS } from './remitly/supported-corridors'
import { httpLimits as remitlyLimits } from './remitly/limits'
import { runWesternUnionCollector } from './westernunion/collector'
import { WESTERNUNION_B2B_CORRIDORS } from './westernunion/supported-corridors'
import { httpLimits as westernUnionLimits } from './westernunion/limits'
import { runWorldRemitCollector } from './worldremit/collector'
import { WORLDREMIT_B2B_CORRIDORS } from './worldremit/supported-corridors'
import { httpLimits as worldRemitLimits } from './worldremit/limits'
import { runXeCollector } from './xe/collector'
import { XE_B2B_CORRIDORS } from './xe/supported-corridors'
import { httpLimits as xeLimits } from './xe/limits'
import { runWiseCollector } from './wise/collector'
import { WISE_B2B_CORRIDORS } from './wise/supported-corridors'
import { httpLimits as wiseLimits } from './wise/limits'
import { runWellsFargoCollector } from './wellsfargo/collector'
import { WELLSFARGO_B2B_CORRIDORS } from './wellsfargo/supported-corridors'
import { httpLimits as wellsFargoLimits } from './wellsfargo/limits'

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

/**
 * Central registry for provider metadata and collector entry points.
 */
export const providerRegistry: ProviderRegistryEntry[] = [
  {
    providerId: 'remitly',
    displayName: 'Remitly',
    supportedCorridors: REMITLY_B2B_CORRIDORS,
    baseRates: {
      rpm: remitlyLimits.rpm,
      perCorridorRpm: remitlyLimits.perCorridorRpm,
    },
    run: (options) => runRemitlyCollector({
      pool: options.pool,
      collectorType: options.collectorType,
      corridors: options.corridors,
      amountBuckets: options.amountBuckets,
      payinMethod: options.payinMethod,
      payoutMethod: options.payoutMethod,
      locale: options.locale,
      delayMs: options.delayMs,
      jitterMs: options.jitterMs,
      rateLimitBackoffMs: options.rateLimitBackoffMs,
      rateLimitJitterMs: options.rateLimitJitterMs,
      rateLimitMaxRetries: options.rateLimitMaxRetries,
      corridorDelayMs: options.corridorDelayMs,
      corridorJitterMs: options.corridorJitterMs,
      freshnessSloMinutes: options.freshnessSloMinutes,
      freshnessSloEnabled: options.freshnessSloEnabled,
      rpmOverride: options.rpmOverride,
      perCorridorRpmOverride: options.perCorridorRpmOverride,
    }),
  },
  {
    providerId: 'westernunion',
    displayName: 'Western Union',
    supportedCorridors: WESTERNUNION_B2B_CORRIDORS,
    baseRates: {
      rpm: westernUnionLimits.rpm,
      perCorridorRpm: westernUnionLimits.perCorridorRpm,
    },
    run: (options) => runWesternUnionCollector({
      pool: options.pool,
      collectorType: options.collectorType,
      corridors: options.corridors,
      amountBuckets: options.amountBuckets,
      payinMethod: options.payinMethod,
      payoutMethod: options.payoutMethod,
      locale: options.locale,
      delayMs: options.delayMs,
      jitterMs: options.jitterMs,
      rateLimitBackoffMs: options.rateLimitBackoffMs,
      rateLimitJitterMs: options.rateLimitJitterMs,
      rateLimitMaxRetries: options.rateLimitMaxRetries,
      corridorDelayMs: options.corridorDelayMs,
      corridorJitterMs: options.corridorJitterMs,
      freshnessSloMinutes: options.freshnessSloMinutes,
      freshnessSloEnabled: options.freshnessSloEnabled,
      rpmOverride: options.rpmOverride,
      perCorridorRpmOverride: options.perCorridorRpmOverride,
    }),
  },
  {
    providerId: 'worldremit',
    displayName: 'WorldRemit',
    supportedCorridors: WORLDREMIT_B2B_CORRIDORS,
    baseRates: {
      rpm: worldRemitLimits.rpm,
      perCorridorRpm: worldRemitLimits.perCorridorRpm,
    },
    run: (options) => runWorldRemitCollector({
      pool: options.pool,
      collectorType: options.collectorType,
      corridors: options.corridors,
      amountBuckets: options.amountBuckets,
      payinMethod: options.payinMethod,
      payoutMethod: options.payoutMethod,
      locale: options.locale,
      delayMs: options.delayMs,
      jitterMs: options.jitterMs,
      rateLimitBackoffMs: options.rateLimitBackoffMs,
      rateLimitJitterMs: options.rateLimitJitterMs,
      rateLimitMaxRetries: options.rateLimitMaxRetries,
      corridorDelayMs: options.corridorDelayMs,
      corridorJitterMs: options.corridorJitterMs,
      freshnessSloMinutes: options.freshnessSloMinutes,
      freshnessSloEnabled: options.freshnessSloEnabled,
      rpmOverride: options.rpmOverride,
      perCorridorRpmOverride: options.perCorridorRpmOverride,
    }),
  },
  {
    providerId: 'xe',
    displayName: 'Xe',
    supportedCorridors: XE_B2B_CORRIDORS,
    baseRates: {
      rpm: xeLimits.rpm,
      perCorridorRpm: xeLimits.perCorridorRpm,
    },
    run: (options) => runXeCollector({
      pool: options.pool,
      collectorType: options.collectorType,
      corridors: options.corridors,
      amountBuckets: options.amountBuckets,
      payinMethod: options.payinMethod,
      payoutMethod: options.payoutMethod,
      locale: options.locale,
      delayMs: options.delayMs,
      jitterMs: options.jitterMs,
      rateLimitBackoffMs: options.rateLimitBackoffMs,
      rateLimitJitterMs: options.rateLimitJitterMs,
      rateLimitMaxRetries: options.rateLimitMaxRetries,
      corridorDelayMs: options.corridorDelayMs,
      corridorJitterMs: options.corridorJitterMs,
      freshnessSloMinutes: options.freshnessSloMinutes,
      freshnessSloEnabled: options.freshnessSloEnabled,
      rpmOverride: options.rpmOverride,
      perCorridorRpmOverride: options.perCorridorRpmOverride,
    }),
  },
  {
    providerId: 'wise',
    displayName: 'Wise',
    supportedCorridors: WISE_B2B_CORRIDORS,
    baseRates: {
      rpm: wiseLimits.rpm,
      perCorridorRpm: wiseLimits.perCorridorRpm,
    },
    run: (options) => runWiseCollector({
      pool: options.pool,
      collectorType: options.collectorType,
      corridors: options.corridors,
      amountBuckets: options.amountBuckets,
      payinMethod: options.payinMethod,
      payoutMethod: options.payoutMethod,
      locale: options.locale,
      delayMs: options.delayMs,
      jitterMs: options.jitterMs,
      rateLimitBackoffMs: options.rateLimitBackoffMs,
      rateLimitJitterMs: options.rateLimitJitterMs,
      rateLimitMaxRetries: options.rateLimitMaxRetries,
      corridorDelayMs: options.corridorDelayMs,
      corridorJitterMs: options.corridorJitterMs,
      freshnessSloMinutes: options.freshnessSloMinutes,
      freshnessSloEnabled: options.freshnessSloEnabled,
      rpmOverride: options.rpmOverride,
      perCorridorRpmOverride: options.perCorridorRpmOverride,
    }),
  },
  {
    providerId: 'wellsfargo',
    displayName: 'Wells Fargo',
    supportedCorridors: WELLSFARGO_B2B_CORRIDORS,
    baseRates: {
      rpm: wellsFargoLimits.rpm,
      perCorridorRpm: wellsFargoLimits.perCorridorRpm,
    },
    run: (options) => runWellsFargoCollector({
      pool: options.pool,
      collectorType: options.collectorType,
      corridors: options.corridors,
      amountBuckets: options.amountBuckets,
      payinMethod: options.payinMethod,
      payoutMethod: options.payoutMethod,
      locale: options.locale,
      delayMs: options.delayMs,
      jitterMs: options.jitterMs,
      rateLimitBackoffMs: options.rateLimitBackoffMs,
      rateLimitJitterMs: options.rateLimitJitterMs,
      rateLimitMaxRetries: options.rateLimitMaxRetries,
      corridorDelayMs: options.corridorDelayMs,
      corridorJitterMs: options.corridorJitterMs,
      freshnessSloMinutes: options.freshnessSloMinutes,
      freshnessSloEnabled: options.freshnessSloEnabled,
      rpmOverride: options.rpmOverride,
      perCorridorRpmOverride: options.perCorridorRpmOverride,
    }),
  },
]

const validateProviderRegistry = (registry: ProviderRegistryEntry[]) => {
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
}

validateProviderRegistry(providerRegistry)

const providerRegistryById = new Map(
  providerRegistry.map(provider => [provider.providerId, provider] as const),
)

export const getProvider = (providerId: string) => providerRegistryById.get(providerId)

export const getProviderIds = () => providerRegistry.map(provider => provider.providerId)

export const hasProvider = (providerId: string) => providerRegistryById.has(providerId)
