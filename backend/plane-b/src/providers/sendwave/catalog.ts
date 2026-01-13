import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { SENDWAVE_SOURCE_COUNTRIES, SENDWAVE_SUPPORTED_CORRIDORS } from './supported-corridors'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'

export const sourceCountries = SENDWAVE_SOURCE_COUNTRIES
export const corridors = SENDWAVE_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'debit_card'
export const defaultPayoutMethod = 'bank_deposit'

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const payinMethods: string[] = [
  'debit_card',
]

export const payoutMethods: string[] = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
]
