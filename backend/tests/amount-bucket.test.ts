import { describe, it, expect } from 'vitest'
import { computeBucketSelection } from '../shared/amount-bucket'

describe('computeBucketSelection', () => {
  it('returns nearest bucket and floor bucket', () => {
    const result = computeBucketSelection(353)
    expect(result.bucket_used).toBe(500)
    expect(result.fee_bucket_used).toBe(100)
    expect(result.approximate).toBe(true)
  })

  it('returns exact bucket without approximate flag', () => {
    const result = computeBucketSelection(500)
    expect(result.bucket_used).toBe(500)
    expect(result.fee_bucket_used).toBe(500)
    expect(result.approximate).toBe(false)
  })

  it('prefers the higher bucket on ties', () => {
    const result = computeBucketSelection(300)
    expect(result.bucket_used).toBe(500)
    expect(result.fee_bucket_used).toBe(100)
    expect(result.approximate).toBe(true)
  })

  it('handles invalid amounts', () => {
    const result = computeBucketSelection(-5)
    expect(result.bucket_used).toBe(50)
    expect(result.fee_bucket_used).toBe(50)
    expect(result.approximate).toBe(true)
  })
})
