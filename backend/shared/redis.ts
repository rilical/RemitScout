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
const LAMBDA_CONTAINER_REUSE_KEY = 'lambda_container_reuse'

type RedisClient = ReturnType<typeof createClient>

let client: RedisClient | null = null
let connecting: Promise<RedisClient | null> | null = null
let lastHealthCheck: number = 0
const HEALTH_CHECK_INTERVAL_MS = 30000

const isElastiCacheCluster = (url: string): boolean => {
  return url.includes('.cluster.') && url.includes('.cache.amazonaws.com')
}

const checkConnectionHealth = async (instance: RedisClient): Promise<boolean> => {
  try {
    const pong = await Promise.race([
      instance.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PING timeout')), 5000),
      ),
    ])
    return pong === 'PONG'
  } catch (error) {
    logger.warn('redis_health_check_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
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
    logger.warn('redis_connection_ended')
    client = null
  })
}

export const getRedisClient = async (): Promise<RedisClient | null> => {
  if (!config.redis.url) return null

  if (client) {
    const now = Date.now()
    if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL_MS) {
      const healthy = await checkConnectionHealth(client)
      if (!healthy) {
        logger.warn('redis_client_unhealthy_resetting')
        try {
          await client.quit().catch(() => {
            client.disconnect()
          })
        } catch {
        }
        client = null
      } else {
        lastHealthCheck = now
      }
    }
    if (client) {
      return client
    }
  }

  if (connecting) {
    return connecting
  }

  const isCluster = isElastiCacheCluster(config.redis.url)
  logger.debug('creating_redis_client', {
    is_lambda: isLambda,
    is_cluster: isCluster,
    url_prefix: config.redis.url.substring(0, 20),
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

  connecting = instance
    .connect()
    .then(async () => {
      const healthy = await checkConnectionHealth(instance)
      if (!healthy) {
        logger.error('redis_connect_health_check_failed')
        trackConnectionAttempt(false)
        trackConnectionFailure()
        await instance.quit().catch(() => {
          instance.disconnect()
        })
        connecting = null
        return null
      }

      client = instance
      lastHealthCheck = Date.now()
      registerRedisClient(instance, 'default')
      trackConnectionAttempt(true)
      logger.info('redis_connected', {
        is_lambda,
        is_cluster,
      })
      return instance
    })
    .catch((error) => {
      logger.error('redis_connect_failed', { error })
      trackConnectionAttempt(false)
      trackConnectionFailure()
      connecting = null
      return null
    })

  return connecting
}

export const disconnectRedis = async (): Promise<void> => {
  if (client) {
    try {
      await client.quit()
    } catch (error) {
      logger.warn('redis_quit_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      try {
        client.disconnect()
      } catch {
      }
    }
    client = null
    connecting = null
  }
}
