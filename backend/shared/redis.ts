import { createClient, type RedisClientType } from 'redis'

import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('shared.redis')

let client: RedisClientType | null = null
let connecting: Promise<RedisClientType | null> | null = null

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!config.redis.url) return null
  if (client) return client
  if (connecting) return connecting

  const instance = createClient({ url: config.redis.url })
  instance.on('error', (error) => {
    logger.error('redis_error', { error })
  })

  connecting = instance.connect()
    .then(() => {
      client = instance
      return instance
    })
    .catch((error) => {
      logger.error('redis_connect_failed', { error })
      connecting = null
      return null
    })

  return connecting
}
