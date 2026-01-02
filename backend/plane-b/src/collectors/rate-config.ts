import type { Pool } from 'pg'

import { getRedisClient } from '../../../shared/redis'
import { createLogger } from '../../../shared/logger'
import { ProviderRateRepository } from '../repositories'

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
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    throw new Error('providerId must be a non-empty string')
  }

  if (!isPositiveNumber(defaults.rpm)) {
    throw new Error('defaults.rpm must be a positive number')
  }

  if (!isPositiveNumber(defaults.perCorridorRpm)) {
    throw new Error('defaults.perCorridorRpm must be a positive number')
  }

  if (overrides.rpm !== undefined && !isPositiveNumber(overrides.rpm)) {
    throw new Error('overrides.rpm must be a positive number if provided')
  }

  if (overrides.perCorridorRpm !== undefined && !isPositiveNumber(overrides.perCorridorRpm)) {
    throw new Error('overrides.perCorridorRpm must be a positive number if provided')
  }

  const repo = new ProviderRateRepository(pool)
  let row: { rpm?: number; per_corridor_rpm?: number } | null = null

  try {
    row = await repo.getRates(providerId)
  } catch (error) {
    logger.error('rate_resolution_db_error', {
      provider_id: providerId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  const rpm = isPositiveNumber(row?.rpm) ? row.rpm : defaults.rpm
  const perCorridorRpm = isPositiveNumber(row?.per_corridor_rpm)
    ? row.per_corridor_rpm
    : defaults.perCorridorRpm
  const rates: ProviderRates = {
    rpm,
    perCorridorRpm,
    source: row ? 'db' : 'default',
  }

  if (!row) {
    logger.info('rate_resolution_using_defaults', {
      provider_id: providerId,
      rpm,
      per_corridor_rpm: perCorridorRpm,
    })
  }

  if (isPositiveNumber(overrides.rpm)) {
    rates.rpm = Math.max(1, Math.round(overrides.rpm))
    rates.source = 'override'
    logger.info('rate_resolution_applying_override', {
      provider_id: providerId,
      field: 'rpm',
      value: rates.rpm,
    })
  }
  if (isPositiveNumber(overrides.perCorridorRpm)) {
    rates.perCorridorRpm = Math.max(1, Math.round(overrides.perCorridorRpm))
    rates.source = 'override'
    logger.info('rate_resolution_applying_override', {
      provider_id: providerId,
      field: 'perCorridorRpm',
      value: rates.perCorridorRpm,
    })
  }

  const redis = await getRedisClient()
  if (redis) {
    try {
      const penaltyRaw = await redis.get(`rpm_penalty:${providerId}`)
      if (penaltyRaw) {
        let penalty: { factor?: number; expires_at?: number }
        try {
          penalty = JSON.parse(penaltyRaw) as { factor?: number; expires_at?: number }
        } catch (parseError) {
          logger.warn('rpm_penalty_parse_error', {
            provider_id: providerId,
            error: parseError instanceof Error ? parseError.message : String(parseError),
          })
          return rates
        }

        if (
          typeof penalty.factor !== 'number' ||
          !Number.isFinite(penalty.factor) ||
          penalty.factor <= 0
        ) {
          logger.warn('rpm_penalty_invalid_factor', {
            provider_id: providerId,
            factor: penalty.factor,
          })
          return rates
        }

        const factor = Math.min(1, penalty.factor)
        const expiresAt =
          typeof penalty.expires_at === 'number' && Number.isFinite(penalty.expires_at)
            ? penalty.expires_at
            : undefined

        if (isPositiveNumber(factor) && (!expiresAt || expiresAt > Date.now())) {
          const previousRpm = rates.rpm
          const previousPerCorridorRpm = rates.perCorridorRpm
          rates.rpm = Math.max(1, Math.round(rates.rpm * factor))
          if (rates.perCorridorRpm > 0) {
            rates.perCorridorRpm = Math.max(1, Math.round(rates.perCorridorRpm * factor))
          }
          rates.source = 'redis_penalty'
          logger.info('rate_resolution_applying_penalty', {
            provider_id: providerId,
            factor,
            expires_at: expiresAt,
            previous_rpm: previousRpm,
            previous_per_corridor_rpm: previousPerCorridorRpm,
            new_rpm: rates.rpm,
            new_per_corridor_rpm: rates.perCorridorRpm,
          })
        }
      }
    } catch (error) {
      logger.warn('rpm_penalty_read_error', {
        provider_id: providerId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  logger.debug('rate_resolution_complete', {
    provider_id: providerId,
    rpm: rates.rpm,
    per_corridor_rpm: rates.perCorridorRpm,
    source: rates.source,
  })

  return rates
}

export const persistProviderRates = async (
  pool: Pool,
  providerId: string,
  rates: { rpm: number; perCorridorRpm: number },
) => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    throw new Error('providerId must be a non-empty string')
  }

  if (!isPositiveNumber(rates.rpm)) {
    throw new Error('rates.rpm must be a positive number')
  }

  if (!isPositiveNumber(rates.perCorridorRpm)) {
    throw new Error('rates.perCorridorRpm must be a positive number')
  }

  const repo = new ProviderRateRepository(pool)
  try {
    await repo.upsertRates({
      providerId,
      rpm: rates.rpm,
      perCorridorRpm: rates.perCorridorRpm,
    })
  } catch (error) {
    logger.error('rate_persistence_failed', {
      provider_id: providerId,
      rpm: rates.rpm,
      per_corridor_rpm: rates.perCorridorRpm,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}
