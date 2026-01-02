import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IPulseCacheRepository,
  PulseCacheEntryInput,
} from '../interfaces/pulse-cache-repository.interface'

export class PulseCacheRepository implements IPulseCacheRepository {
  constructor(private readonly pool: Pool) {}

  async upsertEntry(input: PulseCacheEntryInput): Promise<void> {
    await query(
      `INSERT INTO gold.pulse_cache (key, payload)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET
         payload = EXCLUDED.payload,
         updated_at = NOW()`,
      [input.key, input.payload],
      this.pool,
    )
  }
}
