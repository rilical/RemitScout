import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import {
  ALANSARI_DESTINATION_COUNTRIES,
  ALANSARI_SOURCE_COUNTRIES,
  ALANSARI_SUPPORTED_CORRIDORS,
} from './supported-corridors'
import { mapPayinMethod, mapPayoutMethod } from './code-map'

export const destinationCountries = ALANSARI_DESTINATION_COUNTRIES
export const sourceCountries = ALANSARI_SOURCE_COUNTRIES

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'bank_deposit'

export const corridors = ALANSARI_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  payinMethodMap: mapPayinMethod,
  payoutMethodMap: mapPayoutMethod,
}

export const payinMethods: string[] = [
  'bank_transfer',
]

export const payoutMethods: string[] = [
  'bank_deposit',
  'cash_pickup',
]
