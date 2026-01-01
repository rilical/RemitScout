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

const buildCircuitKey = (providerId: string, corridorId: string | null) => {
  if (corridorId) {
    return `circuit:provider:${providerId}:corridor:${corridorId}`
  }
  return `circuit:provider:${providerId}`
}

export const checkCircuitState = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null = null,
): Promise<CircuitState> => {
  const redis = await getRedisClient()
  const providerKey = buildCircuitKey(providerId, null)
  const corridorKey = corridorId ? buildCircuitKey(providerId, corridorId) : null

  if (redis) {
    try {
      if (corridorKey) {
        const corridorState = await redis.get(corridorKey)
        if (corridorState) return corridorState as CircuitState
      }
      const providerState = await redis.get(providerKey)
      if (providerState) return providerState as CircuitState
    } catch (error) {
      logger.error('circuit_check_error', { provider_id: providerId, corridor_id: corridorId, error })
    }
  }

  const halfOpenMs = config.planeB.circuitHalfOpenMs
  if (corridorId) {
    const corridorState = await loadCircuitStateFromDb(pool, providerId, corridorId, halfOpenMs)
    if (corridorState.state !== 'closed') {
      if (redis && corridorState.cooldownMs) {
        await redis.set(corridorKey as string, corridorState.state, { PX: corridorState.cooldownMs })
      }
      return corridorState.state
    }
  }

  const providerState = await loadCircuitStateFromDb(pool, providerId, null, halfOpenMs)
  if (providerState.state !== 'closed') {
    if (redis && providerState.cooldownMs) {
      await redis.set(providerKey, providerState.state, { PX: providerState.cooldownMs })
    }
    return providerState.state
  }

  return 'closed'
}

export const openCircuit = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  reason: string,
  ttlMs = config.planeB.circuitOpenMs,
): Promise<void> => {
  const key = buildCircuitKey(providerId, corridorId)
  const redis = await getRedisClient()

  if (redis) {
    try {
      await redis.set(key, 'open', { PX: ttlMs })
    } catch (error) {
      logger.error('circuit_open_error', { provider_id: providerId, corridor_id: corridorId, error })
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

export const halfOpenCircuit = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
  ttlMs = config.planeB.circuitHalfOpenMs,
): Promise<void> => {
  const key = buildCircuitKey(providerId, corridorId)
  const redis = await getRedisClient()

  if (redis) {
    try {
      await redis.set(key, 'half_open', { PX: ttlMs })
    } catch (error) {
      logger.error('circuit_half_open_error', { provider_id: providerId, corridor_id: corridorId, error })
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

export const closeCircuit = async (
  pool: Pool,
  providerId: string,
  corridorId: string | null,
): Promise<void> => {
  const key = buildCircuitKey(providerId, corridorId)
  const redis = await getRedisClient()

  if (redis) {
    try {
      await redis.del(key)
    } catch (error) {
      logger.error('circuit_close_error', { provider_id: providerId, corridor_id: corridorId, error })
    }
  }

  await recordCircuitClosed(pool, providerId, corridorId)
  logger.info('circuit_closed', {
    provider_id: providerId,
    corridor_id: corridorId,
    at: new Date().toISOString(),
  })
}

export const penalizeRpmImmediately = async (
  pool: Pool,
  providerId: string,
  currentRates: { rpm: number; perCorridorRpm: number },
  penaltyFactor = 0.5,
  ttlMs = 60 * 60 * 1000,
): Promise<{ rpm: number; perCorridorRpm: number } | null> => {
  if (!Number.isFinite(penaltyFactor) || penaltyFactor <= 0) {
    return null
  }
  if (!Number.isFinite(currentRates.rpm) || currentRates.rpm <= 0) {
    return null
  }

  const factor = Math.min(1, penaltyFactor)
  const nextRpm = Math.max(1, Math.round(currentRates.rpm * factor))
  const nextPerCorridorRpm = currentRates.perCorridorRpm > 0
    ? Math.max(1, Math.round(currentRates.perCorridorRpm * factor))
    : currentRates.perCorridorRpm

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
      logger.error('rpm_penalty_error', { provider_id: providerId, error })
    }
  }

  await persistProviderRates(pool, providerId, {
    rpm: nextRpm,
    perCorridorRpm: nextPerCorridorRpm,
  })

  logger.warn('rpm_penalty_applied', {
    provider_id: providerId,
    prev_rpm: currentRates.rpm,
    penalty_factor: factor,
    new_rpm: nextRpm,
    ttl_ms: ttlMs,
    at: new Date().toISOString(),
  })

  return { rpm: nextRpm, perCorridorRpm: nextPerCorridorRpm }
}
