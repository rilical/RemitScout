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
  thresholds?: RampThresholds
}

export type RampThresholds = {
  highBlockRate: number
  moderateBlockRate: number
  lowBlockRate: number
  http2xxStableThreshold: number
  decreaseBasePercent: number
  decreaseMaxPercent: number
  increaseBasePercent: number
  increaseMaxPercent: number
  moderateDecreasePercent: number
  successRateWeight: number
}

const DEFAULT_THRESHOLDS: RampThresholds = {
  highBlockRate: 0.01,
  moderateBlockRate: 0.005,
  lowBlockRate: 0.0,
  http2xxStableThreshold: 0.95,
  decreaseBasePercent: 0.05,
  decreaseMaxPercent: 0.3,
  increaseBasePercent: 0.05,
  increaseMaxPercent: 0.15,
  moderateDecreasePercent: 0.075,
  successRateWeight: 0.1,
}

const logger = createLogger('plane-b.rpm-ramp')

const isSweepCollector = (collectorType: string) =>
  collectorType === 'b2b_full_sweep'
  || collectorType === 'b2b_full_sweep_monthly'
  || collectorType === 'b2b_tier_1_alpha'
  || collectorType === 'b2b_tier_2_reference'
  || collectorType === 'b2b_tier_3_discovery'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0

const validateStats = (stats: SweepStats, providerId: string): void => {
  if (!isNonNegativeInteger(stats.attemptCount)) {
    throw new Error(`Invalid attemptCount: must be a non-negative integer, got ${stats.attemptCount}`)
  }
  if (!isNonNegativeInteger(stats.successCount)) {
    throw new Error(`Invalid successCount: must be a non-negative integer, got ${stats.successCount}`)
  }
  if (!isNonNegativeInteger(stats.blockCount)) {
    throw new Error(`Invalid blockCount: must be a non-negative integer, got ${stats.blockCount}`)
  }
  if (!isNonNegativeInteger(stats.rateLimitCount)) {
    throw new Error(`Invalid rateLimitCount: must be a non-negative integer, got ${stats.rateLimitCount}`)
  }
  if (!isNonNegativeInteger(stats.http2xxCount)) {
    throw new Error(`Invalid http2xxCount: must be a non-negative integer, got ${stats.http2xxCount}`)
  }

  if (stats.blockCount + stats.rateLimitCount > stats.attemptCount) {
    throw new Error(
      `Invalid stats: blockCount (${stats.blockCount}) + rateLimitCount (${stats.rateLimitCount}) > attemptCount (${stats.attemptCount})`,
    )
  }

  if (stats.http2xxCount > stats.attemptCount) {
    throw new Error(
      `Invalid stats: http2xxCount (${stats.http2xxCount}) > attemptCount (${stats.attemptCount})`,
    )
  }

  if (stats.successCount > stats.attemptCount) {
    throw new Error(
      `Invalid stats: successCount (${stats.successCount}) > attemptCount (${stats.attemptCount})`,
    )
  }
}

/**
 * Adaptive RPM (requests per minute) adjustment system for provider API collectors.
 *
 * This function adjusts rate limits based on performance metrics:
 * - Decreases RPM when blocks or rate limits are detected
 * - Increases RPM when performance is stable and block rate is low
 * - Holds RPM when conditions are moderate
 *
 * Algorithm:
 * 1. High pressure (rate limits OR blockRate >= highBlockRate): Decrease RPM
 *    - Decrease scales from basePercent to maxPercent based on pressure severity
 * 2. Moderate pressure (moderateBlockRate <= blockRate < highBlockRate): Small decrease
 *    - Applies moderateDecreasePercent reduction
 * 3. Low pressure (blockRate < moderateBlockRate AND http2xxRate >= stableThreshold): Increase RPM
 *    - Increase scales from basePercent to maxPercent based on how low block rate is
 * 4. Otherwise: Hold current RPM
 *
 * The perCorridorRpm is adjusted proportionally when rpm changes to maintain balance.
 *
 * @param options - Configuration for RPM ramp adjustment
 * @param options.pool - Database connection pool
 * @param options.providerId - Provider identifier
 * @param options.collectorType - Type of collector (only sweep collectors are adjusted)
 * @param options.stats - Performance statistics from the collection run
 * @param options.rates - Current provider rate limits
 * @param options.thresholds - Optional custom thresholds (defaults to DEFAULT_THRESHOLDS)
 */
export const applyRpmRamp = async (options: RampOptions): Promise<void> => {
  const { pool, providerId, collectorType, stats, rates, thresholds = DEFAULT_THRESHOLDS } = options

  if (!isSweepCollector(collectorType)) {
    return
  }

  try {
    validateStats(stats, providerId)
  } catch (error) {
    logger.error('rpm_ramp_validation_failed', {
      provider_id: providerId,
      error: error instanceof Error ? error.message : String(error),
      stats,
    })
    return
  }

  if (stats.attemptCount <= 0) {
    logger.info('rpm_ramp_skipped', { provider_id: providerId, reason: 'no_attempts' })
    return
  }

  if (!Number.isFinite(rates.rpm) || rates.rpm <= 0) {
    logger.info('rpm_ramp_skipped', {
      provider_id: providerId,
      reason: 'invalid_rpm',
      rpm: rates.rpm,
    })
    return
  }

  const blockRate = stats.blockCount / stats.attemptCount
  const rateLimitRate = stats.rateLimitCount / stats.attemptCount
  const http2xxRate = stats.http2xxCount / stats.attemptCount
  const successRate = stats.successCount / stats.attemptCount
  const twoXXStable = http2xxRate >= thresholds.http2xxStableThreshold

  let decision: 'increase' | 'decrease' | 'hold' = 'hold'
  let nextRpm = rates.rpm
  let nextPerCorridorRpm = rates.perCorridorRpm
  let changePercent = 0
  let reason = 'stable'

  if (stats.rateLimitCount > 0 || blockRate >= thresholds.highBlockRate) {
    decision = 'decrease'
    const pressureRate = stats.rateLimitCount > 0 ? rateLimitRate : blockRate
    const normalized = clamp(
      pressureRate / thresholds.highBlockRate,
      0,
      1,
    )
    changePercent =
      thresholds.decreaseBasePercent +
      (thresholds.decreaseMaxPercent - thresholds.decreaseBasePercent) * normalized
    nextRpm = Math.max(1, Math.round(rates.rpm * (1 - changePercent)))
    reason = stats.rateLimitCount > 0 ? 'rate_limit' : 'block_rate_high'
  } else if (
    blockRate >= thresholds.moderateBlockRate &&
    blockRate < thresholds.highBlockRate &&
    stats.rateLimitCount === 0
  ) {
    decision = 'decrease'
    changePercent = thresholds.moderateDecreasePercent
    nextRpm = Math.max(1, Math.round(rates.rpm * (1 - changePercent)))
    reason = 'block_rate_moderate'
  } else if (blockRate < thresholds.moderateBlockRate && twoXXStable) {
    decision = 'increase'
    const normalized = clamp(
      (thresholds.moderateBlockRate - blockRate) / thresholds.moderateBlockRate,
      0,
      1,
    )
    const baseIncrease = thresholds.increaseBasePercent + thresholds.increaseMaxPercent * normalized
    const successBonus =
      successRate > 0.9 ? thresholds.successRateWeight * (successRate - 0.9) * 10 : 0
    changePercent = Math.min(thresholds.increaseMaxPercent, baseIncrease + successBonus)
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
      success_rate: successRate,
      reason,
    })
    return
  }

  const rpmRatio = nextRpm / rates.rpm
  if (rates.perCorridorRpm > 0) {
    nextPerCorridorRpm = Math.max(1, Math.round(rates.perCorridorRpm * rpmRatio))
  }

  try {
    await persistProviderRates(pool, providerId, {
      rpm: nextRpm,
      perCorridorRpm: nextPerCorridorRpm,
    })
    logger.info('rpm_ramp_update', {
      provider_id: providerId,
      prev_rpm: rates.rpm,
      next_rpm: nextRpm,
      prev_per_corridor_rpm: rates.perCorridorRpm,
      next_per_corridor_rpm: nextPerCorridorRpm,
      change_percent: changePercent,
      block_rate: blockRate,
      rate_limit_rate: rateLimitRate,
      http_2xx_rate: http2xxRate,
      success_rate: successRate,
      reason,
      decision,
    })
  } catch (error) {
    logger.error('rpm_ramp_persistence_failed', {
      provider_id: providerId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      next_rpm: nextRpm,
      next_per_corridor_rpm: nextPerCorridorRpm,
      prev_rpm: rates.rpm,
      prev_per_corridor_rpm: rates.perCorridorRpm,
    })
  }
}
