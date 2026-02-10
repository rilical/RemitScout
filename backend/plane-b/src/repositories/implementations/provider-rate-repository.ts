import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IProviderRateRepository,
  ProviderRateConfigInput,
  ProviderRateConfigRecord,
} from '../interfaces/provider-rate-repository.interface'

const MAX_PERSISTED_RPM = 100000

const clampPersistedRpm = (value: number, field: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${field}: must be finite (value=${value})`)
  }
  if (value <= 0) {
    throw new Error(`Invalid ${field}: must be > 0 (value=${value})`)
  }
  return Math.min(MAX_PERSISTED_RPM, Math.max(1, Math.round(value)))
}

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
    const rpm = clampPersistedRpm(input.rpm, 'rpm')
    const perCorridorRpm = clampPersistedRpm(input.perCorridorRpm, 'perCorridorRpm')
    await query(
      `INSERT INTO silver.provider_rate_config
       (provider_id, rpm, per_corridor_rpm, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (provider_id) DO UPDATE SET
         rpm = EXCLUDED.rpm,
         per_corridor_rpm = EXCLUDED.per_corridor_rpm,
         updated_at = NOW()`,
      [input.providerId, rpm, perCorridorRpm],
      this.pool,
    )
  }
}
