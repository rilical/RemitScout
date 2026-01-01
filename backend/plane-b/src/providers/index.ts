import type { Pool } from 'pg'

import { config } from '../../../shared/config'
import { runRemitlyCollector } from './remitly/collector'
import { REMITLY_B2B_CORRIDORS } from './remitly/supported-corridors'
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

export type ProviderRunOptions = {
  pool: Pool
  collectorType: string
  corridors: string[]
  amountBuckets: number[]
  payinMethod: string
  payoutMethod: string
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

export const providerRegistry: ProviderRegistryEntry[] = [
  {
    providerId: 'remitly',
    displayName: 'Remitly',
    supportedCorridors: REMITLY_B2B_CORRIDORS,
    baseRates: {
      rpm: config.planeB.remitly.rpm,
      perCorridorRpm: config.planeB.remitly.perCorridorRpm,
    },
    run: (options) => runRemitlyCollector({
      pool: options.pool,
      collectorType: options.collectorType,
      corridors: options.corridors,
      amountBuckets: options.amountBuckets,
      payinMethod: options.payinMethod,
      payoutMethod: options.payoutMethod,
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
      rpmOverride: options.rpmOverride,
      perCorridorRpmOverride: options.perCorridorRpmOverride,
    }),
  },
]
