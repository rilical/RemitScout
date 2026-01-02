import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type { IFxRateRepository } from '../interfaces/fx-rate-repository.interface'

export class FxRateRepository implements IFxRateRepository {
  constructor(private readonly pool: Pool) {}

  async getRate(baseCurrency: string, quoteCurrency: string): Promise<number | null> {
    const result = await query<{ rate: number }>(
      `SELECT rate FROM gold.fx_rates WHERE base_currency = $1 AND quote_currency = $2`,
      [baseCurrency, quoteCurrency],
      this.pool,
    )
    const row = result.rows[0]
    if (!row || row.rate === null || row.rate === undefined) {
      return null
    }
    const rate = Number(row.rate)
    return rate && Number.isFinite(rate) ? rate : null
  }
}
