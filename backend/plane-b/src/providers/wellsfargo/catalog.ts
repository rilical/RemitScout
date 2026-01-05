import { DEFAULT_AMOUNT_BUCKETS } from '../../../../shared/amount-bucket'
import { WELLSFARGO_SUPPORTED_CORRIDORS } from './supported-corridors'

export const amountBuckets = DEFAULT_AMOUNT_BUCKETS

export const defaultPayinMethod = 'bank_transfer'
export const defaultPayoutMethod = 'bank_deposit'

export const corridors = WELLSFARGO_SUPPORTED_CORRIDORS
export const corridorSource = 'provider_corridor_capability'

export const payinMethods: string[] = ['bank_transfer']
export const payoutMethods: string[] = ['bank_deposit']

