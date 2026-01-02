import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  FxProviderRateInput,
  IFxProviderRateRepository,
} from '../interfaces/fx-provider-rate-repository.interface'

export class FxProviderRateRepository implements IFxProviderRateRepository {
  constructor(private readonly pool: Pool) {}

  async upsertRate(input: FxProviderRateInput): Promise<void> {
    await query(
      `INSERT INTO gold.fx_provider_rates (provider_name, base_currency, quote_currency, rate, markup_bps, speed)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (provider_name, base_currency, quote_currency) DO UPDATE SET
         rate = EXCLUDED.rate,
         markup_bps = EXCLUDED.markup_bps,
         speed = EXCLUDED.speed,
         updated_at = NOW()`,
      [
        input.providerName,
        input.baseCurrency,
        input.quoteCurrency,
        input.rate,
        input.markupBps,
        input.speed,
      ],
      this.pool,
    )
  }
}
