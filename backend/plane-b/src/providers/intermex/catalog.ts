import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import {
  INTERMEX_DESTINATION_COUNTRIES,
  INTERMEX_SOURCE_COUNTRIES,
  INTERMEX_SUPPORTED_CORRIDORS,
} from './supported-corridors'
import { mapPayinMethod, mapPayoutMethod } from './code-map'

export const destinationCountries = INTERMEX_DESTINATION_COUNTRIES
export const sourceCountries = INTERMEX_SOURCE_COUNTRIES

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'debit_card'
export const defaultPayoutMethod = 'bank_deposit'

export const corridors = INTERMEX_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  payinMethodMap: mapPayinMethod,
  payoutMethodMap: mapPayoutMethod,
}

export const payinMethods: string[] = [
  'debit_card',
  'credit_card',
]

export const payoutMethods: string[] = [
  'bank_deposit',
  'cash_pickup',
]
