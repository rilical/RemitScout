export type BucketSelection = {
  bucket_used: number
  fee_bucket_used: number
  approximate: boolean
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
    return { bucket_used: amount, fee_bucket_used: amount, approximate: true }
  }
  const normalizedAmount = Math.round(amount)
  const approximate = normalizedAmount !== amount
  return {
    bucket_used: normalizedAmount,
    fee_bucket_used: normalizedAmount,
    approximate,
  }
}
