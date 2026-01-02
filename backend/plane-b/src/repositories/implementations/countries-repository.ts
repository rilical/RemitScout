import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type { CountryInput, ICountriesRepository } from '../interfaces/countries-repository.interface'

export class CountriesRepository implements ICountriesRepository {
  constructor(private readonly pool: Pool) {}

  async upsertCountry(input: CountryInput): Promise<void> {
    await query(
      `INSERT INTO silver.countries (code, name, currency)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, currency = EXCLUDED.currency`,
      [input.code, input.name, input.currency],
      this.pool,
    )
  }
}
