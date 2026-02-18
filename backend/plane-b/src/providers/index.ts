/**
 * LLM Code Map:
 * - `providerRegistry`: canonical registry mapping provider_id -> collector + corridors + rate limits.
 * - Exports:
 *   - `getProvider(providerId)`: lookup provider entry.
 *   - `getProviderIds()`: list all provider ids (used by probes, schedulers, workflows).
 *   - `hasProvider(providerId)`: membership check.
 * - Invariants:
 *   - Do not duplicate provider lists elsewhere; derive from registry/catalog.
 *   - Any new provider must update this registry (or the scaffolder/catalog if/when registry becomes generated).
 */
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
import { runInstaremCollector } from './instarem/collector'
import { INSTAREM_B2B_CORRIDORS } from './instarem/supported-corridors'
import { httpLimits as instaremLimits } from './instarem/limits'
import { runWireBarleyCollector } from './wirebarley/collector'
import { WIREBARLEY_B2B_CORRIDORS } from './wirebarley/supported-corridors'
import { httpLimits as wireBarleyLimits } from './wirebarley/limits'
import { runAlansariCollector } from './alansari/collector'
import { ALANSARI_B2B_CORRIDORS } from './alansari/supported-corridors'
import { httpLimits as alansariLimits } from './alansari/limits'
import { runIntermexCollector } from './intermex/collector'
import { INTERMEX_B2B_CORRIDORS } from './intermex/supported-corridors'
import { httpLimits as intermexLimits } from './intermex/limits'
import { runXoomCollector } from './xoom/collector'
import { XOOM_B2B_CORRIDORS } from './xoom/supported-corridors'
import { httpLimits as xoomLimits } from './xoom/limits'
import { runXeCollector } from './xe/collector'
import { XE_B2B_CORRIDORS } from './xe/supported-corridors'
import { httpLimits as xeLimits } from './xe/limits'
import { runTransferGoCollector } from './transfergo/collector'
import { TRANSFERGO_B2B_CORRIDORS } from './transfergo/supported-corridors'
import { httpLimits as transferGoLimits } from './transfergo/limits'
import { runPaysendCollector } from './paysend/collector'
import { PAYSEND_B2B_CORRIDORS } from './paysend/supported-corridors'
import { httpLimits as paysendLimits } from './paysend/limits'
import { runPangeaCollector } from './pangea/collector'
import { PANGEA_B2B_CORRIDORS } from './pangea/supported-corridors'
import { httpLimits as pangeaLimits } from './pangea/limits'
import { runOrbitRemitCollector } from './orbitremit/collector'
import { ORBITREMIT_B2B_CORRIDORS } from './orbitremit/supported-corridors'
import { httpLimits as orbitremitLimits } from './orbitremit/limits'
import { runBossMoneyCollector } from './bossmoney/collector'
import { BOSSMONEY_B2B_CORRIDORS } from './bossmoney/supported-corridors'
import { httpLimits as bossmoneyLimits } from './bossmoney/limits'
import { runKoronaPayCollector } from './koronapay/collector'
import { KORONAPAY_B2B_CORRIDORS } from './koronapay/supported-corridors'
import { httpLimits as koronapayLimits } from './koronapay/limits'
import { runRemitbeeCollector } from './remitbee/collector'
import { REMITBEE_B2B_CORRIDORS } from './remitbee/supported-corridors'
import { httpLimits as remitbeeLimits } from './remitbee/limits'
import { runSingxCollector } from './singx/collector'
import { SINGX_B2B_CORRIDORS } from './singx/supported-corridors'
import { httpLimits as singxLimits } from './singx/limits'
import { runPlacidCollector } from './placid/collector'
import { PLACID_B2B_CORRIDORS } from './placid/supported-corridors'
import { httpLimits as placidLimits } from './placid/limits'
import { runRiaCollector } from './ria/collector'
import { RIA_B2B_CORRIDORS } from './ria/supported-corridors'
import { httpLimits as riaLimits } from './ria/limits'
import { runDahabshiilCollector } from './dahabshiil/collector'
import { DAHABSHIIL_B2B_CORRIDORS } from './dahabshiil/supported-corridors'
import { httpLimits as dahabshiilLimits } from './dahabshiil/limits'
import { runSendwaveCollector } from './sendwave/collector'
import { SENDWAVE_B2B_CORRIDORS } from './sendwave/supported-corridors'
import { httpLimits as sendwaveLimits } from './sendwave/limits'
import { runMukuruCollector } from './mukuru/collector'
import { MUKURU_B2B_CORRIDORS } from './mukuru/supported-corridors'
import { httpLimits as mukuruLimits } from './mukuru/limits'
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
      closePool: false,
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
      closePool: false,
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
      closePool: false,
    }),
  },
  {
    providerId: 'instarem',
    displayName: 'Instarem',
    supportedCorridors: INSTAREM_B2B_CORRIDORS,
    baseRates: {
      rpm: instaremLimits.rpm,
      perCorridorRpm: instaremLimits.perCorridorRpm,
    },
    run: (options) => runInstaremCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'wirebarley',
    displayName: 'WireBarley',
    supportedCorridors: WIREBARLEY_B2B_CORRIDORS,
    baseRates: {
      rpm: wireBarleyLimits.rpm,
      perCorridorRpm: wireBarleyLimits.perCorridorRpm,
    },
    run: (options) => runWireBarleyCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'alansari',
    displayName: 'Al Ansari',
    supportedCorridors: ALANSARI_B2B_CORRIDORS,
    baseRates: {
      rpm: alansariLimits.rpm,
      perCorridorRpm: alansariLimits.perCorridorRpm,
    },
    run: (options) => runAlansariCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'intermex',
    displayName: 'Intermex',
    supportedCorridors: INTERMEX_B2B_CORRIDORS,
    baseRates: {
      rpm: intermexLimits.rpm,
      perCorridorRpm: intermexLimits.perCorridorRpm,
    },
    run: (options) => runIntermexCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'xoom',
    displayName: 'Xoom',
    supportedCorridors: XOOM_B2B_CORRIDORS,
    baseRates: {
      rpm: xoomLimits.rpm,
      perCorridorRpm: xoomLimits.perCorridorRpm,
    },
    run: (options) => runXoomCollector({
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
      closePool: false,
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
      closePool: false,
    }),
  },
  {
    providerId: 'transfergo',
    displayName: 'TransferGo',
    supportedCorridors: TRANSFERGO_B2B_CORRIDORS,
    baseRates: {
      rpm: transferGoLimits.rpm,
      perCorridorRpm: transferGoLimits.perCorridorRpm,
    },
    run: (options) => runTransferGoCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'paysend',
    displayName: 'Paysend',
    supportedCorridors: PAYSEND_B2B_CORRIDORS,
    baseRates: {
      rpm: paysendLimits.rpm,
      perCorridorRpm: paysendLimits.perCorridorRpm,
    },
    run: (options) => runPaysendCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'pangea',
    displayName: 'Pangea',
    supportedCorridors: PANGEA_B2B_CORRIDORS,
    baseRates: {
      rpm: pangeaLimits.rpm,
      perCorridorRpm: pangeaLimits.perCorridorRpm,
    },
    run: (options) => runPangeaCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'orbitremit',
    displayName: 'OrbitRemit',
    supportedCorridors: ORBITREMIT_B2B_CORRIDORS,
    baseRates: {
      rpm: orbitremitLimits.rpm,
      perCorridorRpm: orbitremitLimits.perCorridorRpm,
    },
    run: (options) => runOrbitRemitCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'bossmoney',
    displayName: 'Boss Money',
    supportedCorridors: BOSSMONEY_B2B_CORRIDORS,
    baseRates: {
      rpm: bossmoneyLimits.rpm,
      perCorridorRpm: bossmoneyLimits.perCorridorRpm,
    },
    run: (options) => runBossMoneyCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'koronapay',
    displayName: 'KoronaPay',
    supportedCorridors: KORONAPAY_B2B_CORRIDORS,
    baseRates: {
      rpm: koronapayLimits.rpm,
      perCorridorRpm: koronapayLimits.perCorridorRpm,
    },
    run: (options) => runKoronaPayCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'remitbee',
    displayName: 'RemitBee',
    supportedCorridors: REMITBEE_B2B_CORRIDORS,
    baseRates: {
      rpm: remitbeeLimits.rpm,
      perCorridorRpm: remitbeeLimits.perCorridorRpm,
    },
    run: (options) => runRemitbeeCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'singx',
    displayName: 'SingX',
    supportedCorridors: SINGX_B2B_CORRIDORS,
    baseRates: {
      rpm: singxLimits.rpm,
      perCorridorRpm: singxLimits.perCorridorRpm,
    },
    run: (options) => runSingxCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'placid',
    displayName: 'Placid',
    supportedCorridors: PLACID_B2B_CORRIDORS,
    baseRates: {
      rpm: placidLimits.rpm,
      perCorridorRpm: placidLimits.perCorridorRpm,
    },
    run: (options) => runPlacidCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'ria',
    displayName: 'Ria',
    supportedCorridors: RIA_B2B_CORRIDORS,
    baseRates: {
      rpm: riaLimits.rpm,
      perCorridorRpm: riaLimits.perCorridorRpm,
    },
    run: (options) => runRiaCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'dahabshiil',
    displayName: 'Dahabshiil',
    supportedCorridors: DAHABSHIIL_B2B_CORRIDORS,
    baseRates: {
      rpm: dahabshiilLimits.rpm,
      perCorridorRpm: dahabshiilLimits.perCorridorRpm,
    },
    run: (options) => runDahabshiilCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'sendwave',
    displayName: 'Sendwave',
    supportedCorridors: SENDWAVE_B2B_CORRIDORS,
    baseRates: {
      rpm: sendwaveLimits.rpm,
      perCorridorRpm: sendwaveLimits.perCorridorRpm,
    },
    run: (options) => runSendwaveCollector({
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
      closePool: false,
    }),
  },
  {
    providerId: 'mukuru',
    displayName: 'Mukuru',
    supportedCorridors: MUKURU_B2B_CORRIDORS,
    baseRates: {
      rpm: mukuruLimits.rpm,
      perCorridorRpm: mukuruLimits.perCorridorRpm,
    },
    run: (options) => runMukuruCollector({
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
      closePool: false,
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
      closePool: false,
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
      closePool: false,
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
