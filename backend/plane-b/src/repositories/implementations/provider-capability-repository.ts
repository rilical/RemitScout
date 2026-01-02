import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IProviderCapabilityRepository,
  ProviderCapabilityInput,
  ProviderCorridorPriorityRecord,
  ProviderCorridorRecord,
} from '../interfaces/provider-capability-repository.interface'

export class ProviderCapabilityRepository implements IProviderCapabilityRepository {
  constructor(private readonly pool: Pool) {}

  async loadObservedCorridors(providerId: string): Promise<ProviderCorridorRecord[]> {
    const result = await query<ProviderCorridorRecord>(
      `SELECT corridor_id
         FROM silver.provider_corridor_capability
        WHERE provider_id = $1
          AND is_supported = true`,
      [providerId],
      this.pool,
    )
    return result.rows
  }

  async loadUnsupportedCorridors(providerId: string): Promise<ProviderCorridorRecord[]> {
    const result = await query<ProviderCorridorRecord>(
      `SELECT corridor_id
       FROM silver.provider_corridor_capability
       WHERE provider_id = $1
         AND is_supported = false`,
      [providerId],
      this.pool,
    )
    return result.rows
  }

  async upsertCapability(input: ProviderCapabilityInput): Promise<void> {
    await query(
      `INSERT INTO silver.provider_corridor_capability
       (provider_id, corridor_id, payin_methods, payout_methods, is_supported, source, last_verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         payin_methods = EXCLUDED.payin_methods,
         payout_methods = EXCLUDED.payout_methods,
         is_supported = EXCLUDED.is_supported,
         source = EXCLUDED.source,
         last_verified_at = EXCLUDED.last_verified_at,
         updated_at = NOW()`,
      [
        input.providerId,
        input.corridorId,
        input.payinMethods,
        input.payoutMethods,
        input.isSupported,
        input.source,
      ],
      this.pool,
    )
  }

  async markCorridorUnsupported(
    providerId: string,
    corridorId: string,
    source: string,
  ): Promise<void> {
    await query(
      `INSERT INTO silver.provider_corridor_capability
       (provider_id, corridor_id, is_supported, source, last_verified_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         is_supported = EXCLUDED.is_supported,
         source = EXCLUDED.source,
         last_verified_at = EXCLUDED.last_verified_at,
         updated_at = NOW()`,
      [providerId, corridorId, false, source],
      this.pool,
    )
  }

  async loadCoverageCorridors(minProviders: number): Promise<ProviderCorridorRecord[]> {
    const result = await query<ProviderCorridorRecord>(
      `SELECT corridor_id
         FROM silver.provider_corridor_capability
        WHERE is_supported = true
        GROUP BY corridor_id
        HAVING COUNT(DISTINCT provider_id) >= $1`,
      [minProviders],
      this.pool,
    )
    return result.rows
  }

  async loadPriorityCorridors(
    providerId: string,
  ): Promise<ProviderCorridorPriorityRecord[]> {
    const result = await query<ProviderCorridorPriorityRecord>(
      `SELECT pcc.corridor_id, cp.priority_tier
         FROM silver.provider_corridor_capability pcc
         LEFT JOIN silver.corridor_priority cp
           ON cp.corridor_id = pcc.corridor_id
        WHERE pcc.provider_id = $1
          AND pcc.is_supported = true
        ORDER BY pcc.corridor_id`,
      [providerId],
      this.pool,
    )
    return result.rows
  }
}
