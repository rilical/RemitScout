import { getRedisClient } from '../../../shared/redis'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.redis-token-bucket')

const ACQUIRE_TOKEN_SCRIPT = `
  local key = KEYS[1]
  local rate = tonumber(ARGV[1])
  local capacity = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])

  local state_raw = redis.call("get", key)
  local tokens = capacity
  local last_refill = now

  if state_raw then
    local state = cjson.decode(state_raw)
    tokens = tonumber(state.tokens) or capacity
    last_refill = tonumber(state.last_refill) or now
  end

  local elapsed_ms = math.max(0, now - last_refill)
  local refill_tokens = (elapsed_ms / 60000.0) * rate
  tokens = math.min(capacity, tokens + refill_tokens)

  local wait_ms = 0
  if tokens >= requested then
    tokens = tokens - requested
  else
    local tokens_needed = requested - tokens
    if rate > 0 then
      wait_ms = math.ceil((tokens_needed / rate) * 60000)
    else
      wait_ms = 60000
    end
  end

  local time_to_full = 0
  if rate > 0 then
    time_to_full = math.ceil(((capacity - tokens) / rate) * 60000)
  else
    time_to_full = 60000
  end
  time_to_full = math.max(1000, time_to_full)

  local new_state = cjson.encode({tokens = tokens, last_refill = now})
  redis.call("set", key, new_state, "PX", time_to_full)

  if wait_ms > 0 then
    return {0, time_to_full}
  end

  return {1, 0}
`

type LocalBucketState = {
  tokens: number
  lastRefill: number
  rpm: number
  capacity: number
  burstMultiplier: number
}

const localBuckets = new Map<string, LocalBucketState>()
const warnedKeys = new Set<string>()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getLocalBucket = (key: string, rpm: number, burstMultiplier: number) => {
  const capacity = rpm * burstMultiplier
  const existing = localBuckets.get(key)
  if (existing) {
    existing.rpm = rpm
    existing.capacity = capacity
    existing.burstMultiplier = burstMultiplier
    existing.tokens = Math.min(existing.tokens, capacity)
    return existing
  }
  const bucket: LocalBucketState = {
    tokens: capacity,
    lastRefill: Date.now(),
    rpm,
    capacity,
    burstMultiplier,
  }
  localBuckets.set(key, bucket)
  return bucket
}

const refillLocalBucket = (bucket: LocalBucketState, now: number) => {
  const elapsedMs = Math.max(0, now - bucket.lastRefill)
  const refillTokens = (elapsedMs / 60000) * bucket.rpm
  bucket.tokens = Math.min(bucket.capacity, bucket.tokens + refillTokens)
  bucket.lastRefill = now
}

const acquireLocalToken = (key: string, rpm: number, burstMultiplier: number, requested: number) => {
  const bucket = getLocalBucket(key, rpm, burstMultiplier)
  const now = Date.now()
  refillLocalBucket(bucket, now)
  if (bucket.tokens >= requested) {
    bucket.tokens -= requested
    return { allowed: true, waitMs: 0 }
  }
  if (rpm <= 0) {
    return { allowed: true, waitMs: 0 }
  }
  const tokensNeeded = requested - bucket.tokens
  const waitMs = Math.ceil((tokensNeeded / rpm) * 60000)
  return { allowed: false, waitMs }
}

export class RedisTokenBucket {
  private key: string
  private rpm: number
  private burstMultiplier: number
  private useRedis: boolean

  constructor(key: string, rpm: number, burstMultiplier = 2, useRedis = true) {
    this.key = key
    this.rpm = rpm
    this.burstMultiplier = burstMultiplier
    this.useRedis = useRedis
  }

  updateRpm(rpm: number) {
    this.rpm = rpm
  }

  updateUseRedis(useRedis: boolean) {
    this.useRedis = useRedis
  }

  async acquireToken(requested = 1): Promise<void> {
    if (!Number.isFinite(this.rpm) || this.rpm <= 0) return
    while (true) {
      const result = await this.tryAcquire(requested)
      if (result.allowed) return
      const waitMs = Math.max(1, result.waitMs)
      await sleep(waitMs)
    }
  }

  private async tryAcquire(requested: number): Promise<{ allowed: boolean; waitMs: number }> {
    if (this.useRedis) {
      const redis = await getRedisClient()
      if (redis) {
        const capacity = this.rpm * this.burstMultiplier
        const now = Date.now()
        const result = await redis.eval(
          ACQUIRE_TOKEN_SCRIPT,
          {
            keys: [this.key],
            arguments: [String(this.rpm), String(capacity), String(now), String(requested)],
          },
        ) as [number, number]

        const allowed = result[0] === 1
        const waitMs = result[1] || 0
        return { allowed, waitMs }
      }
    }

    if (!warnedKeys.has(this.key)) {
      logger.warn('redis_unavailable_fallback', { key: this.key })
      warnedKeys.add(this.key)
    }
    const fallbackRpm = Math.max(1, Math.floor(this.rpm * 0.5))
    return acquireLocalToken(this.key, fallbackRpm, 1, requested)
  }
}

export const createTokenBucket = (
  providerId: string,
  corridorId: string | null,
  locale: string | null,
  rpm: number,
  useRedis = true,
  burstMultiplier = 2,
) => {
  const localeSuffix = locale ? `:${locale}` : ''
  const key = corridorId
    ? `token_bucket:corridor:${providerId}:${corridorId}${localeSuffix}`
    : `token_bucket:${providerId}${localeSuffix}`
  return new RedisTokenBucket(key, rpm, burstMultiplier, useRedis)
}
