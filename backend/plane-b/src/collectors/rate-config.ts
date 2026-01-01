import type { Pool } from 'pg'

import { query } from '../../../shared/db'
import { getRedisClient } from '../../../shared/redis'
import { createLogger } from '../../../shared/logger'

type ProviderRateConfigRow = {
  provider_id: string
  rpm: number | null
  per_corridor_rpm: number | null
}

export type ProviderRates = {
  rpm: number
  perCorridorRpm: number
  source: 'default' | 'db' | 'override' | 'redis_penalty'
}

type ProviderRateDefaults = {
  rpm: number
  perCorridorRpm: number
}

type ProviderRateOverrides = {
  rpm?: number
  perCorridorRpm?: number
}

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const logger = createLogger('plane-b.rate-config')

export const resolveProviderRates = async (
  pool: Pool,
  providerId: string,
  defaults: ProviderRateDefaults,
  overrides: ProviderRateOverrides = {},
): Promise<ProviderRates> => {
  const result = await query<ProviderRateConfigRow>(
    `SELECT provider_id, rpm, per_corridor_rpm
       FROM silver.provider_rate_config
      WHERE provider_id = $1`,
    [providerId],
    pool,
  )
  const row = result.rows[0]
  const rpm = isPositiveNumber(row?.rpm) ? row.rpm : defaults.rpm
  const perCorridorRpm = isPositiveNumber(row?.per_corridor_rpm)
    ? row.per_corridor_rpm
    : defaults.perCorridorRpm
  const rates: ProviderRates = {
    rpm,
    perCorridorRpm,
    source: row ? 'db' : 'default',
  }
  if (isPositiveNumber(overrides.rpm)) {
    rates.rpm = Math.max(1, Math.round(overrides.rpm))
    rates.source = 'override'
  }
  if (isPositiveNumber(overrides.perCorridorRpm)) {
    rates.perCorridorRpm = Math.max(1, Math.round(overrides.perCorridorRpm))
    rates.source = 'override'
  }

  const redis = await getRedisClient()
  if (redis) {
    try {
      const penaltyRaw = await redis.get(`rpm_penalty:${providerId}`)
      if (penaltyRaw) {
        const penalty = JSON.parse(penaltyRaw) as {
          factor?: number
          expires_at?: number
        }
        const factor = typeof penalty.factor === 'number'
          ? Math.min(1, penalty.factor)
          : undefined
        const expiresAt = penalty.expires_at
        if (isPositiveNumber(factor) && (!expiresAt || expiresAt > Date.now())) {
          rates.rpm = Math.max(1, Math.round(rates.rpm * factor))
          if (rates.perCorridorRpm > 0) {
            rates.perCorridorRpm = Math.max(1, Math.round(rates.perCorridorRpm * factor))
          }
          rates.source = 'redis_penalty'
        }
      }
    } catch (error) {
      logger.warn('rpm_penalty_read_error', { provider_id: providerId, error })
    }
  }

  return rates
}

export const persistProviderRates = async (
  pool: Pool,
  providerId: string,
  rates: { rpm: number; perCorridorRpm: number },
) => {
  await query(
    `INSERT INTO silver.provider_rate_config
     (provider_id, rpm, per_corridor_rpm, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (provider_id) DO UPDATE SET
       rpm = EXCLUDED.rpm,
       per_corridor_rpm = EXCLUDED.per_corridor_rpm,
       updated_at = NOW()`,
    [providerId, rates.rpm, rates.perCorridorRpm],
    pool,
  )
}
