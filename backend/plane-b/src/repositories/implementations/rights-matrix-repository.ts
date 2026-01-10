import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IRightsMatrixRepository,
  RightsMatrixCountrySupportInput,
  RightsMatrixEntryRecord,
  RightsMatrixStatusRecord,
  RightsMatrixStoplistRecord,
  RightsMatrixUpsertInput,
} from '../interfaces/rights-matrix-repository.interface'

export class RightsMatrixRepository implements IRightsMatrixRepository {
  constructor(private readonly pool: Pool) {}

  async pauseProvider(providerId: string, notes: string): Promise<void> {
    await query(
      `INSERT INTO silver.rights_matrix
       (provider_id, stoplist_status, notes)
       VALUES ($1, 'paused', $2)
       ON CONFLICT (provider_id) DO UPDATE SET
         stoplist_status = 'paused',
         notes = EXCLUDED.notes,
         updated_at = NOW()`,
      [providerId, notes],
      this.pool,
    )
  }

  async getProviderStatus(providerId: string): Promise<RightsMatrixStatusRecord | null> {
    const result = await query<RightsMatrixStatusRecord>(
      `SELECT stoplist_status, notes
         FROM silver.rights_matrix
        WHERE provider_id = $1`,
      [providerId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async setProviderActive(providerId: string): Promise<void> {
    await query(
      `UPDATE silver.rights_matrix
          SET stoplist_status = 'active',
              notes = NULL,
              updated_at = NOW()
        WHERE provider_id = $1`,
      [providerId],
      this.pool,
    )
  }

  async loadProviderRights(): Promise<RightsMatrixEntryRecord[]> {
    const result = await query<RightsMatrixEntryRecord>(
      `SELECT provider_id, allowed_collect, allowed_b2c, allowed_b2b, stoplist_status
         FROM silver.rights_matrix`,
      [],
      this.pool,
    )
    return result.rows
  }

  async upsertProviderRights(input: RightsMatrixUpsertInput): Promise<void> {
    await query(
      `INSERT INTO silver.rights_matrix (provider_id, allowed_collect, allowed_b2c, allowed_b2b, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider_id) DO UPDATE SET
         allowed_collect = EXCLUDED.allowed_collect,
         allowed_b2c = EXCLUDED.allowed_b2c,
         allowed_b2b = EXCLUDED.allowed_b2b,
         notes = EXCLUDED.notes,
         updated_at = NOW()`,
      [
        input.providerId,
        input.allowedCollect,
        input.allowedB2c,
        input.allowedB2b,
        input.notes,
      ],
      this.pool,
    )
  }

  async upsertProviderCountrySupport(input: RightsMatrixCountrySupportInput): Promise<void> {
    await query(
      `INSERT INTO silver.rights_matrix (provider_id, source_countries, destination_countries)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider_id) DO UPDATE SET
         source_countries = EXCLUDED.source_countries,
         destination_countries = EXCLUDED.destination_countries,
         updated_at = NOW()`,
      [input.providerId, input.sourceCountries, input.destinationCountries],
      this.pool,
    )
  }

  async loadStoplistStatuses(): Promise<RightsMatrixStoplistRecord[]> {
    const result = await query<RightsMatrixStoplistRecord>(
      'SELECT provider_id, stoplist_status FROM silver.rights_matrix',
      [],
      this.pool,
    )
    return result.rows
  }
}
