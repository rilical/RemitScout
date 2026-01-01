import { createLogger } from '../../../shared/logger'
import { RedisTokenBucket } from '../lib/redis-token-bucket'

type SchedulerOptions = {
  providerId: string
  rpm: number
  perCorridorRpm: number
  baseDelayMs?: number
  jitterMs?: number
  globalEnabled?: boolean
  locale?: string
  perLocale?: boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const logger = createLogger('plane-b.collectors.scheduler')

export const createScheduler = (options: SchedulerOptions) => {
  const {
    providerId,
    globalEnabled = false,
    locale,
    perLocale = false,
  } = options
  let rpm = options.rpm
  let perCorridorRpm = options.perCorridorRpm
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 0)
  const jitterMs = Math.max(0, options.jitterMs ?? 0)
  const tokenBuckets = new Map<string, RedisTokenBucket>()

  const buildProviderKey = () => {
    const localeSuffix = perLocale && locale ? `:${locale}` : ''
    return `token_bucket:${providerId}${localeSuffix}`
  }

  const buildCorridorKey = (corridorId: string) => {
    const localeSuffix = perLocale && locale ? `:${locale}` : ''
    return `token_bucket:corridor:${providerId}:${corridorId}${localeSuffix}`
  }

  const getBucket = (key: string, currentRpm: number) => {
    const existing = tokenBuckets.get(key)
    if (existing) {
      existing.updateRpm(currentRpm)
      existing.updateUseRedis(globalEnabled)
      return existing
    }
    const bucket = new RedisTokenBucket(key, currentRpm, 2, globalEnabled)
    tokenBuckets.set(key, bucket)
    return bucket
  }

  const waitForSlot = async (
    corridorId: string,
    extraDelayMs = 0,
    extraJitterMs = 0,
  ) => {
    if (perCorridorRpm > 0) {
      const corridorBucket = getBucket(buildCorridorKey(corridorId), perCorridorRpm)
      await corridorBucket.acquireToken()
    }

    if (rpm > 0) {
      const providerBucket = getBucket(buildProviderKey(), rpm)
      await providerBucket.acquireToken()
    }

    const jitter = jitterMs > 0 ? Math.floor(Math.random() * jitterMs) : 0
    const penaltyJitter = extraJitterMs > 0 ? Math.floor(Math.random() * extraJitterMs) : 0
    const waitMs = baseDelayMs + jitter + extraDelayMs + penaltyJitter
    if (waitMs > 0) {
      await sleep(waitMs)
    }
    return waitMs
  }

  const updateRates = (nextRpm: number, nextPerCorridorRpm: number) => {
    rpm = nextRpm
    perCorridorRpm = nextPerCorridorRpm
    logger.info('scheduler_rates_updated', {
      provider_id: providerId,
      rpm,
      per_corridor_rpm: perCorridorRpm,
    })
  }

  return {
    waitForSlot,
    updateRates,
  }
}
