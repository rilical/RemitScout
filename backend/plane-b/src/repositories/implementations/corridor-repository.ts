import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type { CorridorInput, ICorridorRepository } from '../interfaces/corridor-repository.interface'

export class CorridorRepository implements ICorridorRepository {
  constructor(private readonly pool: Pool) {}

  async insertIfMissing(input: CorridorInput): Promise<void> {
    await query(
      `INSERT INTO silver.corridor (corridor_id, source_country, dest_country, source_currency, dest_currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (corridor_id) DO NOTHING`,
      [
        input.corridorId,
        input.sourceCountry,
        input.destCountry,
        input.sourceCurrency,
        input.destCurrency,
      ],
      this.pool,
    )
  }

  async upsertCorridor(input: CorridorInput): Promise<void> {
    await query(
      `INSERT INTO silver.corridor (corridor_id, source_country, dest_country, source_currency, dest_currency)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (corridor_id) DO UPDATE SET
         source_country = EXCLUDED.source_country,
         dest_country = EXCLUDED.dest_country,
         source_currency = EXCLUDED.source_currency,
         dest_currency = EXCLUDED.dest_currency,
         updated_at = NOW()`,
      [
        input.corridorId,
        input.sourceCountry,
        input.destCountry,
        input.sourceCurrency,
        input.destCurrency,
      ],
      this.pool,
    )
  }
}
