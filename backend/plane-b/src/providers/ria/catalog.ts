import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { RIA_SOURCE_COUNTRIES, RIA_SUPPORTED_CORRIDORS } from './supported-corridors'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'

export const sourceCountries = RIA_SOURCE_COUNTRIES
export const corridors = RIA_SUPPORTED_CORRIDORS
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
  'bank_transfer',
  'debit_card',
  'credit_card',
  'apple_pay',
  'google_pay',
]

export const payoutMethods: string[] = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
]
