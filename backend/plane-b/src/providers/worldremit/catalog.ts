import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'
import { WORLDREMIT_SUPPORTED_CORRIDORS } from './supported-corridors'

export const corridors = WORLDREMIT_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const payinMethods: string[] = ['bank_transfer', 'debit_card', 'credit_card']

export const payoutMethods: string[] = ['bank_deposit', 'cash_pickup', 'mobile_wallet', 'airtime']
