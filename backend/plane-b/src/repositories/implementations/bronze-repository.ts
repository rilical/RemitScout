import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type { BronzeWriteInput, IBronzeRepository } from '../interfaces/bronze-repository.interface'

export class BronzeRepository implements IBronzeRepository {
  constructor(private readonly pool: Pool) {}

  async insertPayload(input: BronzeWriteInput): Promise<number | null> {
    const result = await query<{ id: number }>(
      `INSERT INTO bronze.provider_raw (provider_id, corridor, payload)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [input.providerId, input.corridorId, input.payload],
      this.pool,
    )
    return result.rows[0]?.id ?? null
  }
}
