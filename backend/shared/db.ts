import { Pool } from 'pg'
import { config } from './config'

export const createPool = (connectionString?: string) => {
  return new Pool({
    connectionString: connectionString || config.db.url,
  })
}

const poolCache = new Map<string, Pool>()

export const getPool = (connectionString?: string) => {
  const key = connectionString || config.db.url
  const existing = poolCache.get(key)
  if (existing) {
    return existing
  }
  const pool = createPool(key)
  poolCache.set(key, pool)
  return pool
}

export const pool = getPool()

export const query = async <T = any>(text: string, params: any[] = [], poolInstance: Pool = pool) => {
  const result = await poolInstance.query<T>(text, params)
  return result
}
