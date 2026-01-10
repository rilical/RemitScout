/**
 * Distributed worker lock using Redis.
 *
 * Prevents multiple instances of a worker from running simultaneously
 * by acquiring an exclusive lock in Redis. Uses SET NX (set if not exists)
 * with expiration to ensure locks are released even if a worker crashes.
 */

import { getRedisClient } from '../../../shared/redis'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.worker-lock')
const localLocks = new Map<string, { value: string; expiresAt: number }>()

/**
 * Distributed lock for worker processes.
 *
 * Ensures only one instance of a worker runs at a time across
 * multiple processes/containers.
 */
export class WorkerLock {
  private client: NonNullable<Awaited<ReturnType<typeof getRedisClient>>> | null = null
  private lockKey: string
  private lockValue: string
  private ttlSeconds: number

  /**
   * Creates a new worker lock.
   *
   * @param lockName - Unique name for the lock (e.g., 'b2c-refresh-worker')
   * @param ttlSeconds - Lock expiration time in seconds (default: 60)
   */
  constructor(lockName: string, ttlSeconds = 60) {
    this.lockKey = `worker:lock:${lockName}`
    this.lockValue = `${process.pid}_${Date.now()}`
    this.ttlSeconds = ttlSeconds
  }

  /**
   * Attempts to acquire the lock.
   *
   * Returns true if lock was acquired, false if already held by another process.
   *
   * @returns True if lock acquired, false otherwise
   */
  async acquire(): Promise<boolean> {
    try {
      this.client = await getRedisClient()
      if (!this.client) {
        if (config.env !== 'production') {
          const now = Date.now()
          const existing = localLocks.get(this.lockKey)
          if (existing && existing.expiresAt > now) {
            logger.warn('lock_already_held', { lock_key: this.lockKey, mode: 'local' })
            return false
          }
          localLocks.set(this.lockKey, { value: this.lockValue, expiresAt: now + this.ttlSeconds * 1000 })
          logger.info('lock_acquired', { lock_key: this.lockKey, ttl_seconds: this.ttlSeconds, mode: 'local' })
          return true
        }
        logger.error('lock_acquire_failed', {
          lock_key: this.lockKey,
          reason: 'redis_unavailable',
          message: 'Worker lock requires Redis. Cannot proceed without distributed locking.',
        })
        // Fail fast: return false instead of true to prevent multiple workers
        return false
      }

      const result = await this.client.set(this.lockKey, this.lockValue, {
        NX: true,
        EX: this.ttlSeconds,
      })

      const acquired = result === 'OK'
      if (acquired) {
        logger.info('lock_acquired', { lock_key: this.lockKey, ttl_seconds: this.ttlSeconds })
      } else {
        logger.warn('lock_already_held', { lock_key: this.lockKey })
      }
      return acquired
    } catch (error) {
      logger.error('lock_acquire_failed', {
        lock_key: this.lockKey,
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }

  /**
   * Extends the lock TTL if held by this instance.
   *
   * Returns true if the lock was extended, false otherwise.
   */
  async extend(ttlSeconds = this.ttlSeconds): Promise<boolean> {
    if (!this.client) {
      if (config.env === 'production') return false
      const current = localLocks.get(this.lockKey)
      if (!current || current.value !== this.lockValue) {
        logger.warn('lock_extend_skipped', {
          lock_key: this.lockKey,
          current_value: current?.value,
          expected_value: this.lockValue,
          mode: 'local',
        })
        return false
      }
      localLocks.set(this.lockKey, { value: this.lockValue, expiresAt: Date.now() + ttlSeconds * 1000 })
      logger.debug('lock_extended', { lock_key: this.lockKey, ttl_seconds: ttlSeconds, mode: 'local' })
      return true
    }

    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      logger.warn('lock_extend_invalid_ttl', {
        lock_key: this.lockKey,
        ttl_seconds: ttlSeconds,
      })
      return false
    }

    try {
      const current = await this.client.get(this.lockKey)
      if (current !== this.lockValue) {
        logger.warn('lock_extend_skipped', {
          lock_key: this.lockKey,
          current_value: current,
          expected_value: this.lockValue,
        })
        return false
      }

      const extended = await this.client.expire(this.lockKey, ttlSeconds)
      if (extended === 1) {
        logger.debug('lock_extended', { lock_key: this.lockKey, ttl_seconds: ttlSeconds })
        return true
      }

      logger.warn('lock_extend_failed', { lock_key: this.lockKey })
      return false
    } catch (error) {
      logger.error('lock_extend_failed', {
        lock_key: this.lockKey,
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }

  /**
   * Releases the lock if held by this instance.
   *
   * Only releases if the lock value matches (prevents releasing another process's lock).
   */
  async release(): Promise<void> {
    if (!this.client) {
      if (config.env === 'production') return
      const current = localLocks.get(this.lockKey)
      if (current?.value === this.lockValue) {
        localLocks.delete(this.lockKey)
        logger.info('lock_released', { lock_key: this.lockKey, mode: 'local' })
      }
      return
    }

    try {
      const current = await this.client.get(this.lockKey)
      if (current === this.lockValue) {
        await this.client.del(this.lockKey)
        logger.info('lock_released', { lock_key: this.lockKey })
      } else {
        logger.debug('lock_not_held', {
          lock_key: this.lockKey,
          current_value: current,
          expected_value: this.lockValue,
        })
      }
    } catch (error) {
      logger.error('lock_release_failed', {
        lock_key: this.lockKey,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
