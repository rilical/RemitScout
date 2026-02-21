import type { Pool } from 'pg';
import { type CircuitState } from '../collectors/base';
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
export declare const checkCircuitState: (pool: Pool, providerId: string, corridorId?: string | null) => Promise<CircuitState>;
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
export declare const openCircuit: (pool: Pool, providerId: string, corridorId: string | null, reason: string, ttlMs?: number) => Promise<void>;
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
export declare const halfOpenCircuit: (pool: Pool, providerId: string, corridorId: string | null, ttlMs?: number) => Promise<void>;
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
export declare const closeCircuit: (pool: Pool, providerId: string, corridorId: string | null) => Promise<void>;
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
export declare const penalizeRpmImmediately: (pool: Pool, providerId: string, currentRates: {
    rpm: number;
    perCorridorRpm: number;
}, penaltyFactor?: number, ttlMs?: number) => Promise<{
    rpm: number;
    perCorridorRpm: number;
} | null>;
