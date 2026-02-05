import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IRightsMatrixRepository,
  RightsMatrixProviderRecord,
  RightsMatrixIndexPermissionRecord,
} from '../interfaces/rights-matrix-repository.interface'

export class RightsMatrixRepository implements IRightsMatrixRepository {
  constructor(private readonly pool: Pool) {}

  async listActiveB2cProviders(): Promise<RightsMatrixProviderRecord[]> {
    const result = await query<RightsMatrixProviderRecord>(
      `SELECT provider_id
         FROM silver.rights_matrix
        WHERE allowed_b2c = true
          AND allowed_collect = true
          AND stoplist_status = 'active'`,
      [],
      this.pool,
    )
    return result.rows
  }

  async listActiveB2cProvidersByCountry(
    sourceCountry: string,
    destCountry: string,
  ): Promise<RightsMatrixProviderRecord[]> {
    const result = await query<RightsMatrixProviderRecord>(
      `SELECT provider_id
         FROM silver.rights_matrix
        WHERE allowed_b2c = true
          AND allowed_collect = true
          AND stoplist_status = 'active'
          AND (
            source_countries IS NOT NULL
            AND array_length(source_countries, 1) > 0
            AND $1 = ANY(source_countries)
          )
          AND (
            (
              destination_countries IS NOT NULL
              AND array_length(destination_countries, 1) > 0
              AND $2 = ANY(destination_countries)
            )
            OR provider_id = 'wise'
          )`,
      [sourceCountry, destCountry],
      this.pool,
    )
    return result.rows
  }

  async listIndexPermissionsByProviders(
    providerIds: string[],
  ): Promise<RightsMatrixIndexPermissionRecord[]> {
    if (!providerIds.length) {
      return []
    }
    const result = await query<RightsMatrixIndexPermissionRecord>(
      `SELECT provider_id,
              allowed_in_teer,
              allowed_in_rci,
              allowed_in_rvi,
              allowed_collect,
              allowed_b2c,
              stoplist_status
         FROM silver.rights_matrix
        WHERE provider_id = ANY($1::text[])`,
      [providerIds],
      this.pool,
    )
    return result.rows
  }
}
