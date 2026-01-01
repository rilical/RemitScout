import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'
import { WESTERNUNION_SUPPORTED_CORRIDORS } from './supported-corridors'

export const corridors = WESTERNUNION_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const payinMethods = ['bank_transfer', 'debit_card', 'credit_card', 'cash']

export const payoutMethods = ['cash_pickup', 'bank_deposit', 'mobile_wallet']
