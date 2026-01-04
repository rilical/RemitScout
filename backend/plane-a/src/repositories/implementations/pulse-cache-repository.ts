import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IPulseCacheRepository,
  PulseCacheRecord,
} from '../interfaces/pulse-cache-repository.interface'

export class PulseCacheRepository implements IPulseCacheRepository {
  constructor(private readonly pool: Pool) {}

  async getEntry(key: string): Promise<PulseCacheRecord | null> {
    const result = await query<PulseCacheRecord>(
      `SELECT key, payload, updated_at
         FROM gold.pulse_cache
        WHERE key = $1`,
      [key],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async getEntries(keys: string[]): Promise<PulseCacheRecord[]> {
    if (!keys.length) return []
    const result = await query<PulseCacheRecord>(
      `SELECT key, payload, updated_at
         FROM gold.pulse_cache
        WHERE key = ANY($1)`,
      [keys],
      this.pool,
    )
    return result.rows
  }
}
