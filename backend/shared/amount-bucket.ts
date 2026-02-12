import { parseCorridorId } from './corridor'
import { FIXED_EXCHANGE_RATES } from './currency-limits'
import { B2B_FIXED_AMOUNT_USD } from './macro-corridors'

export type BucketSelection = {
  bucket_used: number
  fee_bucket_used: number
  approximate: boolean
  delta_pct: number | null
}

export const DEFAULT_AMOUNT_BUCKETS = [50, 100, 500, 1000, 3000, 10000]

export const normalizeAmountBucket = (
  amount: number,
  fallback: number = 500,
): number => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return Math.max(1, Math.round(fallback))
  }
  return Math.round(amount)
}

const getValidBuckets = (buckets: number[]) => buckets.filter((bucket) => Number.isFinite(bucket) && bucket > 0)

export const getNearestBucket = (
  sendAmount: number,
  buckets: number[] = DEFAULT_AMOUNT_BUCKETS,
) => {
  const validBuckets = getValidBuckets(buckets)
  if (!validBuckets.length) return sendAmount
  let nearest = validBuckets[0]
  let smallestDelta = Math.abs(sendAmount - nearest)
  for (const bucket of validBuckets) {
    const delta = Math.abs(sendAmount - bucket)
    if (delta < smallestDelta || (delta === smallestDelta && bucket > nearest)) {
      smallestDelta = delta
      nearest = bucket
    }
  }
  return nearest
}

export const getFloorBucket = (
  sendAmount: number,
  buckets: number[] = DEFAULT_AMOUNT_BUCKETS,
) => {
  const validBuckets = getValidBuckets(buckets)
  if (!validBuckets.length) return sendAmount
  let floor = validBuckets[0]
  for (const bucket of validBuckets) {
    if (bucket <= sendAmount) {
      floor = bucket
    }
  }
  return floor
}

export const computeBucketSelection = (
  sendAmount: number,
  buckets: number[] = DEFAULT_AMOUNT_BUCKETS,
): BucketSelection => {
  const validBuckets = getValidBuckets(buckets)
  const fallbackBucket = validBuckets[0] ?? 0
  const isValid = Number.isFinite(sendAmount) && sendAmount > 0
  const amount = isValid ? sendAmount : fallbackBucket
  if (!isValid) {
    return { bucket_used: amount, fee_bucket_used: amount, approximate: true, delta_pct: null }
  }
  const bucket = validBuckets.length ? getNearestBucket(amount, validBuckets) : Math.round(amount)
  const approximate = bucket !== amount
  const deltaPct = approximate && amount > 0 ? Math.abs(bucket - amount) / amount : 0
  return {
    bucket_used: bucket,
    fee_bucket_used: bucket,
    approximate,
    delta_pct: Number.isFinite(deltaPct) ? deltaPct : null,
  }
}

/**
 * B2B bucket selection is fixed to a USD baseline, converted to the sending currency.
 * This keeps exports and indices consistent across currencies while preserving a stable "size".
 */
export const getB2bAmountBucket = (corridorId: string): number => {
  const parsed = parseCorridorId(corridorId)
  if (!parsed) return B2B_FIXED_AMOUNT_USD
  const sourceCurrency = parsed.sourceCurrency.toUpperCase()
  if (sourceCurrency === 'USD') return B2B_FIXED_AMOUNT_USD
  const rate = FIXED_EXCHANGE_RATES[sourceCurrency]
  if (!rate || rate <= 0) return B2B_FIXED_AMOUNT_USD
  return Math.round(B2B_FIXED_AMOUNT_USD * rate)
}
