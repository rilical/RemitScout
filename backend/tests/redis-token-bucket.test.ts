import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RedisTokenBucket } from '../shared/redis-token-bucket'
import * as redisModule from '../shared/redis'

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn(),
}))

describe('RedisTokenBucket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
  })

  it('throws when maxWaitMs is exceeded', async () => {
    const bucket = new RedisTokenBucket('test-bucket-timeout', 1, 1, true)

    await bucket.acquireToken(1)

    await expect(bucket.acquireToken(1, 0)).rejects.toThrow('token_bucket_timeout')
  })
})
