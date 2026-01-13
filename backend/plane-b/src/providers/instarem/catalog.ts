import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import {
  INSTAREM_DESTINATION_COUNTRIES,
  INSTAREM_SOURCE_COUNTRIES,
  INSTAREM_SUPPORTED_CORRIDORS,
} from './supported-corridors'
import { payinMethodMap, payoutMethodMap } from './code-map'

export const destinationCountries = INSTAREM_DESTINATION_COUNTRIES
export const sourceCountries = INSTAREM_SOURCE_COUNTRIES

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'bank_deposit'

export const corridors = INSTAREM_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  payinMethodMap,
  payoutMethodMap,
}

export const payinMethods: string[] = [
  'bank_transfer',
  'debit_card',
  'credit_card',
  'apple_pay',
  'google_pay',
]

export const payoutMethods: string[] = [
  'bank_deposit',
]
