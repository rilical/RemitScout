import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import {
  WIREBARLEY_DESTINATION_COUNTRIES,
  WIREBARLEY_SOURCE_COUNTRIES,
  WIREBARLEY_SUPPORTED_CORRIDORS,
} from './supported-corridors'
import { mapPayinMethod, mapPayoutMethod } from './code-map'

export const destinationCountries = WIREBARLEY_DESTINATION_COUNTRIES
export const sourceCountries = WIREBARLEY_SOURCE_COUNTRIES

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'bank_deposit'

export const corridors = WIREBARLEY_SUPPORTED_CORRIDORS
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
  'mobile_wallet',
  'home_delivery',
]
