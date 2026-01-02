import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IProviderRateRepository,
  ProviderRateConfigInput,
  ProviderRateConfigRecord,
} from '../interfaces/provider-rate-repository.interface'

export class ProviderRateRepository implements IProviderRateRepository {
  constructor(private readonly pool: Pool) {}

  async getRates(providerId: string): Promise<ProviderRateConfigRecord | null> {
    const result = await query<ProviderRateConfigRecord>(
      `SELECT provider_id, rpm, per_corridor_rpm
         FROM silver.provider_rate_config
        WHERE provider_id = $1`,
      [providerId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async upsertRates(input: ProviderRateConfigInput): Promise<void> {
    await query(
      `INSERT INTO silver.provider_rate_config
       (provider_id, rpm, per_corridor_rpm, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (provider_id) DO UPDATE SET
         rpm = EXCLUDED.rpm,
         per_corridor_rpm = EXCLUDED.per_corridor_rpm,
         updated_at = NOW()`,
      [input.providerId, input.rpm, input.perCorridorRpm],
      this.pool,
    )
  }
}
