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
}
