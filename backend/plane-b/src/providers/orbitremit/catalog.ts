import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'
import {
  ORBITREMIT_DESTINATION_COUNTRIES,
  ORBITREMIT_SOURCE_COUNTRIES,
  ORBITREMIT_SUPPORTED_CORRIDORS,
} from './supported-corridors'

export const corridors = ORBITREMIT_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const sourceCountries = ORBITREMIT_SOURCE_COUNTRIES
export const destinationCountries = ORBITREMIT_DESTINATION_COUNTRIES

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const payinMethods: string[] = ['bank_transfer']

export const payoutMethods: string[] = ['bank_deposit', 'cash_pickup', 'mobile_wallet']

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'bank_deposit'
