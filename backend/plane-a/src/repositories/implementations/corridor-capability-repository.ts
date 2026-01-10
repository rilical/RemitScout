import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  CorridorCapabilityRecord,
  ICorridorCapabilityRepository,
} from '../interfaces/corridor-capability-repository.interface'

export class CorridorCapabilityRepository implements ICorridorCapabilityRepository {
  constructor(private readonly pool: Pool) {}

  async listByCorridor(corridorId: string): Promise<CorridorCapabilityRecord[]> {
    const result = await query<CorridorCapabilityRecord>(
      `SELECT provider_id,
              payin_methods,
              payout_methods,
              is_supported
         FROM silver.provider_corridor_capability
        WHERE corridor_id = $1`,
      [corridorId],
      this.pool,
    )
    return result.rows
  }

  async listSupportedProviderIds(
    corridorId: string,
    payinMethod: string,
    payoutMethod: string,
  ): Promise<string[]> {
    const result = await query<{ provider_id: string }>(
      `SELECT provider_id
         FROM silver.provider_corridor_capability
        WHERE corridor_id = $1
          AND is_supported = true
          AND (
            payin_methods IS NULL
            OR array_length(payin_methods, 1) = 0
            OR $2 = ANY(payin_methods)
          )
          AND (
            payout_methods IS NULL
            OR array_length(payout_methods, 1) = 0
            OR $3 = ANY(payout_methods)
          )`,
      [corridorId, payinMethod, payoutMethod],
      this.pool,
    )
    return result.rows.map(row => row.provider_id).filter(Boolean)
  }
}
