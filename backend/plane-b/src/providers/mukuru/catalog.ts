import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { MUKURU_SOURCE_COUNTRIES, MUKURU_SUPPORTED_CORRIDORS } from './supported-corridors'

export const sourceCountries = MUKURU_SOURCE_COUNTRIES.map(entry => entry.code)
export const corridors = MUKURU_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'cash_pickup'

export const payinMethods: string[] = [
  'bank_transfer',
]

export const payoutMethods: string[] = [
  'bank_deposit',
  'cash_pickup',
  'mobile_wallet',
  'airtime',
]
