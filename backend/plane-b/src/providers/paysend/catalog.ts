import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'
import { PAYSEND_SUPPORTED_CORRIDORS } from './supported-corridors'

export const corridors = PAYSEND_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const payinMethods: string[] = ['debit_card', 'credit_card', 'bank_transfer']

export const payoutMethods: string[] = ['bank_deposit', 'debit_card', 'cash_pickup', 'mobile_wallet']

export const defaultPayinMethod = 'debit_card'
export const defaultPayoutMethod = 'bank_deposit'
