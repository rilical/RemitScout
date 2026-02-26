import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryIdByIso2, currencyCodeByIso2, payinMethodMap, payoutMethodMap } from './code-map'
import { REMITBEE_SUPPORTED_CORRIDORS } from './supported-corridors'

export const corridors = REMITBEE_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  countryIdByIso2,
  currencyCodeByIso2,
  payinMethodMap,
  payoutMethodMap,
}

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const payinMethods = ['debit_card', 'bank_transfer', 'credit_card']

export const payoutMethods = ['bank_deposit', 'cash_pickup', 'mobile_wallet']

export const defaultPayinMethod = 'debit_card'
export const defaultPayoutMethod = 'bank_deposit'
