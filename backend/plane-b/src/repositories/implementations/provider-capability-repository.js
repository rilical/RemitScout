"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderCapabilityRepository = void 0;
const db_1 = require("../../../../shared/db");
const repository_retry_1 = require("../../../../shared/repository-retry");
class ProviderCapabilityRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getCapability(providerId, corridorId) {
        const result = await (0, db_1.query)(`SELECT provider_id,
              corridor_id,
              payin_methods,
              payout_methods,
              is_supported,
              last_verified_at,
              source
         FROM silver.provider_corridor_capability
        WHERE provider_id = $1
          AND corridor_id = $2
        LIMIT 1`, [providerId, corridorId], this.pool);
        return result.rows[0] ?? null;
    }
    async getCapabilitiesForCorridor(corridorId) {
        const result = await (0, db_1.query)(`SELECT provider_id,
              corridor_id,
              payin_methods,
              payout_methods,
              is_supported,
              last_verified_at,
              source
         FROM silver.provider_corridor_capability
        WHERE corridor_id = $1`, [corridorId], this.pool);
        return result.rows;
    }
    async loadAllSupportedCapabilities() {
        const result = await (0, db_1.query)(`SELECT provider_id,
              corridor_id,
              payin_methods,
              payout_methods,
              is_supported,
              last_verified_at,
              source
         FROM silver.provider_corridor_capability
        WHERE is_supported = true`, [], this.pool);
        return result.rows;
    }
    async loadObservedCorridors(providerId) {
        const result = await (0, repository_retry_1.withRetry)(() => (0, db_1.query)(`SELECT corridor_id
         FROM silver.provider_corridor_capability
        WHERE provider_id = $1
          AND is_supported = true`, [providerId], this.pool));
        return result.rows;
    }
    async loadUnsupportedCorridors(providerId) {
        const result = await (0, repository_retry_1.withRetry)(() => (0, db_1.query)(`SELECT corridor_id
       FROM silver.provider_corridor_capability
       WHERE provider_id = $1
         AND is_supported = false`, [providerId], this.pool));
        return result.rows;
    }
    async loadUnsupportedCorridorsWithAge(providerId) {
        const result = await (0, db_1.query)(`SELECT corridor_id, last_verified_at
       FROM silver.provider_corridor_capability
       WHERE provider_id = $1
         AND is_supported = false`, [providerId], this.pool);
        return result.rows;
    }
    async upsertCapability(input) {
        await (0, db_1.query)(`INSERT INTO silver.provider_corridor_capability
       (provider_id, corridor_id, payin_methods, payout_methods, is_supported, source, last_verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         payin_methods = EXCLUDED.payin_methods,
         payout_methods = EXCLUDED.payout_methods,
         is_supported = EXCLUDED.is_supported,
         source = EXCLUDED.source,
         last_verified_at = EXCLUDED.last_verified_at,
         updated_at = NOW()`, [
            input.providerId,
            input.corridorId,
            input.payinMethods,
            input.payoutMethods,
            input.isSupported,
            input.source,
        ], this.pool);
    }
    async markCorridorUnsupported(providerId, corridorId, source) {
        await (0, db_1.query)(`INSERT INTO silver.provider_corridor_capability
       (provider_id, corridor_id, is_supported, source, last_verified_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (provider_id, corridor_id) DO UPDATE SET
         is_supported = EXCLUDED.is_supported,
         source = EXCLUDED.source,
         last_verified_at = EXCLUDED.last_verified_at,
         updated_at = NOW()`, [providerId, corridorId, false, source], this.pool);
    }
    async loadCoverageCorridors(minProviders) {
        const result = await (0, db_1.query)(`SELECT corridor_id
         FROM silver.provider_corridor_capability
        WHERE is_supported = true
        GROUP BY corridor_id
        HAVING COUNT(DISTINCT provider_id) >= $1`, [minProviders], this.pool);
        return result.rows;
    }
    async loadPriorityCorridors(providerId, tierVersion) {
        const version = tierVersion?.trim();
        if (version) {
            const result = await (0, repository_retry_1.withRetry)(() => (0, db_1.query)(`WITH tier_snapshot AS (
           SELECT corridor_id,
                  CASE
                    WHEN corridor_tier = 'tier_1' THEN 'tier_1'
                    ELSE 'tier_2'
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
          ORDER BY pcc.corridor_id`, [providerId, version], this.pool));
            return result.rows;
        }
        const result = await (0, repository_retry_1.withRetry)(() => (0, db_1.query)(`SELECT pcc.corridor_id, NULL::text AS priority_tier
         FROM silver.provider_corridor_capability pcc
        WHERE pcc.provider_id = $1
          AND pcc.is_supported = true
        ORDER BY pcc.corridor_id`, [providerId], this.pool));
        return result.rows;
    }
}
exports.ProviderCapabilityRepository = ProviderCapabilityRepository;
