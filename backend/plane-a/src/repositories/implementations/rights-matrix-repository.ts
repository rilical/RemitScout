import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  IRightsMatrixRepository,
  RightsMatrixProviderRecord,
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
            source_countries IS NULL
            OR array_length(source_countries, 1) IS NULL
            OR $1 = ANY(source_countries)
          )
          AND (
            destination_countries IS NULL
            OR array_length(destination_countries, 1) IS NULL
            OR $2 = ANY(destination_countries)
            OR provider_id = 'wise'
          )`,
      [sourceCountry, destCountry],
      this.pool,
    )
    return result.rows
  }
}
