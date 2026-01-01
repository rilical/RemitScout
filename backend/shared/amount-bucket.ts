export type BucketSelection = {
  bucket_used: number
  fee_bucket_used: number
  approximate: boolean
}

export const DEFAULT_AMOUNT_BUCKETS = [50, 100, 500, 1000, 3000, 10000]

export const getNearestBucket = (
  sendAmount: number,
  buckets: number[] = DEFAULT_AMOUNT_BUCKETS,
) => {
  let nearest = buckets[0]
  let smallestDelta = Math.abs(sendAmount - nearest)
  for (const bucket of buckets) {
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
  let floor = buckets[0]
  for (const bucket of buckets) {
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
  const isValid = Number.isFinite(sendAmount) && sendAmount > 0
  const amount = isValid ? sendAmount : buckets[0]
  const bucket_used = getNearestBucket(amount, buckets)
  const fee_bucket_used = getFloorBucket(amount, buckets)
  const approximate = !isValid || amount !== bucket_used
  return { bucket_used, fee_bucket_used, approximate }
}
