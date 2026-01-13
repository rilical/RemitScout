import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'
import { KORONAPAY_SUPPORTED_CORRIDORS } from './supported-corridors'

export const corridors = KORONAPAY_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const payinMethods = ['debit_card', 'credit_card']

export const payoutMethods = ['bank_deposit', 'cash_pickup']

export const defaultPayinMethod = 'debit_card'
export const defaultPayoutMethod = 'bank_deposit'
