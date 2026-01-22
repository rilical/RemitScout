import type { Pool } from 'pg'

import { query } from '../../../../shared/db'
import type {
  IProviderCapabilityRepository,
  ProviderCapabilityInput,
  ProviderCapabilityRecord,
  ProviderCorridorPriorityRecord,
  ProviderCorridorRecord,
  ProviderUnsupportedCorridorRecord,
} from '../interfaces/provider-capability-repository.interface'

export class ProviderCapabilityRepository implements IProviderCapabilityRepository {
  constructor(private readonly pool: Pool) {}

  async getCapability(
    providerId: string,
    corridorId: string,
  ): Promise<ProviderCapabilityRecord | null> {
    const result = await query<ProviderCapabilityRecord>(
      `SELECT provider_id,
              corridor_id,
              payin_methods,
              payout_methods,
              is_supported,
              last_verified_at,
              source
         FROM silver.provider_corridor_capability
        WHERE provider_id = $1
          AND corridor_id = $2
        LIMIT 1`,
      [providerId, corridorId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

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

  async loadUnsupportedCorridorsWithAge(providerId: string): Promise<ProviderUnsupportedCorridorRecord[]> {
    const result = await query<ProviderUnsupportedCorridorRecord>(
      `SELECT corridor_id, last_verified_at
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
    tierVersion?: string,
  ): Promise<ProviderCorridorPriorityRecord[]> {
    const version = tierVersion?.trim()
    if (version) {
      const result = await query<ProviderCorridorPriorityRecord>(
        `WITH tier_snapshot AS (
           SELECT corridor_id,
                  CASE
                    WHEN corridor_tier = 'tier_1' THEN 'tier_1_alpha'
                    WHEN corridor_tier = 'tier_2' THEN 'tier_2_reference'
                    ELSE 'tier_3_discovery'
                  END AS priority_tier
             FROM silver.corridor_tier_snapshot
            WHERE tier_version = $2
         )
         SELECT pcc.corridor_id, ts.priority_tier
           FROM silver.provider_corridor_capability pcc
           LEFT JOIN tier_snapshot ts
             ON ts.corridor_id = pcc.corridor_id
          WHERE pcc.provider_id = $1
            AND pcc.is_supported = true
          ORDER BY pcc.corridor_id`,
        [providerId, version],
        this.pool,
      )
      return result.rows
    }

    const result = await query<ProviderCorridorPriorityRecord>(
      `SELECT pcc.corridor_id, NULL::text AS priority_tier
         FROM silver.provider_corridor_capability pcc
        WHERE pcc.provider_id = $1
          AND pcc.is_supported = true
        ORDER BY pcc.corridor_id`,
      [providerId],
      this.pool,
    )
    return result.rows
  }
}
