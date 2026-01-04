import { Pool } from 'pg'
import { createClient } from 'redis'
import { SQSClient } from '@aws-sdk/client-sqs'
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch'
import { createLogger } from './logger'

const logger = createLogger('shared.connection-manager')

type RedisClient = ReturnType<typeof createClient>
type ConnectionType = 'database' | 'redis' | 'sqs' | 'cloudwatch'

interface DatabaseConnection {
  type: 'database'
  pool: Pool
  name: string
}

interface RedisConnection {
  type: 'redis'
  client: RedisClient
  name: string
}

interface SQSConnection {
  type: 'sqs'
  client: SQSClient
  name: string
}

interface CloudWatchConnection {
  type: 'cloudwatch'
  client: CloudWatchClient
  name: string
}

type Connection =
  | DatabaseConnection
  | RedisConnection
  | SQSConnection
  | CloudWatchConnection

const connections = new Map<string, Connection>()

export const registerDatabasePool = (pool: Pool, name: string = 'default'): void => {
  const key = `db:${name}`
  connections.set(key, { type: 'database', pool, name })
  logger.debug('database_pool_registered', { name })
}

export const registerRedisClient = (client: RedisClient, name: string = 'default'): void => {
  const key = `redis:${name}`
  connections.set(key, { type: 'redis', client, name })
  logger.debug('redis_client_registered', { name })
}

export const registerSQSClient = (client: SQSClient, name: string = 'default'): void => {
  const key = `sqs:${name}`
  connections.set(key, { type: 'sqs', client, name })
  logger.debug('sqs_client_registered', { name })
}

export const registerCloudWatchClient = (
  client: CloudWatchClient,
  name: string = 'default',
): void => {
  const key = `cloudwatch:${name}`
  connections.set(key, { type: 'cloudwatch', client, name })
  logger.debug('cloudwatch_client_registered', { name })
}

export const unregisterConnection = (type: ConnectionType, name: string = 'default'): void => {
  const key = `${type}:${name}`
  connections.delete(key)
  logger.debug('connection_unregistered', { type, name })
}

export const cleanupAllConnections = async (): Promise<void> => {
  logger.info('cleaning_up_connections', { count: connections.size })

  const cleanupPromises: Promise<void>[] = []

  for (const [key, connection] of connections.entries()) {
    try {
      switch (connection.type) {
        case 'database': {
          const promise = connection.pool
            .end()
            .then(() => {
              logger.debug('database_pool_closed', { name: connection.name })
            })
            .catch((error) => {
              logger.warn('database_pool_close_failed', {
                name: connection.name,
                error: error instanceof Error ? error.message : String(error),
              })
            })
          cleanupPromises.push(promise)
          break
        }
        case 'redis': {
          const promise = connection.client
            .quit()
            .then(() => {
              logger.debug('redis_client_disconnected', { name: connection.name })
            })
            .catch((error) => {
              logger.warn('redis_client_disconnect_failed', {
                name: connection.name,
                error: error instanceof Error ? error.message : String(error),
              })
              try {
                connection.client.disconnect()
                logger.debug('redis_client_force_disconnected', { name: connection.name })
              } catch (disconnectError) {
                logger.warn('redis_client_force_disconnect_failed', {
                  name: connection.name,
                  error:
                    disconnectError instanceof Error
                      ? disconnectError.message
                      : String(disconnectError),
                })
              }
            })
          cleanupPromises.push(promise)
          break
        }
        case 'sqs':
        case 'cloudwatch':
          logger.debug('aws_client_skipped', { type: connection.type, name: connection.name })
          break
      }
    } catch (error) {
      logger.warn('connection_cleanup_error', {
        key,
        type: connection.type,
        name: connection.name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await Promise.allSettled(cleanupPromises)
  connections.clear()
  logger.info('connections_cleanup_complete')
}

export const healthCheckAllConnections = async (): Promise<{
  healthy: number
  unhealthy: number
  results: Array<{ type: ConnectionType; name: string; healthy: boolean; error?: string }>
}> => {
  const results: Array<{ type: ConnectionType; name: string; healthy: boolean; error?: string }> =
    []

  for (const connection of connections.values()) {
    try {
      let healthy = false
      switch (connection.type) {
        case 'database': {
          const result = await connection.pool.query('SELECT 1')
          healthy = result.rows.length === 1 && result.rows[0][0] === 1
          break
        }
        case 'redis': {
          const pong = await connection.client.ping()
          healthy = pong === 'PONG'
          break
        }
        case 'sqs':
        case 'cloudwatch':
          healthy = true
          break
      }
      results.push({ type: connection.type, name: connection.name, healthy })
    } catch (error) {
      results.push({
        type: connection.type,
        name: connection.name,
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const healthy = results.filter((r) => r.healthy).length
  const unhealthy = results.filter((r) => !r.healthy).length

  return { healthy, unhealthy, results }
}

export const listConnections = (): Array<{ type: ConnectionType; name: string }> => {
  return Array.from(connections.values()).map((conn) => ({
    type: conn.type,
    name: conn.name,
  }))
}

