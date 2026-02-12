import { config } from './config'
import { RedisTokenBucket } from './redis-token-bucket'

let oandaTokenBucket: RedisTokenBucket | null = null
let oandaTokenBucketConfig: { rpm: number; burstMultiplier: number } | null = null

export const getOandaTokenBucket = () => {
  const rpm = config.fxRates?.oandaRpm ?? 60
  const burstMultiplier = config.fxRates?.oandaBurstMultiplier ?? 2
  if (
    !oandaTokenBucket ||
    !oandaTokenBucketConfig ||
    oandaTokenBucketConfig.rpm !== rpm ||
    oandaTokenBucketConfig.burstMultiplier !== burstMultiplier
  ) {
    oandaTokenBucket = new RedisTokenBucket('token_bucket:oanda', rpm, burstMultiplier, true)
    oandaTokenBucketConfig = { rpm, burstMultiplier }
  } else {
    oandaTokenBucket.updateRpm(rpm)
  }
  return oandaTokenBucket
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const parseRetryAfterMs = (value: string | null): number | null => {
  if (!value) return null
  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && asNumber >= 0) {
    return Math.round(asNumber * 1000)
  }
  const parsedDate = Date.parse(value)
  if (!Number.isNaN(parsedDate)) {
    return Math.max(0, parsedDate - Date.now())
  }
  return null
}

export const computeBackoffMs = (attempt: number, retryAfterMs?: number | null): number => {
  const baseMs = Math.max(0, config.fxRates?.oandaRateLimitBackoffMs ?? 1000)
  const maxMs = Math.max(baseMs, config.fxRates?.oandaRateLimitBackoffMaxMs ?? 10000)
  const jitterMs = Math.max(0, config.fxRates?.oandaRateLimitJitterMs ?? 250)
  const exponential = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attempt)))
  const jitter = jitterMs > 0 ? Math.floor(Math.random() * jitterMs) : 0
  const computed = exponential + jitter
  return Math.max(retryAfterMs ?? 0, computed)
}
