import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import {
  PLACID_DESTINATION_COUNTRIES,
  PLACID_SOURCE_COUNTRIES,
  PLACID_SUPPORTED_CORRIDORS,
} from './supported-corridors'
import { payinMethodMap, payoutMethodMap } from './code-map'

export const sourceCountries = PLACID_SOURCE_COUNTRIES
export const destinationCountries = PLACID_DESTINATION_COUNTRIES

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'debit_card'
export const defaultPayoutMethod = 'bank_deposit'

export const corridors = PLACID_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const codeMaps = {
  payinMethodMap,
  payoutMethodMap,
}

export const payinMethods: string[] = ['debit_card', 'bank_transfer']
export const payoutMethods: string[] = ['bank_deposit']
