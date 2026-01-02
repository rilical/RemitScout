import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type { IProviderRepository, ProviderInput } from '../interfaces/provider-repository.interface'

export class ProviderRepository implements IProviderRepository {
  constructor(private readonly pool: Pool) {}

  async upsertProvider(input: ProviderInput): Promise<void> {
    await query(
      `INSERT INTO silver.provider (provider_id, display_name)
       VALUES ($1, $2)
       ON CONFLICT (provider_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         updated_at = NOW()`,
      [input.providerId, input.displayName],
      this.pool,
    )
  }
}
