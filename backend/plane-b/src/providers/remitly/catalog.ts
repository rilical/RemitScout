import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import {
  REMITLY_DESTINATION_COUNTRIES,
  REMITLY_SOURCE_COUNTRIES,
  REMITLY_SUPPORTED_CORRIDORS,
} from './supported-corridors'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'

export const destinationCountries = REMITLY_DESTINATION_COUNTRIES

export const sourceCountries = REMITLY_SOURCE_COUNTRIES

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'debit_card'
export const defaultPayoutMethod = 'bank_deposit'

export const corridors = REMITLY_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

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
  'cash',
]

export const payoutMethods: string[] = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
]
