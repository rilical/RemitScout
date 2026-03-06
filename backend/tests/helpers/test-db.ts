import type { Pool, PoolClient } from 'pg'
import { describe } from 'vitest'

export const dbIntegrationEnabled = process.env.ENABLE_DB_INTEGRATION_TESTS === '1'
export const describeDbIntegration = dbIntegrationEnabled ? describe : describe.skip

export const isDatabaseUnavailableError = (error: unknown): boolean => {
  const aggregateError = error as AggregateError & {
    code?: string
    errors?: Array<{ code?: string }>
    message?: string
  }
  const message = String(aggregateError?.message || '').toLowerCase()
  return (
    aggregateError?.code === 'ECONNREFUSED'
    || aggregateError?.errors?.some((entry) => entry?.code === 'ECONNREFUSED')
    || message.includes('authentication failed')
    || message.includes('password authentication failed')
    || message.includes('connect econnrefused')
  )
}

/**
 * Runs test logic inside a transaction and always rolls back afterwards.
 *
 * This helper is intended for integration tests where shared test DB state
 * must not leak between tests.
 */
export const withTestTransaction = async <T>(
  pool: Pool,
  fn: () => Promise<T>,
): Promise<T> => {
  const client = await pool.connect()
  const wrappedClient = new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'release') {
        return () => {
          // Intentionally no-op: this helper controls the client lifecycle.
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as unknown as PoolClient
  const poolAsMutable = pool as unknown as {
    query: Pool['query']
    connect: Pool['connect']
  }
  const originalQuery = pool.query.bind(pool)
  const originalConnect = pool.connect.bind(pool)
  try {
    // Route pool operations through a single client so BEGIN/ROLLBACK actually isolate the test.
    poolAsMutable.query = client.query.bind(client) as unknown as Pool['query']
    poolAsMutable.connect = (async () => wrappedClient) as unknown as Pool['connect']
    await client.query('BEGIN')
    const result = await fn()
    return result
  } finally {
    try {
      await client.query('ROLLBACK')
    } finally {
      poolAsMutable.query = originalQuery
      poolAsMutable.connect = originalConnect
      client.release()
    }
  }
}
