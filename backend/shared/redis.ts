import { createClient } from 'redis'

import { config } from './config'
import { createLogger } from './logger'
import { registerRedisClient } from './connection-manager'
import {
  trackConnectionAttempt,
  trackConnectionFailure,
  trackReconnection,
} from './redis-metrics'

const logger = createLogger('shared.redis')

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
type RedisClient = ReturnType<typeof createClient>

let client: RedisClient | null = null
let connecting: Promise<RedisClient | null> | null = null
let lastHealthCheck: number = 0
let connectionGeneration = 0
const HEALTH_CHECK_INTERVAL_MS = 30000

const isElastiCacheCluster = (url: string): boolean => {
  return url.includes('.cluster.') && url.includes('.cache.amazonaws.com')
}

const redactRedisUrl = (raw: string): string => {
  try {
    const parsed = new URL(raw)
    const port = parsed.port ? `:${parsed.port}` : ''
    return `${parsed.protocol}//${parsed.hostname}${port}`
  } catch (error) {
    logger.debug('redis_url_redaction_parse_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return 'redis://[redacted]'
  }
}

const checkConnectionHealth = async (
  instance: RedisClient,
): Promise<{ ok: boolean; reason?: string }> => {
  try {
    const pong = await Promise.race([
      instance.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PING timeout')), 5000),
      ),
    ])
    return pong === 'PONG' ? { ok: true } : { ok: false, reason: `unexpected_pong:${pong}` }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    logger.warn('redis_health_check_failed', { error: reason })
    return { ok: false, reason }
  }
}

const setupReconnection = (instance: RedisClient): void => {
  instance.on('error', (error) => {
    logger.error('redis_error', { error })
    client = null
  })

  instance.on('reconnecting', () => {
    logger.info('redis_reconnecting')
    trackReconnection()
  })

  instance.on('ready', () => {
    logger.info('redis_ready')
    lastHealthCheck = Date.now()
  })

  instance.on('end', () => {
    logger.warn('redis_connection_ended', { url: redactRedisUrl(config.redis.url) })
    client = null
  })
}

const closeInstance = async (instance: RedisClient): Promise<void> => {
  try {
    await instance.quit().catch(() => {
      instance.disconnect()
    })
  } catch (error) {
    logger.debug('redis_instance_close_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const createConnection = (): Promise<RedisClient | null> => {
  const isCluster = isElastiCacheCluster(config.redis.url)
  logger.debug('creating_redis_client', {
    is_lambda: isLambda,
    is_cluster: isCluster,
    url: redactRedisUrl(config.redis.url),
  })

  const instance = createClient({
    url: config.redis.url,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('redis_reconnect_exhausted', { retries })
          return new Error('Redis reconnection exhausted')
        }
        const delay = Math.min(retries * 100, 3000)
        logger.debug('redis_reconnect_attempt', { retries, delay_ms: delay })
        return delay
      },
    },
  })

  setupReconnection(instance)

  const generation = ++connectionGeneration
  connecting = instance
    .connect()
    .then(async () => {
      if (generation !== connectionGeneration) {
        await closeInstance(instance)
        return null
      }
      const healthy = await checkConnectionHealth(instance)
      if (!healthy.ok) {
        logger.error('redis_connect_health_check_failed', { error: healthy.reason ?? 'unknown' })
        trackConnectionAttempt(false)
        trackConnectionFailure()
        await closeInstance(instance)
        if (generation === connectionGeneration) {
          connecting = null
        }
        return null
      }

      client = instance
      lastHealthCheck = Date.now()
      registerRedisClient(instance, 'default')
      trackConnectionAttempt(true)
      logger.info('redis_connected', {
        is_lambda: isLambda,
        is_cluster: isCluster,
      })
      if (generation === connectionGeneration) {
        connecting = null
      }
      return instance
    })
    .catch((error) => {
      if (generation !== connectionGeneration) {
        return null
      }
      logger.error('redis_connect_failed', { error })
      trackConnectionAttempt(false)
      trackConnectionFailure()
      connecting = null
      return null
    })

  return connecting
}

export const getRedisClient = (): Promise<RedisClient | null> => {
  if (!config.redis.url) return Promise.resolve(null)

  if (client) {
    const now = Date.now()
    if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL_MS) {
      const instance = client
      return checkConnectionHealth(instance)
        .then(async (healthy) => {
          if (!healthy.ok) {
            logger.warn('redis_client_unhealthy_resetting', {
              reason: healthy.reason ?? 'unknown',
            })
            await closeInstance(instance)
            client = null
            connecting = null
            lastHealthCheck = 0
          } else {
            lastHealthCheck = now
          }

          if (client) {
            return client
          }

          if (connecting) {
            return connecting
          }

          return createConnection()
        })
        .catch((error) => {
          logger.warn('redis_health_check_then_failed', {
            error: error instanceof Error ? error.message : String(error),
          })
          return createConnection()
        })
    }
    return Promise.resolve(client)
  }

  if (connecting) {
    return connecting
  }

  return createConnection()
}

export const disconnectRedis = async (): Promise<void> => {
  connectionGeneration += 1
  if (client) {
    try {
      await client.quit()
    } catch (error) {
      logger.warn('redis_quit_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      try {
        client.disconnect()
      } catch (disconnectError) {
        logger.debug('redis_disconnect_after_quit_failed', {
          error: disconnectError instanceof Error ? disconnectError.message : String(disconnectError),
        })
      }
    }
    client = null
    connecting = null
  }
  lastHealthCheck = 0
}

export const resetRedisState = (): void => {
  connectionGeneration += 1
  client = null
  connecting = null
  lastHealthCheck = 0
}
