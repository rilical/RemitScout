import { Pool } from 'pg'
import { config } from './config'

export const createPool = (connectionString?: string) => {
  return new Pool({
    connectionString: connectionString || config.db.url,
  })
}

export const pool = createPool()

export const query = async <T = any>(text: string, params: any[] = [], poolInstance: Pool = pool) => {
  const result = await poolInstance.query<T>(text, params)
  return result
}
