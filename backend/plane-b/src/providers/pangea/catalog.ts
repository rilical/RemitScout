import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { countryCodeMap, currencyCodeMap, payinMethodMap, payoutMethodMap } from './code-map'
import {
  PANGEA_DESTINATION_COUNTRIES,
  PANGEA_SOURCE_COUNTRIES,
  PANGEA_SUPPORTED_CORRIDORS,
} from './supported-corridors'

export const corridors = PANGEA_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const sourceCountries = PANGEA_SOURCE_COUNTRIES
export const destinationCountries = PANGEA_DESTINATION_COUNTRIES

export const codeMaps = {
  countryCodeMap,
  currencyCodeMap,
  payinMethodMap,
  payoutMethodMap,
}

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const payinMethods: string[] = ['bank_transfer']

export const payoutMethods: string[] = ['bank_deposit']

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'bank_deposit'
