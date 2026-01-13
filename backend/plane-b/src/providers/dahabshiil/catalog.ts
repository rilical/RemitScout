import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { DAHABSHIIL_SOURCE_COUNTRIES, DAHABSHIIL_SUPPORTED_CORRIDORS } from './supported-corridors'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'

export const sourceCountries = DAHABSHIIL_SOURCE_COUNTRIES
export const corridors = DAHABSHIIL_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'cash_pickup'

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const payinMethods: string[] = [
  'bank_transfer',
]

export const payoutMethods: string[] = [
  'cash_pickup',
]
