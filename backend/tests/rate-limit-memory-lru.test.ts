import { describe, expect, it } from 'vitest'
import { createMemoryLimiterStore } from '../plane-a/src/plugins/rate-limit-redis'

describe('rate-limit memory fallback', () => {
  it('bounds key growth with an LRU cache', () => {
    const store = createMemoryLimiterStore(60_000, { maxKeys: 1000 })

    for (let i = 0; i < 5000; i++) {
      store.getOrIncrement(`k_${i}`)
    }

    expect(store.size()).toBeLessThanOrEqual(1000)
  })
})

