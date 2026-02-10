import type { Pool } from 'pg'

import { getRedisClient } from '../../../shared/redis'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import {
  type CircuitState,
  loadCircuitStateFromDb,
  recordCircuitClosed,
  recordCircuitHalfOpen,
  recordCircuitOpen,
} from '../collectors/base'
import { persistProviderRates } from '../collectors/rate-config'

const logger = createLogger('plane-b.redis-circuit-breaker')

const isValidCircuitState = (value: unknown): value is CircuitState => {
  return typeof value === 'string' && (value === 'open' || value === 'half_open' || value === 'closed')
}

const validateProviderId = (providerId: string, operation: string): void => {
  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    throw new Error(`Invalid provider ID in ${operation}: must be non-empty string`)
  }
}

const validateCorridorId = (corridorId: string | null, operation: string): void => {
  if (corridorId !== null && (!corridorId || typeof corridorId !== 'string' || corridorId.trim().length === 0)) {
    throw new Error(`Invalid corridor ID in ${operation}: must be null or non-empty string`)
  }
}

const buildCircuitKey = (providerId: string, corridorId: string | null): string => {
  if (corridorId) {
    return `circuit:provider:${providerId}:corridor:${corridorId}`
  }
  return `circuit:provider:${providerId}`
}

/**
 * Checks the circuit breaker state for a provider/corridor.
 *
 * Checks Redis first (fast path), then falls back to database.
 * Automatically transitions states when cooldown expires:
 * - `open` → `half_open` when cooldown expires
 * - `half_open` → `closed` when cooldown expires
 *
 * **Redis/DB Synchronization**:
 * - If found in Redis, returns immediately
 * - If not in Redis, loads from DB and syncs back to Redis
 * - DB is source of truth, Redis is cache
 *
 * @param pool - Database connection pool
 * @param providerId - Provider identifier (required, non-empty string)
 * @param corridorId - Corridor identifier (optional, null for provider-level)
 * @returns Circuit state: 'open' | 'half_open' | 'closed'
 * @throws Error if providerId or corridorId is invalid
 */
export const checkCircuitState = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null = null,
): Promise<CircuitState> => {
  validateProviderId(providerId, 'checkCircuitState')
  validateCorridorId(corridorId, 'checkCircuitState')

  const redis = await getRedisClient()
  const providerKey = buildCircuitKey(providerId, null)
  const corridorKey = corridorId ? buildCircuitKey(providerId, corridorId) : null

  if (redis) {
    try {
      if (corridorKey) {
        const corridorState = await redis.get(corridorKey)
        if (corridorState !== null) {
          if (isValidCircuitState(corridorState)) {
            return corridorState
          }
          logger.warn('invalid_circuit_state_in_redis', {
            provider_id: providerId,
            corridor_id: corridorId,
            key: corridorKey,
            value: corridorState,
          })
        }
      }
      const providerState = await redis.get(providerKey)
      if (providerState !== null) {
        if (isValidCircuitState(providerState)) {
          return providerState
        }
        logger.warn('invalid_circuit_state_in_redis', {
          provider_id: providerId,
          corridor_id: null,
          key: providerKey,
          value: providerState,
        })
      }
    } catch (error) {
      logger.error('circuit_check_redis_error', {
        provider_id: providerId,
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const halfOpenMs = config.planeB.circuitHalfOpenMs
  if (corridorId) {
    const corridorState = await loadCircuitStateFromDb(pool, providerId, corridorId, halfOpenMs)
    if (corridorState.state !== 'closed') {
      if (redis && corridorState.cooldownMs && corridorKey) {
        try {
          await redis.set(corridorKey, corridorState.state, { PX: corridorState.cooldownMs })
        } catch (error) {
          logger.error('circuit_sync_to_redis_error', {
            provider_id: providerId,
            corridor_id: corridorId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
      return corridorState.state
    }
  }

  const providerState = await loadCircuitStateFromDb(pool, providerId, null, halfOpenMs)
  if (providerState.state !== 'closed') {
    if (redis && providerState.cooldownMs) {
      try {
        await redis.set(providerKey, providerState.state, { PX: providerState.cooldownMs })
      } catch (error) {
        logger.error('circuit_sync_to_redis_error', {
          provider_id: providerId,
          corridor_id: null,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    return providerState.state
  }

  return 'closed'
}

/**
 * Opens the circuit breaker to block collection for a provider/corridor.
 *
 * Sets both Redis and Database to `open` state with cooldown TTL.
 * This prevents collection until the cooldown expires and circuit transitions to `half_open`.
 *
 * **State Persistence**:
 * - Redis: Fast cache with TTL
 * - DB: Source of truth, persistent
 *
 * **Error Handling**:
 * - Redis failures are logged but don't prevent DB update
 * - DB is always updated to ensure consistency
 *
 * @param pool - Database connection pool
 * @param providerId - Provider identifier (required)
 * @param corridorId - Corridor identifier (null for provider-level)
 * @param reason - Reason for opening circuit (e.g., 'rate_limit', 'http_403')
 * @param ttlMs - Cooldown duration in milliseconds (default: config.planeB.circuitOpenMs)
 * @throws Error if providerId or corridorId is invalid
 */
export const openCircuit = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  reason: string,
  ttlMs = config.planeB.circuitOpenMs,
): Promise<void> => {
  validateProviderId(providerId, 'openCircuit')
  validateCorridorId(corridorId, 'openCircuit')

  const key = buildCircuitKey(providerId, corridorId)
  const redis = await getRedisClient()

  if (redis) {
    try {
      await redis.set(key, 'open', { PX: ttlMs })
    } catch (error) {
      logger.error('circuit_open_redis_error', {
        provider_id: providerId,
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await recordCircuitOpen(pool, providerId, corridorId, reason, ttlMs)
  logger.warn('circuit_opened', {
    provider_id: providerId,
    corridor_id: corridorId,
    reason,
    ttl_ms: ttlMs,
    at: new Date().toISOString(),
  })
}

/**
 * Transitions circuit to half-open state for testing recovery.
 *
 * Sets both Redis and Database to `half_open` state with test TTL.
 * In this state, limited requests are allowed to test if provider has recovered.
 *
 * **Usage**:
 * - Automatically called when `open` circuit cooldown expires
 * - Collector checks if successful request in `half_open` state, then closes circuit
 *
 * @param pool - Database connection pool
 * @param providerId - Provider identifier (required)
 * @param corridorId - Corridor identifier (null for provider-level)
 * @param ttlMs - Test duration in milliseconds (default: config.planeB.circuitHalfOpenMs)
 * @throws Error if providerId or corridorId is invalid
 */
export const halfOpenCircuit = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  ttlMs = config.planeB.circuitHalfOpenMs,
): Promise<void> => {
  validateProviderId(providerId, 'halfOpenCircuit')
  validateCorridorId(corridorId, 'halfOpenCircuit')

  const key = buildCircuitKey(providerId, corridorId)
  const redis = await getRedisClient()

  if (redis) {
    try {
      await redis.set(key, 'half_open', { PX: ttlMs })
    } catch (error) {
      logger.error('circuit_half_open_redis_error', {
        provider_id: providerId,
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await recordCircuitHalfOpen(pool, providerId, corridorId, ttlMs)
  logger.info('circuit_half_opened', {
    provider_id: providerId,
    corridor_id: corridorId,
    ttl_ms: ttlMs,
    at: new Date().toISOString(),
  })
}

/**
 * Closes the circuit breaker to resume normal collection.
 *
 * Deletes Redis key and sets Database to `closed` state.
 * This allows collection to proceed normally.
 *
 * **Usage**:
 * - Called when successful request occurs in `half_open` state
 * - Automatically called when `half_open` cooldown expires
 *
 * @param pool - Database connection pool
 * @param providerId - Provider identifier (required)
 * @param corridorId - Corridor identifier (null for provider-level)
 * @throws Error if providerId or corridorId is invalid
 */
export const closeCircuit = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
): Promise<void> => {
  validateProviderId(providerId, 'closeCircuit')
  validateCorridorId(corridorId, 'closeCircuit')

  const key = buildCircuitKey(providerId, corridorId)
  const redis = await getRedisClient()

  if (redis) {
    try {
      await redis.del(key)
    } catch (error) {
      logger.error('circuit_close_redis_error', {
        provider_id: providerId,
        corridor_id: corridorId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await recordCircuitClosed(pool, providerId, corridorId)
  logger.info('circuit_closed', {
    provider_id: providerId,
    corridor_id: corridorId,
    at: new Date().toISOString(),
  })
}

/**
 * Immediately penalizes provider RPM rates by applying a penalty multiplier.
 *
 * Reduces both provider-level and per-corridor RPM rates to prevent further rate limit violations.
 * Persists new rates to database and optionally caches penalty in Redis.
 *
 * **Usage**:
 * - Called when circuit opens due to rate limit (HTTP 429)
 * - Penalty factor typically 0.5 (50% reduction) or 0.25 (75% reduction)
 * - Prevents further rate limit violations by reducing request rate
 *
 * **Behavior**:
 * - Multiplies current rates by penalty factor (e.g., 100 RPM * 0.5 = 50 RPM)
 * - Ensures minimum RPM of 1 (never reduces to 0)
 * - Persists to database immediately
 * - Caches penalty in Redis with TTL (optional)
 *
 * @param pool - Database connection pool
 * @param providerId - Provider identifier (required)
 * @param currentRates - Current RPM rates to penalize
 * @param currentRates.rpm - Provider-level RPM
 * @param currentRates.perCorridorRpm - Per-corridor RPM
 * @param penaltyFactor - Multiplier to apply (0-1, default: 0.5 = 50% reduction)
 * @param ttlMs - Penalty cache TTL in milliseconds (default: 1 hour)
 * @returns New rates after penalty, or null if validation fails
 * @throws Error if providerId is invalid
 */
export const penalizeRpmImmediately = async (
  pool: Pool,
  providerId: string,
  currentRates: { rpm: number; perCorridorRpm: number },
  penaltyFactor = 0.5,
  ttlMs = config.planeB.circuitOpenMs,
): Promise<{ rpm: number; perCorridorRpm: number } | null> => {
  validateProviderId(providerId, 'penalizeRpmImmediately')

  if (!Number.isFinite(penaltyFactor) || penaltyFactor <= 0 || penaltyFactor > 1) {
    logger.warn('penalize_rpm_invalid_factor', {
      provider_id: providerId,
      penalty_factor: penaltyFactor,
    })
    return null
  }
  if (!Number.isFinite(currentRates.rpm) || currentRates.rpm <= 0) {
    logger.warn('penalize_rpm_invalid_current_rates', {
      provider_id: providerId,
      current_rpm: currentRates.rpm,
    })
    return null
  }

  const factor = Math.min(1, penaltyFactor)
  const nextRpm = Math.max(1, Math.round(currentRates.rpm * factor))
  const perCorridorBase =
    Number.isFinite(currentRates.perCorridorRpm) && currentRates.perCorridorRpm > 0
      ? currentRates.perCorridorRpm
      : 1
  if (perCorridorBase !== currentRates.perCorridorRpm) {
    logger.warn('penalize_rpm_invalid_current_per_corridor_rpm', {
      provider_id: providerId,
      current_per_corridor_rpm: currentRates.perCorridorRpm,
    })
  }
  const nextPerCorridorRpm = Math.max(1, Math.round(perCorridorBase * factor))

  const redis = await getRedisClient()
  const key = `rpm_penalty:${providerId}`
  const expiresAt = Date.now() + ttlMs
  if (redis) {
    try {
      await redis.set(
        key,
        JSON.stringify({ factor, expires_at: expiresAt }),
        { PX: ttlMs },
      )
    } catch (error) {
      logger.error('rpm_penalty_redis_error', {
        provider_id: providerId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await persistProviderRates(pool, providerId, {
    rpm: nextRpm,
    perCorridorRpm: nextPerCorridorRpm,
  })

  logger.warn('rpm_penalty_applied', {
    provider_id: providerId,
    prev_rpm: currentRates.rpm,
    prev_per_corridor_rpm: currentRates.perCorridorRpm,
    penalty_factor: factor,
    new_rpm: nextRpm,
    new_per_corridor_rpm: nextPerCorridorRpm,
    ttl_ms: ttlMs,
    at: new Date().toISOString(),
  })

  return { rpm: nextRpm, perCorridorRpm: nextPerCorridorRpm }
}
