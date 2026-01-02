import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type { FxRateInput, IFxRateRepository } from '../interfaces/fx-rate-repository.interface'

export class FxRateRepository implements IFxRateRepository {
  constructor(private readonly pool: Pool) {}

  async upsertRate(input: FxRateInput): Promise<void> {
    await query(
      `INSERT INTO gold.fx_rates (base_currency, quote_currency, rate)
       VALUES ($1, $2, $3)
       ON CONFLICT (base_currency, quote_currency) DO UPDATE SET
         rate = EXCLUDED.rate,
         updated_at = NOW()`,
      [input.baseCurrency, input.quoteCurrency, input.rate],
      this.pool,
    )
  }
}
