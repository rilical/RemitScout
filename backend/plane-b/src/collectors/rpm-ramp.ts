import type { Pool } from 'pg'

import { createLogger } from '../../../shared/logger'
import type { ProviderRates } from './rate-config'
import { persistProviderRates } from './rate-config'

export type SweepStats = {
  attemptCount: number
  successCount: number
  blockCount: number
  rateLimitCount: number
  http2xxCount: number
}

type RampOptions = {
  pool: Pool
  providerId: string
  collectorType: string
  stats: SweepStats
  rates: ProviderRates
}

const logger = createLogger('plane-b.rpm-ramp')

const isSweepCollector = (collectorType: string) =>
  collectorType === 'b2b_full_sweep'
  || collectorType === 'b2b_full_sweep_monthly'
  || collectorType === 'b2b_tier_1_alpha'
  || collectorType === 'b2b_tier_2_reference'
  || collectorType === 'b2b_tier_3_discovery'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export const applyRpmRamp = async (options: RampOptions) => {
  const { pool, providerId, collectorType, stats, rates } = options
  if (!isSweepCollector(collectorType)) {
    return
  }
  if (stats.attemptCount <= 0) {
    logger.info('rpm_ramp_skipped', { provider_id: providerId, reason: 'no_attempts' })
    return
  }
  if (!Number.isFinite(rates.rpm) || rates.rpm <= 0) {
    logger.info('rpm_ramp_skipped', { provider_id: providerId, reason: 'invalid_rpm', rpm: rates.rpm })
    return
  }

  const blockRate = stats.blockCount / stats.attemptCount
  const rateLimitRate = stats.rateLimitCount / stats.attemptCount
  const http2xxRate = stats.http2xxCount / stats.attemptCount
  const twoXXStable = http2xxRate >= 0.95

  let decision: 'increase' | 'decrease' | 'hold' = 'hold'
  let nextRpm = rates.rpm
  let changePercent = 0
  let reason = 'stable'

  if (stats.rateLimitCount > 0 || blockRate >= 0.01) {
    decision = 'decrease'
    const pressureRate = stats.rateLimitCount > 0 ? rateLimitRate : blockRate
    const normalized = clamp(pressureRate / 0.01, 0, 1)
    changePercent = 0.2 + 0.1 * normalized
    nextRpm = Math.max(1, Math.round(rates.rpm * (1 - changePercent)))
    reason = stats.rateLimitCount > 0 ? 'rate_limit' : 'block_rate'
  } else if (blockRate < 0.005 && twoXXStable) {
    decision = 'increase'
    const normalized = clamp((0.005 - blockRate) / 0.005, 0, 1)
    changePercent = 0.1 + 0.05 * normalized
    nextRpm = Math.max(1, Math.round(rates.rpm * (1 + changePercent)))
    reason = 'stable_low_block'
  }

  if (decision === 'hold' || nextRpm === rates.rpm) {
    logger.info('rpm_ramp_hold', {
      provider_id: providerId,
      rpm: rates.rpm,
      block_rate: blockRate,
      rate_limit_rate: rateLimitRate,
      http_2xx_rate: http2xxRate,
      reason,
    })
    return
  }

  await persistProviderRates(pool, providerId, {
    rpm: nextRpm,
    perCorridorRpm: rates.perCorridorRpm,
  })
  logger.info('rpm_ramp_update', {
    provider_id: providerId,
    prev_rpm: rates.rpm,
    next_rpm: nextRpm,
    change_percent: changePercent,
    block_rate: blockRate,
    rate_limit_rate: rateLimitRate,
    http_2xx_rate: http2xxRate,
    reason,
  })
}
