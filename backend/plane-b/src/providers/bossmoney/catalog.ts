import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'
import {
  BOSSMONEY_DESTINATION_COUNTRIES,
  BOSSMONEY_SOURCE_COUNTRIES,
  BOSSMONEY_SUPPORTED_CORRIDORS,
} from './supported-corridors'

export const corridors = BOSSMONEY_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const sourceCountries = BOSSMONEY_SOURCE_COUNTRIES
export const destinationCountries = BOSSMONEY_DESTINATION_COUNTRIES

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const payinMethods: string[] = [
  'bank_transfer',
  'debit_card',
  'credit_card',
  'apple_pay',
]

export const payoutMethods: string[] = ['bank_deposit']

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'bank_deposit'
