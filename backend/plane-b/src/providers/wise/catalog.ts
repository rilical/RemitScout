import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'
import { WISE_SUPPORTED_CORRIDORS } from './supported-corridors'

export const corridors = WISE_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

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
  'google_pay',
  'cash',
]

export const payoutMethods: string[] = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
  'airtime',
]
